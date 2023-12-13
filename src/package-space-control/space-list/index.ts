import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  othersBinding,
  roomBinding,
  userBinding,
  projectStore,
  projectBinding,
  othersStore,
  spaceStore,
  deviceStore,
} from '../../store/index'
import { storage, throttle } from '../../utils/index'
import { ROOM_CARD_H, defaultImgDir } from '../../config/index'
import { updateRoomSort } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'

type PosType = Record<'index' | 'y', number>

/**
 * 根据index计算坐标位置
 * @returns {x, y}
 */
function getPos(index: number): number {
  return index * ROOM_CARD_H
}

/**
 * 根据坐标位置计算index
 * TODO 防止超界
 * @returns index
 */
function getIndex(y: number) {
  const maxIndex = spaceStore.spaceList.length - 1 // 防止越界
  return Math.max(0, Math.min(maxIndex, Math.floor((y + ROOM_CARD_H / 2) / ROOM_CARD_H)))
}

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, roomBinding, userBinding, projectBinding] }),
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
    _from: '', // 页面进入来源
  },
  computed: {
    // 项目是否有设备
    hasDevice() {
      if (deviceStore.allDeviceList) {
        return deviceStore.allDeviceList.length
      }
      return false
    },
    movableHeight() {
      return spaceStore.spaceList.length * ROOM_CARD_H
    },
  },
  watch: {
    isInit(data) {
      // 如果已初始化，但仍在loading
      if (this.data.loading && data) {
        this.setData({ loading: !data })
      }
    },
    spaceList() {
      this.renewRoomPos()
    },
  },

  methods: {
    // 生命周期或者其他钩子
    onLoad(query: { from?: string }) {
      this.data._from = query.from ?? ''
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
    },
    async onShow() {
      if (!this.data._isFirstShow || this.data._from === 'addDevice') {
        projectStore.updateSpaceCardList()
      }
      this.data._isFirstShow = false

      if (!othersStore.isInit) {
        this.setData({
          loading: true,
        })
      }
    },

    /**
     * @description 生成空间位置
     * @param isMoving 是否正在拖动
     */
    renewRoomPos() {
      // const currentIndex = this.data.placeholder.index
      const roomPos = {} as Record<string, PosType>
      spaceStore.spaceList
        .sort((a, b) => this.data.roomPos[a.spaceId]?.index - this.data.roomPos[b.spaceId]?.index)
        .forEach((space, index) => {
          roomPos[space.spaceId] = {
            index,
            // 正在拖的卡片，不改变位置
            y: index * ROOM_CARD_H,
          }
        })

      this.setData({
        roomPos,
      })
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
     * 用户切换项目
     */
    handleHomeSelect() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏项目选择
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
     * 隐藏添加空间popup
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
      for (const space of spaceStore.spaceList) {
        const _orderNum = this.data.roomPos[space.spaceId].index
        if (
          (isForward && _orderNum > oldOrder && _orderNum <= targetOrder) ||
          (!isForward && _orderNum >= targetOrder && _orderNum < oldOrder)
        ) {
          ++moveCount
          const dOrderNum = isForward ? _orderNum - 1 : _orderNum + 1
          diffData[`roomPos.${space.spaceId}.y`] = getPos(dOrderNum)
          diffData[`roomPos.${space.spaceId}.index`] = dOrderNum

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
      const roomSortList = [] as Space.RoomSort[]
      Object.keys(this.data.roomPos).forEach((spaceId) => {
        roomSortList.push({
          spaceId,
          sort: this.data.roomPos[spaceId].index + 1,
        })
      })

      // 更新云端排序
      updateRoomSort(roomSortList)

      // 更新store排序
      const list = [] as Space.SpaceInfo[]
      spaceStore.spaceList.forEach((space) => {
        const { index } = this.data.roomPos[space.spaceId]
        list[index] = space
      })
      runInAction(() => {
        spaceStore.spaceList = list
      })
    },
  },
})
