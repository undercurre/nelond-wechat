import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  othersBinding,
  roomBinding,
  userBinding,
  homeBinding,
  deviceBinding,
  homeStore,
  othersStore,
  roomStore,
  deviceStore,
} from '../../store/index'
import { storage, throttle, emitter, WSEventType, showLoading, hideLoading, strUtil, delay } from '../../utils/index'
import { PRO_TYPE, ROOM_CARD_H, ROOM_CARD_M, defaultImgDir } from '../../config/index'
import { allDevicePowerControl, updateRoomSort, updateDefaultHouse, changeUserHouse } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'

type PosType = Record<'index' | 'y', number>

/**
 * 根据index计算坐标位置
 * @returns {x, y}
 */
function getPos(index: number): number {
  return index * ROOM_CARD_M
}

/**
 * 根据坐标位置计算index
 * TODO 防止超界
 * @returns index
 */
function getIndex(y: number) {
  const maxIndex = roomStore.roomList.length - 1 // 防止越界
  return Math.max(0, Math.min(maxIndex, Math.floor((y + ROOM_CARD_M / 2) / ROOM_CARD_M)))
}

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, homeBinding, deviceBinding] }),
    pageBehavior,
  ],
  data: {
    defaultImgDir,
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    // 状态栏高度
    statusBarHeight: storage.get<number>('statusBarHeight') + 'px',
    // 可滚动区域高度
    scrollViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      90 - // 开关、添加按钮
      (storage.get<number>('navigationBarHeight') as number),
    _system: storage.get('system') as string,
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    addMenu: {
      right: '0px',
      y: '0px',
      isShow: false,
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewRoom: false,
    showHomeSelect: false,
    loading: true,
    _isAcceptShare: false, // 是否已经触发过接受分享逻辑
    isMoving: false,
    roomPos: {} as Record<string, PosType>,
    accumulatedY: 0, // 可移动区域高度
    placeholder: {
      y: 0,
      index: -1,
    } as PosType,
    scrollTop: 0,
    _scrolledWhenMoving: false, // 拖拽时，被动发生了滚动
    _lastClientY: 0, // 上次触控采样时 的Y坐标
    _isFirstShow: true, // 是否首次加载
  },
  computed: {
    currentHomeName(data) {
      if (data.currentHomeDetail && data.currentHomeDetail.houseName) {
        if (data.currentHomeDetail.houseName.length > 6) {
          return data.currentHomeDetail.houseName.slice(0, 6) + '...'
        }
        return data.currentHomeDetail?.houseName
      }
      return ''
    },
    // 家庭是否有设备
    hasDevice(data) {
      if (data.allRoomDeviceList) {
        return data.allRoomDeviceList.length
      }
      return false
    },
    // 是否显示全局控制开关（需要有灯或者开关）
    isShowHomeControl(data) {
      if (!data.allRoomDeviceList?.length) {
        return false
      }
      const lightTypes = [PRO_TYPE.light, PRO_TYPE.switch, PRO_TYPE.bathHeat, PRO_TYPE.clothesDryingRack] as string[]
      return data.allRoomDeviceList.some((device: Device.DeviceItem) => lightTypes.includes(device.proType))
    },
  },
  watch: {
    isInit(data) {
      // 如果已初始化，但仍在loading
      if (this.data.loading && data) {
        this.setData({ loading: !data })
      }
    },
    roomList() {
      this.renewRoomPos()
    },
  },

  methods: {
    // 生命周期或者其他钩子
    onLoad() {
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0,
        })
      }
      if (othersStore.isInit) {
        this.setData({
          loading: false,
        })
      }
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
      emitter.off('wsReceive')
    },
    async onShow() {
      if (!this.data._isFirstShow) {
        homeStore.updateRoomCardList()
      }
      this.data._isFirstShow = false

      setTimeout(() => {
        this.acceptShare()
      }, 1000)
      if (!othersStore.isInit) {
        this.setData({
          loading: true,
        })
      }
      emitter.off('wsReceive')
      emitter.on('wsReceive', (res) => {
        if (res.result.eventType === 'device_property') {
          // 如果有传更新的状态数据过来，直接更新store
          if (res.result.eventData.event && res.result.eventData.deviceId && res.result.eventData.modelName) {
            const device = deviceStore.allRoomDeviceList.find(
              (device) => device.deviceId === res.result.eventData.deviceId,
            )
            if (device) {
              runInAction(() => {
                device.mzgdPropertyDTOList[res.result.eventData.modelName] = {
                  ...device.mzgdPropertyDTOList[res.result.eventData.modelName],
                  ...res.result.eventData.event,
                }
              })

              this.updateRoomCard()

              // 直接更新store里的数据，更新完退出回调函数
              return
            }
          }
        }
        // Perf: ws消息很多，改用白名单过滤
        else if (
          [
            WSEventType.device_del,
            WSEventType.device_replace,
            WSEventType.device_online_status,
            WSEventType.device_offline_status,
            WSEventType.bind_device,
            WSEventType.scene_device_result_status,
            WSEventType.group_device_result_status,
          ].includes(res.result.eventType)
        ) {
          this.updateRoomDataThrottle()
        }
      })

      // 房间选择恢复默认
      if (roomStore.currentRoomIndex) {
        runInAction(() => {
          roomStore.currentRoomIndex = 0
        })
      }
    },

    // 节流更新房间卡片信息
    updateRoomDataThrottle: throttle(() => {
      homeStore.updateRoomCardList()
    }, 3000),

    // 节流更新房间卡片信息
    updateRoomCard: throttle(() => {
      roomStore.updateRoomCardLightOnNum()
    }, 2000),

    /**
     * @description 生成房间位置
     * @param isMoving 是否正在拖动
     */
    renewRoomPos(isMoving = false) {
      const currentIndex = this.data.placeholder.index
      const roomPos = {} as Record<string, PosType>
      let accumulatedY = 0
      roomStore.roomList
        .sort((a, b) => this.data.roomPos[a.roomId]?.index - this.data.roomPos[b.roomId]?.index)
        .forEach((room, index) => {
          roomPos[room.roomId] = {
            index,
            // 正在拖的卡片，不改变位置
            y: currentIndex === index ? this.data.roomPos[room.roomId].y : accumulatedY,
          }
          // 若场景列表为空，或正在拖动，则使用 ROOM_CARD_M
          accumulatedY += !room.sceneList.length || isMoving === true ? ROOM_CARD_M : ROOM_CARD_H
        })

      // 拖动模式，不改变高度
      if (isMoving) {
        this.setData({
          roomPos,
        })
      } else {
        this.setData({
          roomPos,
          accumulatedY,
        })
      }
    },

    acceptShare() {
      if (!this.data.isLogin) {
        return
      }

      if (this.data._isAcceptShare) {
        console.log('已触发过接受分享逻辑')
        return
      }

      this.inviteMember()

      this.accetHomeTransfer()
    },

    inviteMember() {
      const enterOption = wx.getEnterOptionsSync()

      if (enterOption.scene != 1007 && enterOption.scene != 1044) {
        return
      }
      const enterQuery = enterOption.query
      const token = storage.get('token', '')
      const type = enterQuery.type as string
      const houseId = enterQuery.houseId as string
      const time = enterQuery.time as string
      const shareId = enterQuery.shareId as string
      if (token && type && type !== 'transferHome' && houseId && time) {
        this.data._isAcceptShare = true
        console.log(`lmn>>>邀请参数:token=${token}/type=${type}/houseId=${houseId}/time=${time}/shareId=${shareId}`)
        for (let i = 0; i < homeBinding.store.homeList.length; i++) {
          if (homeBinding.store.homeList[i].houseId == houseId) {
            console.log('lmn>>>已经在该家庭')
            return
          }
        }
        const now = new Date().valueOf()
        // 邀请链接一天单次有效
        if (now - parseInt(time) > 86400000) {
          console.log('lmn>>>邀请超时')
          Dialog.confirm({
            title: '邀请过期',
            message: '该邀请已过期，请联系邀请者重新邀请',
            confirmButtonText: '我知道了',
            showCancelButton: false,
            zIndex: 9999,
          })
        } else {
          homeBinding.store
            .inviteMember(houseId, parseInt(type), shareId)
            .then(() => {
              console.log('lmn>>>邀请成功')
              updateDefaultHouse(houseId).finally(() => {
                homeStore.updateHomeInfo().then(() => {
                  homeStore.homeList.forEach((item) => {
                    if (item.houseId == houseId) {
                      Toast(`您已加入${item.houseName}的家`)
                      return
                    }
                  })
                  Toast('您已加入家庭')

                  // 刷新房间和设备列表
                  homeStore.updateRoomCardList()
                })
              })
            })
            .catch((error) => {
              console.error('inviteMember', error)
              if (error.code === 9870) {
                Toast('分享链接已失效')
              } else {
                Toast(error.msg)
              }
            })
        }
      } else {
        console.log('lmn>>>无效邀请参数')
      }
    },

    /**
     * 接受家庭转让逻辑
     */
    async accetHomeTransfer() {
      const params = wx.getEnterOptionsSync()
      const scene = params.scene
      console.log('wx.getEnterOptionsSync()', params)

      let enterQuery: IAnyObject

      if (scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        console.log('scanUrl', scanUrl)

        enterQuery = strUtil.getUrlParams(scanUrl)
      } else if (scene === 1007 || scene === 1044) {
        enterQuery = params.query
      } else {
        return
      }

      const type = enterQuery.type as string
      const houseId = enterQuery.houseId as string
      const expireTime = enterQuery.expireTime as string
      const shareId = enterQuery.shareId as string
      const oldUserId = enterQuery.userId as string

      console.log('enterQuery:', enterQuery)
      if (type !== 'transferHome') {
        console.log('非家庭转让逻辑')
        return
      }

      const home = homeBinding.store.homeList.find((item) => item.houseId === houseId && item.houseCreatorFlag)

      if (home) {
        console.log('当前用户已经是对应家庭的创建者')
        return
      }

      const now = new Date().valueOf()
      // 判断链接是否过期
      if (now > parseInt(expireTime)) {
        Dialog.confirm({
          title: '该消息过期',
          message: '该消息已过期，请联系创建者重新发送',
          confirmButtonText: '我知道了',
          showCancelButton: false,
          zIndex: 9999,
        })

        return
      }

      showLoading()
      const res = await changeUserHouse({ houseId, type: 2, shareId, changeUserId: oldUserId })
      hideLoading()

      if (res.success) {
        await updateDefaultHouse(houseId)

        await homeBinding.store.updateHomeInfo()

        Dialog.confirm({
          title: '你已成为当前家庭的创建者',
          message: '家庭无线局域网如发生变更，家庭内的所有设备将会离线，可在智慧屏上修改连接的无线局域网。',
          confirmButtonText: '我知道了',
          showCancelButton: false,
          zIndex: 9999,
        })
      } else if (res.code === 9870) {
        Toast('分享链接已失效')
      } else {
        Toast(res.msg)
      }

      this.data._isAcceptShare = true
    },

    // 收起所有菜单
    hideMenu() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
    },
    /**
     * 跳转到登录页
     */
    toLogin() {
      wx.navigateTo({
        url: '/pages/login/index',
      })
    },
    /**
     * 点击全屋开按钮
     */
    handleAllOn() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      allDevicePowerControl({
        houseId: homeStore.currentHomeId,
        onOff: 1,
      })
    },
    /**
     * 点击全屋关按钮
     */
    async handleAllOff() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      const _old_light_on_in_house = roomStore.lightOnInHouse // 控制前的亮灯数
      allDevicePowerControl({ houseId: homeStore.currentHomeId, onOff: 0 })

      await delay(3000)
      wx.reportEvent('home_all_off', {
        house_id: homeStore.currentHomeId,
        light_on_in_house: _old_light_on_in_house,
        light_on_after_seconds: roomStore.lightOnInHouse,
      })
    },
    /**
     * 用户切换家庭
     */
    handleHomeSelect() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏家庭选择
     */
    handleShowHomeSelectMenu() {
      const diffData = {} as IAnyObject
      diffData.selectHomeMenu = {
        x: '28rpx',
        y:
          (storage.get<number>('statusBarHeight') as number) +
          (storage.get<number>('navigationBarHeight') as number) +
          8 +
          'px',
        isShow: !this.data.selectHomeMenu.isShow,
      }

      // 关闭已打开的其他菜单
      if (!this.data.selectHomeMenu.isShow && this.data.addMenu.isShow) {
        diffData['addMenu.isShow'] = false
      }

      this.setData(diffData)
    },
    /**
     * 隐藏添加房间popup
     */
    handleHideAddNewRoom() {
      this.setData({
        showAddNewRoom: false,
      })
    },

    showAddMenu() {
      this.setData({
        addMenu: {
          right: '25rpx',
          y:
            (storage.get<number>('statusBarHeight') as number) +
            (storage.get<number>('navigationBarHeight') as number) +
            50 +
            'px',
          isShow: !this.data.addMenu.isShow,
        },
        'selectHomeMenu.isShow': false,
      })
    },

    // 开始拖拽
    movableLongpress(e: WechatMiniprogram.TouchEvent) {
      wx.vibrateShort({ type: 'heavy' })

      const rid = e.currentTarget.dataset.rid
      const index = this.data.roomPos[rid].index

      const diffData = {} as IAnyObject
      diffData.isMoving = true
      diffData.placeholder = {
        index,
        y: getPos(index),
      }

      console.log('[movableTouchStart] diffData: ', diffData)

      this.setData(diffData)

      this.renewRoomPos(true)

      // 执行一次，防止出现空白位置
      this.movableChangeThrottle(e)
    },

    /**
     * 拖拽时触发的卡片移动效果
     */
    movableChangeThrottle: throttle(function (this: IAnyObject, e: WechatMiniprogram.TouchEvent) {
      const TOP_HEIGHT = 170
      const posY = (e.detail.y || e.touches[0]?.clientY) - TOP_HEIGHT + this.data.scrollTop
      const targetOrder = getIndex(posY)
      if (this.data.placeholder.index === targetOrder) {
        return
      }

      const oldOrder = this.data.placeholder.index
      // 节流操作，可能导致movableTouchEnd后仍有movableChange需要执行，丢弃掉
      if (oldOrder < 0) {
        return
      }
      console.log('[movableChange] %d --> %d, posY: %s', oldOrder, targetOrder, posY, e)

      // 更新placeholder的位置
      const isForward = oldOrder < targetOrder
      const diffData = {} as IAnyObject
      diffData[`placeholder.index`] = targetOrder
      diffData[`placeholder.y`] = getPos(targetOrder)

      // 更新联动卡片的位置
      let moveCount = 0
      for (const room of roomStore.roomList) {
        const _orderNum = this.data.roomPos[room.roomId].index
        if (
          (isForward && _orderNum > oldOrder && _orderNum <= targetOrder) ||
          (!isForward && _orderNum >= targetOrder && _orderNum < oldOrder)
        ) {
          ++moveCount
          const dOrderNum = isForward ? _orderNum - 1 : _orderNum + 1
          diffData[`roomPos.${room.roomId}.y`] = getPos(dOrderNum)
          diffData[`roomPos.${room.roomId}.index`] = dOrderNum

          // 减少遍历消耗
          if (moveCount >= Math.abs(targetOrder - oldOrder)) {
            break
          }
        }
      }

      // 直接更新被拖拽卡片位置
      if (this.data._scrolledWhenMoving || this.data._system.indexOf('iOS') > -1) {
        const rid = e.currentTarget.dataset.rid
        diffData[`roomPos.${rid}.y`] = getPos(targetOrder)
      }

      // 更新被拖拽卡片的排序num
      diffData[`roomPos.${e.currentTarget.dataset.rid}.index`] = targetOrder

      // FIXME 自动滚动
      // const dir = clientY > this.data._lastClientY ? 'down' : 'up'
      // let { scrollTop } = this.data
      // this.data._lastClientY = clientY
      // if (dir === 'up' && clientY < 200) {
      //   scrollTop -= 50
      // } else if (dir === 'down' && clientY > this.data.scrollViewHeight + 50) {
      //   scrollTop += 50
      // }
      // diffData.scrollTop = scrollTop

      console.log('[movableChange] diffData:', diffData)
      this.setData(diffData)
    }, 50),

    movableTouchMove(e: WechatMiniprogram.TouchEvent) {
      this.movableChangeThrottle(e)
    },

    movableTouchEnd(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isMoving) {
        return
      }
      const dpos = this.data.placeholder.y

      const diffData = {} as IAnyObject
      diffData.isMoving = false

      // 修正卡片位置
      diffData[`roomPos.${e.currentTarget.dataset.rid}.y`] = dpos
      diffData[`placeholder.index`] = -1
      this.setData(diffData)
      console.log('movableTouchEnd:', diffData)

      this.renewRoomPos()
      setTimeout(() => this.renewRoomPos(), 500)

      this.data._scrolledWhenMoving = false

      this.handleSortSaving()
    },

    // 页面滚动
    onPageScroll(e: { detail: { scrollTop: number } }) {
      if (this.data.isMoving || !e?.detail) {
        this.data._scrolledWhenMoving = true
        console.log('scrolled when moving', e)
        return
      }

      const { scrollTop } = e.detail
      console.log('onPageScroll scrollTop: %s, _lastClientY: %s', scrollTop, this.data._lastClientY)
      this.data.scrollTop = scrollTop
    },

    handleSortSaving() {
      const roomSortList = [] as Room.RoomSort[]
      Object.keys(this.data.roomPos).forEach((roomId) => {
        roomSortList.push({
          roomId,
          sort: this.data.roomPos[roomId].index + 1,
        })
      })

      // 更新云端排序
      updateRoomSort(roomSortList)

      // 更新store排序
      const list = [] as Room.RoomInfo[]
      roomStore.roomList.forEach((room) => {
        const { index } = this.data.roomPos[room.roomId]
        list[index] = room
      })
      runInAction(() => {
        roomStore.roomList = list
      })
    },
  },
})
