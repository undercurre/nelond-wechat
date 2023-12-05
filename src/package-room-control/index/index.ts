import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  userBinding,
  roomBinding,
  deviceBinding,
  sceneBinding,
  homeBinding,
  deviceStore,
  sceneStore,
  roomStore,
  homeStore,
} from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import pageBehavior from '../../behaviors/pageBehaviors'
import { sendDevice, execScene, saveDeviceOrder, queryGroup, queryAuthGetStatus } from '../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import {
  storage,
  emitter,
  WSEventType,
  rpx2px,
  _get,
  throttle,
  isConnect,
  verifyNetwork,
  Logger,
  strUtil,
} from '../../utils/index'
import {
  maxColorTemp,
  minColorTemp,
  proName,
  PRO_TYPE,
  LIST_PAGE,
  CARD_W,
  CARD_H,
  getModelName,
  CARD_REFRESH_TIME,
  sceneImgDir,
  defaultImgDir,
} from '../../config/index'

type DeviceCard = Device.DeviceItem & {
  x: string
  y: string
  orderNum: number
  type: string
  select: boolean
  linkSceneName: string
  isRefresh: boolean // 是否整个列表刷新
  timestamp: number // 加入队列时打上的时间戳
}

/**
 * 根据index计算坐标位置
 * @returns {x, y}
 */
function getPos(index: number): Record<'x' | 'y', string> {
  // console.log('getPos', index)
  const x = `${(index % 4) * CARD_W}px`
  const y = `${Math.floor(index / 4) * CARD_H}px`
  return { x, y }
}

/**
 * 根据坐标位置计算index
 * @returns index
 */
function getIndex(x: number, y: number) {
  const maxIndex = deviceStore.deviceFlattenList.length - 1 // 防止越界
  const ix = Math.floor((x + CARD_W / 2) / CARD_W)
  const iy = Math.floor((y + CARD_H / 2) / CARD_H)
  return Math.min(ix + 4 * iy, maxIndex)
}

ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding, sceneBinding, homeBinding] }),
    pageBehavior,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    sceneImgDir,
    defaultImgDir,
    _firstShow: true, // 是否首次进入
    _from: '', // 页面进入来源
    _updating: false, // 列表更新中标志
    // 更新等待队列
    _diffWaitlist: [] as DeviceCard[],
    // 待更新到视图的数据，便于多个更新合并到一次setData中（updateDeviceList专用）
    _diffCards: {
      data: {} as IAnyObject,
      created: 0, // 创建时间
    },
    _wait_timeout: null as null | number, // 卡片等待更新时间
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    movableAreaHeight: 236, // 可移动区域高度
    toolboxTop: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number), // 工具栏上边补白
    /** 展示点中离线设备弹窗 */
    showDeviceOffline: false,
    /** 点击的离线设备的信息 */
    offlineDevice: {} as DeviceCard,
    /** 弹层要控制的设备品类 */
    controlType: '',
    showAddScenePopup: false,
    showAuthDialog: false, // 显示确权弹层
    deviceIdForQueryAuth: '', // 用于确权的设备id
    _cardEventType: '' as 'card' | 'control', // 触发确权前的操作类型
    // 设备卡片列表，二维数组
    devicePageList: [] as DeviceCard[][],
    /** 待创建面板的设备选择弹出框 */
    showBeforeAddScenePopup: false,
    scrollTop: 0,
    checkedList: [] as string[], // 已选择设备的id列表
    editSelectList: [] as string[], // 编辑状态下，已勾选的设备id列表
    editSelectMode: false, // 是否编辑状态
    checkedDeviceInfo: {} as DeviceCard, // 选中设备的数据
    deviceListInited: false, // 设备列表是否初始化完毕
    isMoving: false, // 是否正在拖拽中
    hasMoved: false, // 排序变更过
    placeholder: {
      orderNum: -1, // 占位符当前对应的排序
      index: -1, // 占位符当前对应元素的数据索引
      groupIndex: -1,
      x: '',
      y: '',
    },
    roomLight: {
      brightness: 0,
      colorTemperature: 0,
      maxColorTemp,
      minColorTemp,
      power: 0,
    },
  },

  computed: {
    // 房间亮度toast格式化
    colorTempFormatter(data) {
      const { maxColorTemp, minColorTemp } = data.roomLight
      return (value: number) => {
        return `${(value / 100) * (maxColorTemp - minColorTemp) + minColorTemp}K`
      }
    },
    // 房间存在可显示的灯具
    roomHasLight(data) {
      if (data.allRoomDeviceList) {
        return (
          (data.allRoomDeviceList as DeviceCard[]).filter(
            (device) =>
              device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
              device.proType === PRO_TYPE.light,
          ).length > 0
        )
      }
      return false
    },
    // 房间存在可显示的设备
    roomHasDevice(data) {
      if (data.allRoomDeviceList?.length) {
        return (
          (data.allRoomDeviceList as DeviceCard[]).filter(
            (device) =>
              device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
              device.proType !== PRO_TYPE.gateway,
          ).length > 0
        )
      }
      return false
    },
    title(data) {
      if (data.roomList && data.roomList[data.currentRoomIndex]) {
        return data.roomList[data.currentRoomIndex].roomName
      }
      return ''
    },
    sceneListInBar(data) {
      if (data.sceneList) {
        return data.sceneList.slice(0, 4)
      }
      return []
    },
    deviceIdTypeMap(data): Record<string, string> {
      if (data.deviceList?.length) {
        return Object.fromEntries(
          data.deviceList.map((device: DeviceCard) => [device.deviceId, proName[device.proType]]),
        )
      }
      return {}
    },
    // 设备批量选择按钮文字
    allSelectBtnText(data) {
      return data.checkedList && data.checkedList.length > 0 ? '全不选' : '全选'
    },
    /** 是否有选中灯，一个或多个（单击选中） */
    isLightSelectSome(data) {
      if (!data.checkedList || data.checkedList.length === 0) {
        return false
      }
      const { deviceMap } = deviceStore
      return data.checkedList.some(
        (uniId: string) => uniId.indexOf(':') === -1 && deviceMap[uniId].proType === PRO_TYPE.light,
      )
    },
    /** 是否只控制选中一个开关 */
    // TODO 代码可删除
    isSwitchSelectOne(data) {
      if (data.checkedList) {
        const deviceMap = deviceStore.deviceFlattenMap
        let selectSwitchNum = 0
        data.checkedList.forEach((uniId: string) => {
          if (uniId.includes(':')) {
            if (deviceMap[uniId].proType === PRO_TYPE.switch) {
              selectSwitchNum++
            }
          }
        })
        return !!selectSwitchNum
      }
      return false
    },
    // 判断是否是创建者或者管理员，其他角色不能添加设备
    canAddDevice(data) {
      return data.isCreator || data.isAdmin
    },
    // 可滚动区域高度
    scrollViewHeight(data) {
      let baseHeight =
        (storage.get('windowHeight') as number) -
        (storage.get('statusBarHeight') as number) -
        (storage.get('navigationBarHeight') as number) -
        (storage.get('bottomBarHeight') as number) -
        data.toolboxContentHeight // 场景
      // 编辑弹框高度
      if (data.editSelectMode) {
        baseHeight -= rpx2px(298)
      }
      return baseHeight + 'px'
    },
    // 工具栏内容区域高度
    toolboxContentHeight(data) {
      return data.roomHasLight ? 150 : 60
    },
    /**
     * 是否打开控制面板（除浴霸和晾衣）
     * TODO 将灯和开关控制也解耦出来
     */
    isShowCommonControl(data) {
      const { controlType } = data
      return controlType && controlType !== PRO_TYPE.bathHeat && controlType !== PRO_TYPE.clothesDryingRack
    },
  },

  watch: {
    // 设备数变化时，刷新可移动区域高度
    'currentRoom.endCount'(value) {
      this.setData({
        movableAreaHeight: Math.ceil(value / 4) * 236,
      })
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad(query: { from?: string }) {
      Logger.log('room-onLoad', query)
      this.data._from = query.from ?? ''
      // this.setUpdatePerformanceListener({withDataPaths: true}, (res) => {
      //   console.debug('setUpdatePerformanceListener', res, res.pendingStartTimestamp - res.updateStartTimestamp, res.updateEndTimestamp - res.updateStartTimestamp, dayjs().format('YYYY-MM-DD HH:mm:ss'))
      // })
    },

    async onShow() {
      Logger.log('room-onShow, _firstShow', this.data._firstShow)
      // 首次进入
      if (this.data._firstShow && this.data._from !== 'addDevice') {
        this.updateQueue({ isRefresh: true })
        // sceneStore.updateAllRoomSceneList()
        this.queryGroupInfo()
        this.data._firstShow = false
      }
      // 从别的页面返回，或从挂起状态恢复
      else {
        // 验证网络状态
        await verifyNetwork()
        // 加载数据
        this.reloadData()
      }

      emitter.on('deviceListRetrieve', () => {
        console.log('deviceListRetrieve，isConnect', isConnect())
        this.reloadDataThrottle()
      })

      // ws消息处理
      emitter.on('wsReceive', async (e) => {
        const { eventType } = e.result

        if (eventType === WSEventType.updateHomeDataLanInfo) {
          this.updateQueue({ isRefresh: true })
          return
        }

        if (e.result.eventType === WSEventType.device_property) {
          // 房间状态上报，只响应开关状态的变更 // 已由msgPush触发更新，此处可删除
          // if (e.result.eventData.deviceId === roomStore.currentRoom.groupId) {
          //   const { event } = e.result.eventData
          //   console.log('[房间状态上报]', roomStore.currentRoom.groupId, event.power)
          //   this.setData({
          //     'roomLight.power': event.power,
          //   })
          // }
          // 如果有传更新的状态数据过来，直接更新store
          const deviceInHouse = deviceStore.allRoomDeviceMap[e.result.eventData.deviceId]

          if (deviceInHouse) {
            runInAction(() => {
              deviceInHouse.mzgdPropertyDTOList[e.result.eventData.modelName] = {
                ...deviceInHouse.mzgdPropertyDTOList[e.result.eventData.modelName],
                ...e.result.eventData.event,
              }
            })
            roomStore.updateRoomCardLightOnNum()
          }

          // 组装要更新的设备数据
          const deviceInRoom = deviceStore.deviceMap[e.result.eventData.deviceId]

          if (deviceInRoom) {
            runInAction(() => {
              deviceInRoom.mzgdPropertyDTOList[e.result.eventData.modelName] = {
                ...deviceInRoom.mzgdPropertyDTOList[e.result.eventData.modelName],
                ...e.result.eventData.event,
              }
            })
          }

          // 组装要更新的设备数据，更新的为flatten列表，结构稍不同
          const device = {} as DeviceCard
          device.deviceId = e.result.eventData.deviceId
          device.uniId = `${e.result.eventData.deviceId}:${e.result.eventData.modelName}`
          device.mzgdPropertyDTOList = {}
          device.mzgdPropertyDTOList[e.result.eventData.modelName] = {
            ...e.result.eventData.event,
          }

          this.updateQueue(device)
          return
        }
        // 额外的更新设备在线状态
        // FIXME 面板按键未处理
        // TODO 一般使用device_online_status即可，暂时删除，如有遗漏需要云端支持，以减少信息的数量
        // else if (
        //   e.result.eventType === WSEventType.screen_online_status_sub_device ||
        //   e.result.eventType === WSEventType.screen_online_status_wifi_device
        // ) {
        //   const { deviceId, status } = e.result.eventData
        //   const deviceInRoom = deviceStore.deviceMap[deviceId]
        //   if (!deviceInRoom || deviceInRoom.onLineStatus === status) {
        //     return
        //   }
        //   const modelName = getModelName(deviceInRoom.proType, deviceInRoom.productId)
        //   const device = {} as DeviceCard
        //   device.deviceId = deviceId
        //   device.uniId = modelName ? `${deviceId}:${modelName}` : deviceId
        //   device.onLineStatus = status
        //   this.updateQueue(device)
        // }
        // 节流更新本地数据
        else if (
          [
            WSEventType.device_replace,
            WSEventType.device_online_status,
            WSEventType.device_offline_status,
            WSEventType.group_upt,
            // WSEventType.group_device_result_status,
            // WSEventType.device_del,
            WSEventType.bind_device,
          ].includes(e.result.eventType)
        ) {
          this.reloadDataThrottle(e)
        } else if (
          e.result.eventType === WSEventType.room_del &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          // 房间被删除，退出到首页
          await homeStore.updateRoomCardList()
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })

      // 子设备状态变更，刷新全房间灯光可控状态
      emitter.on('msgPush', () => {
        const hasLightOn = deviceStore.deviceList.some((d) => d.mzgdPropertyDTOList?.light?.power === 1)
        this.setData({
          'roomLight.power': hasLightOn ? 1 : 0,
        })
      })
    },

    // 响应控制弹窗中单灯/灯组的控制变化，直接按本地设备列表数值以及设置值，刷新房间灯的状态
    refreshLightStatus() {
      console.log('本地更新房间灯状态', deviceStore.lightStatusInRoom)

      const { brightness, colorTemperature } = deviceStore.lightStatusInRoom
      this.setData({
        'roomLight.brightness': brightness,
        'roomLight.colorTemperature': colorTemperature,
      })
    },

    // 查询房间分组详情
    async queryGroupInfo() {
      const res = await queryGroup({ groupId: roomStore.currentRoom.groupId })
      if (res.success) {
        const roomStatus = res.result.controlAction[0]
        const { colorTempRangeMap } = res.result
        this.setData({
          roomLight: {
            brightness: roomStatus.brightness,
            colorTemperature: roomStatus.colorTemperature,
            maxColorTemp: colorTempRangeMap.maxColorTemp,
            minColorTemp: colorTempRangeMap.minColorTemp,
            power: roomStatus.power,
          },
        })
      }
    },

    async reloadData() {
      Logger.log('reloadData', isConnect())
      // 未连接网络，所有设备直接设置为离线
      if (!isConnect()) {
        this.updateQueue({ isRefresh: true, onLineStatus: 0 })
        return
      }

      try {
        await Promise.all([homeStore.updateRoomCardList(), sceneStore.updateAllRoomSceneList(), this.queryGroupInfo()])

        this.updateQueue({ isRefresh: true })
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 节流更新房间各种关联信息
    reloadDataThrottle: throttle(function (this: IAnyObject) {
      this.reloadData()
    }, 4000),

    // 只单独更新列表
    async reloadDeviceList() {
      Logger.log('Only ReloadDeviceList', isConnect())
      // 未连接网络，所有设备直接设置为离线
      if (!isConnect()) {
        this.updateQueue({ isRefresh: true, onLineStatus: 0 })
        return
      }

      await deviceStore.updateAllRoomDeviceList()
      this.updateQueue({ isRefresh: true })

      this.queryGroupInfo()
    },

    // 节流更新设备列表
    reloadDeviceListThrottle: throttle(function (this: IAnyObject) {
      this.reloadDeviceList()
    }, 3000),

    // 页面滚动
    onPageScroll(e: { detail: { scrollTop: number } }) {
      this.data.scrollTop = e?.detail?.scrollTop || 0
    },

    // onUnload() {},
    onHide() {
      console.log('onHide')

      // 解除监听
      emitter.off('wsReceive')
      emitter.off('deviceListRetrieve')

      if (this.data._wait_timeout) {
        clearTimeout(this.data._wait_timeout)
        this.data._wait_timeout = null
      }
    },
    handleShowDeviceOffline(e: { detail: DeviceCard }) {
      this.setData({
        showDeviceOffline: true,
        offlineDevice: e.detail,
      })
    },
    handleCloseDeviceOffline() {
      this.setData({
        showDeviceOffline: false,
      })
    },
    // 根据场景信息，比较出关联场景名字
    getLinkSceneName(device: Device.DeviceItem) {
      if (device?.proType !== PRO_TYPE.switch) {
        return ''
      }
      const switchId = device.uniId.split(':')[1]
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const sceneIdMap = sceneStore.sceneIdMap
      const uId = `${device.deviceId}:${switchId}`

      if (
        switchSceneConditionMap[uId] &&
        sceneIdMap[switchSceneConditionMap[uId]] &&
        sceneIdMap[switchSceneConditionMap[uId]].sceneName
      ) {
        return sceneIdMap[switchSceneConditionMap[uId]].sceneName.slice(0, 4)
      }
      return ''
    },
    /**
     * @description 初始化或更新设备列表
     * @param e 设备对象属性
     */
    async updateDeviceList(e?: DeviceCard) {
      if (!e) {
        this.data._updating = false
        return
      }

      // 单项更新
      if (!e.isRefresh) {
        const device = e as DeviceCard
        let originDevice: DeviceCard

        for (const groupIndex in this.data.devicePageList) {
          const index = this.data.devicePageList[groupIndex].findIndex((d: DeviceCard) => {
            if (d.proType === PRO_TYPE.switch) {
              return d.uniId === device!.uniId
            } else {
              return d.deviceId === device!.deviceId
            }
          })

          if (index !== -1) {
            originDevice = this.data.devicePageList[groupIndex][index]
            // const diffData = {} as IAnyObject
            // Review 细致到字段的diff
            const renderList = ['deviceName', 'onLineStatus'] // 需要刷新界面的字段

            renderList.forEach((key) => {
              const newVal = _get(device!, key)
              const originVal = _get(originDevice, key)
              // 进一步检查，过滤确实有更新的字段
              if (newVal !== undefined && newVal !== originVal) {
                this.data._diffCards.data[`devicePageList[${groupIndex}][${index}].${key}`] = newVal
              }
            })

            const modelName =
              originDevice.proType === PRO_TYPE.switch
                ? originDevice.uniId.split(':')[1]
                : getModelName(originDevice.proType, originDevice.productId)

            // 如果mzgdPropertyDTOList、switchInfoDTOList字段存在，则覆盖更新
            if (device!.mzgdPropertyDTOList) {
              const newVal = {
                ...originDevice.mzgdPropertyDTOList[modelName],
                ...device?.mzgdPropertyDTOList[modelName],
              }

              this.data._diffCards.data[`devicePageList[${groupIndex}][${index}].mzgdPropertyDTOList.${modelName}`] =
                newVal
            }
            // 更新面板、按键信息
            if (device!.switchInfoDTOList) {
              const newVal = {
                ...originDevice.switchInfoDTOList[0],
                ...device?.switchInfoDTOList[0],
              }
              this.data._diffCards.data[`devicePageList[${groupIndex}][${index}].switchInfoDTOList[0]`] = newVal
            }
            // 更新场景关联信息
            const linkSceneName = this.getLinkSceneName({
              ...device!,
              proType: originDevice.proType, // 补充关键字段
            })
            if (linkSceneName !== originDevice.linkSceneName) {
              this.data._diffCards.data[`devicePageList[${groupIndex}][${index}].linkSceneName`] = linkSceneName
            }

            // 如果控制弹框为显示状态，则同步选中设备的状态
            if (
              device!.mzgdPropertyDTOList &&
              this.data.checkedList.includes(originDevice!.deviceId) &&
              originDevice!.select &&
              (originDevice.proType === PRO_TYPE.curtain ||
                originDevice.proType === PRO_TYPE.bathHeat ||
                originDevice.proType === PRO_TYPE.clothesDryingRack) // 因为【灯】异常推送较多，暂时不对弹框中的设备状态进行更新
            ) {
              const newVal = {
                ...originDevice,
                ...device,
                ...device.mzgdPropertyDTOList[modelName], // 设备属性扁平化（一维、冗余），以便与场景弹框统一逻辑
              }
              this.data._diffCards.data.checkedDeviceInfo = newVal
            }

            // 处理更新逻辑
            if (Object.keys(this.data._diffCards.data).length) {
              const now = new Date().getTime()
              if (!this.data._diffCards.created) {
                this.data._diffCards.created = now
              }
              const wait = now - this.data._diffCards.created
              if (wait >= CARD_REFRESH_TIME && device.timestamp) {
                // 先清空已有的更新等待
                if (this.data._wait_timeout) {
                  clearTimeout(this.data._wait_timeout)
                  this.data._wait_timeout = null
                }
                this.setData(this.data._diffCards.data)
                this.data._diffCards = {
                  data: {},
                  created: 0,
                }
                console.log('▤ [%s, %s] 更新完成，已等待 %sms', groupIndex, index, wait)
              } else {
                console.log('▤ [%s, %s] 更新推迟，已等待 %sms', groupIndex, index, wait)
              }
            } else {
              console.log('▤ [%s, %s] diffData为空，不必更新', groupIndex, index)
            }
            break // 找到就中断
          }
        }
      }
      // 整个列表更新
      else {
        const flattenList = deviceStore.deviceFlattenList

        // 如果为空则不初始化
        // if (!flattenList.length) {
        //   this.data._updating = false
        //   return
        // }

        const _list = flattenList
          // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
          // 不再排除灯组
          // .filter((device) => !deviceStore.lightsInGroup.includes(device.deviceId))
          // 补充字段
          .map((device, index) => ({
            ...device,
            ...getPos(index),
            // !! 重排orderNum，从0开始
            // TRICK 排序过程orderNum代替index使用，而不必改变数组的真实索引
            orderNum: index,
            type: proName[device.proType],
            select: this.data.checkedList.includes(device.uniId) || this.data.editSelectList.includes(device.uniId),
            linkSceneName: this.getLinkSceneName(device),
            onLineStatus: e.onLineStatus ?? device.onLineStatus, // 传参数直接设置指定的在线离线状态
          }))

        if (!this.data.deviceListInited) {
          Logger.log('▤ [updateDeviceList] 列表初始化')
        }
        // !! 整个列表刷新
        else {
          console.log('▤ [updateDeviceList] 列表重新加载')
        }

        const oldListPageLength = this.data.devicePageList.length
        const newListPageLength = Math.ceil(_list.length / LIST_PAGE)

        // 拆分为二维数组，以便分页渲染
        for (let groupIndex = 0; _list.length > 0; ++groupIndex) {
          const group = _list.splice(0, LIST_PAGE)
          const diffData = {} as IAnyObject
          diffData[`devicePageList[${groupIndex}]`] = group
          this.setData(diffData)
        }

        // 直接清空旧列表，再重新加载会引导闪烁，此处只清空‘旧列表比新列表多出的项’
        if (oldListPageLength > newListPageLength) {
          for (let groupIndex = newListPageLength; groupIndex < oldListPageLength; ++groupIndex) {
            const diffData = {} as IAnyObject
            diffData[`devicePageList[${groupIndex}]`] = []
            this.setData(diffData)
          }
        }

        if (!this.data.deviceListInited) {
          this.setData({
            deviceListInited: true,
          })
        }

        Logger.log('▤ [updateDeviceList] 列表更新完成', this.data.devicePageList)
      }

      // 模拟堵塞任务执行
      // await delay(100)
      // console.log('▤ [updateDeviceList] Ended', this.data._diffWaitlist.length)

      // 恢复更新标志
      this.data._updating = false
      // 如果等待列表不为空，则递归执行
      if (this.data._diffWaitlist.length) {
        this.updateQueue()
      }
      // 如果等待列表已空，则节流执行视图更新
      else if (Object.keys(this.data._diffCards.data).length) {
        if (this.data._wait_timeout) {
          clearTimeout(this.data._wait_timeout)
          this.data._wait_timeout = null
        }
        this.data._wait_timeout = setTimeout(() => {
          this.setData(this.data._diffCards.data)
          console.log('▤ 清空更新队列', this.data._diffCards.data)
          this.data._diffCards = {
            data: {},
            created: 0,
          }
        }, CARD_REFRESH_TIME)
      }
    },

    /**
     * @description 引入任务队列处理列表更新，对更新动作进行节流、队列处理
     * @param e 设备属性 | 包裹在事件中的设备属性 | 空对象（表示全量更新）| 不传值则执行下一个
     */
    async updateQueue(e?: (DeviceCard & { detail?: DeviceCard }) | Optional<DeviceCard>) {
      if (e) {
        let device: DeviceCard

        // 如果是包裹在事件中的设备属性，则简化结构
        if (Object.prototype.hasOwnProperty.call(e, 'detail')) {
          const { detail } = e as { detail: DeviceCard }
          device = detail
        }
        // e：设备属性 |
        else {
          device = e as DeviceCard
        }

        // 未初始化完毕不接受单独更新，所有初始化完成前的更新将被丢弃
        if (!this.data.deviceListInited && !device.isRefresh) {
          console.log('▤ [No deviceListInited, updateQueue Quit]')
          return
        }

        const timestamp = new Date().getTime()
        this.data._diffWaitlist.push({ ...device, timestamp })
        if (this.data._diffWaitlist.length > 1) {
          console.log('▤ [updateQueue Pushed] Queue Len:', this.data._diffWaitlist.length)
        }
      }

      // 未在更新中，从队首取一个执行
      if (!this.data._updating) {
        const diff = this.data._diffWaitlist.shift()
        this.data._updating = true
        this.updateDeviceList(diff)
      }
    },

    // 基于云端更新数据
    async updateRoomListOnCloud() {
      await deviceStore.updateAllRoomDeviceList()
      this.updateQueue({ isRefresh: true })
    },
    // updateRoomListOnCloud: throttle(
    //   async function (this: IAnyObject) {
    //     await deviceStore.updateSubDeviceList()
    //     this.updateQueue({ isRefresh: true })
    //   },
    //   4000,
    //   false,
    // ),

    /**
     * @description 更新选中状态并渲染
     * @param uniId
     * @param toCheck 可选，若指定则设为指定状态；若不指定则置反
     */
    toSelect(uniId: string, toCheck?: boolean) {
      for (const groupIndex in this.data.devicePageList) {
        const group = this.data.devicePageList[groupIndex]
        const index = group.findIndex((d) => d.uniId === uniId)
        if (index !== -1) {
          const diffData = {} as IAnyObject
          diffData[`devicePageList[${groupIndex}][${index}].select`] = toCheck ?? !group[index].select
          console.log(diffData)
          this.setData(diffData)
          break
        }
      }
    },

    // 开始拖拽，初始化placeholder
    movableTouchStart(e: WechatMiniprogram.TouchEvent) {
      const orderNum = e.currentTarget.dataset.ordernum // ! 注意大小写
      const groupIndex = e.currentTarget.dataset.group
      const index = e.currentTarget.dataset.index

      const diffData = {} as IAnyObject
      diffData.isMoving = true
      diffData.placeholder = {
        ...getPos(orderNum),
        orderNum,
        groupIndex,
        index,
      }
      console.log('⇅ [movableTouchStart]', diffData)

      this.setData(diffData)
    },

    /**
     * 拖拽时触发的卡片移动效果
     */
    movableChangeThrottle: throttle(function (this: IAnyObject, e: WechatMiniprogram.TouchEvent) {
      const targetOrder = getIndex(e.detail.x, e.detail.y)
      const oldOrder = this.data.placeholder.orderNum
      // 如果拖动目标是灯组所在的位置
      if (
        deviceStore.groupCount && // 有灯组
        ((targetOrder < deviceStore.groupCount && oldOrder >= deviceStore.groupCount) || // 非灯组不能移入灯组
          (oldOrder < deviceStore.groupCount && targetOrder >= deviceStore.groupCount)) // 灯组不能移入非灯组
      ) {
        return
      }
      if (this.data.placeholder.orderNum !== targetOrder) {
        // 节流操作，可能导致movableTouchEnd后仍有movableChange需要执行，丢弃掉
        if (oldOrder < 0) {
          return
        }
        console.log('⇅ [movableChange] %d-->%d', oldOrder, targetOrder, e)

        // 更新placeholder的位置
        const dPos = getPos(targetOrder)
        const diffData = {} as IAnyObject
        diffData[`placeholder.orderNum`] = targetOrder
        diffData[`placeholder.x`] = dPos.x
        diffData[`placeholder.y`] = dPos.y

        // 更新联动卡片的位置
        let moveCount = 0
        for (const groupIndex in this.data.devicePageList) {
          const group = this.data.devicePageList[groupIndex]
          for (const index in group) {
            const _orderNum = group[index].orderNum
            const isForward = oldOrder < targetOrder
            if (
              (isForward && _orderNum > oldOrder && _orderNum <= targetOrder) ||
              (!isForward && _orderNum >= targetOrder && _orderNum < oldOrder)
            ) {
              ++moveCount
              const dOrderNum = isForward ? _orderNum - 1 : _orderNum + 1
              const dpos = getPos(dOrderNum)
              diffData[`devicePageList[${groupIndex}][${index}].x`] = dpos.x
              diffData[`devicePageList[${groupIndex}][${index}].y`] = dpos.y
              diffData[`devicePageList[${groupIndex}][${index}].orderNum`] = dOrderNum

              // 减少遍历消耗
              if (moveCount >= Math.abs(targetOrder - oldOrder)) {
                break
              }
            }
            if (moveCount >= Math.abs(targetOrder - oldOrder)) {
              break
            }
          }
        }

        // 更新被拖拽卡片的排序num
        const groupIndex = this.data.placeholder.groupIndex
        const index = this.data.placeholder.index
        diffData[`devicePageList[${groupIndex}][${index}].orderNum`] = targetOrder
        console.log(diffData)
        this.setData(diffData)

        this.data.hasMoved = true
      }
    }, 50),

    movableChange(e: WechatMiniprogram.TouchEvent) {
      if (e.detail.source === 'touch' || e.detail.source === 'friction') {
        this.movableChangeThrottle(e)
      }
    },

    movableTouchEnd() {
      if (!this.data.isMoving) {
        return
      }
      const groupIndex = this.data.placeholder.groupIndex
      const index = this.data.placeholder.index
      const dpos = getPos(this.data.placeholder.orderNum)

      const diffData = {} as IAnyObject
      diffData.isMoving = false
      // 修正卡片位置
      diffData[`devicePageList[${groupIndex}][${index}].x`] = dpos.x
      diffData[`devicePageList[${groupIndex}][${index}].y`] = dpos.y
      diffData[`placeholder.orderNum`] = -1
      diffData[`placeholder.index`] = -1
      diffData[`placeholder.groupIndex`] = -1

      this.setData(diffData)
      console.log('⇅ [movableTouchEnd]', diffData)

      setTimeout(() => this.resetPos(), 500)
      this.handleSortSaving()
    },
    // 修正可能出现的卡片错位
    resetPos() {
      const diffData = {} as IAnyObject
      for (const groupIndex in this.data.devicePageList) {
        const group = this.data.devicePageList[groupIndex]
        for (const index in group) {
          const { orderNum } = group[index]
          const dpos = getPos(orderNum)
          diffData[`devicePageList[${groupIndex}][${index}].x`] = dpos.x
          diffData[`devicePageList[${groupIndex}][${index}].y`] = dpos.y
        }
      }
      this.setData(diffData)
    },
    async handleSortSaving() {
      if (!this.data.hasMoved) {
        return
      }
      this.data.hasMoved = false

      const deviceOrderData = {
        deviceInfoByDeviceVoList: [],
      } as Device.OrderSaveData
      const switchOrderData = {
        deviceInfoByDeviceVoList: [],
      } as Device.OrderSaveData

      for (const groupIndex in this.data.devicePageList) {
        const group = this.data.devicePageList[groupIndex]
        for (const index in group) {
          const device = group[index]
          if (device.proType !== PRO_TYPE.switch) {
            deviceOrderData.deviceInfoByDeviceVoList.push({
              deviceId: device.deviceId,
              houseId: homeStore.currentHomeId,
              roomId: device.roomId,
              orderNum: String(device.orderNum),
              type: device.deviceType === 4 ? '2' : '0', // 灯组为2，普通设备为0
            })
          }
          // 若开关按键参与排序，需要按 type: '1' 再保存
          else {
            switchOrderData.deviceInfoByDeviceVoList.push({
              deviceId: device.deviceId,
              houseId: homeStore.currentHomeId,
              roomId: device.roomId,
              orderNum: String(device.orderNum),
              switchId: device.switchInfoDTOList[0].switchId,
              type: '1',
            })
          }
        }
      }
      if (deviceOrderData.deviceInfoByDeviceVoList.length) {
        await saveDeviceOrder(deviceOrderData)
      }
      if (switchOrderData.deviceInfoByDeviceVoList.length) {
        await saveDeviceOrder(switchOrderData)
      }
    },

    handleSceneTap() {
      wx.navigateTo({
        //  url: '/package-room-control/scene-list/index',
        url: '/package-automation/automation/index',
      })
    },
    /** 点击创建场景按钮回调 */
    handleCollect() {
      if (this.data.isVisitor) {
        Toast('仅创建者与管理员可创建场景')
        return
      }

      // 逻辑已过时，可删除，暂时保留一段时间
      // // 补充actions
      // const addSceneActions = [] as Device.ActionItem[]

      // // 排除已经是场景开关的开关或者离线的设备
      // // ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
      // let deviceList = [] as Device.DeviceItem[]

      // for (const list of this.data.devicePageList) {
      //   deviceList = deviceList.concat(list)
      // }

      // const selectList = deviceList.filter((device) => {
      //   let [, switchId] = device.uniId.split(':')

      //   switchId = switchId ?? MODEL_NAME[device.proType]

      //   return device.mzgdPropertyDTOList[switchId]?.ButtonMode !== 2 && device.onLineStatus
      // })

      // if (!selectList.length) {
      //   Toast('所有设备已离线，无法创建场景')
      //   return
      // }

      // selectList.forEach((device) => {
      //   if (device.proType === PRO_TYPE.switch) {
      //     // 开关
      //     const modelName = device.uniId.split(':')[1]
      //     console.log(Boolean(device.mzgdPropertyDTOList[modelName]))
      //     console.log(modelName)
      //     let power
      //     if (device.mzgdPropertyDTOList[modelName]) {
      //       power = device.mzgdPropertyDTOList[modelName].power
      //     } else {
      //       power = false
      //     }
      //     const desc = toPropertyDesc(device.proType, device.mzgdPropertyDTOList[modelName])

      //     addSceneActions.push({
      //       uniId: device.uniId,
      //       name: device.switchInfoDTOList[0].switchName + ' | ' + device.deviceName,
      //       desc: desc,
      //       pic: device.switchInfoDTOList[0].pic,
      //       proType: device.proType,
      //       deviceType: device.deviceType,
      //       value: {
      //         modelName,
      //         power,
      //       },
      //     })
      //   } else {
      //     const modelName = MODEL_NAME[device.proType]
      //     const properties = device.mzgdPropertyDTOList[modelName]
      //     const desc = toPropertyDesc(device.proType, properties)

      //     const action = {
      //       uniId: device.uniId,
      //       name: device.deviceName,
      //       desc,
      //       pic: device.pic,
      //       proType: device.proType,
      //       deviceType: device.deviceType,
      //       value: {
      //         modelName,
      //         ...properties,
      //       } as IAnyObject,
      //     }

      //     addSceneActions.push(action)
      //   }
      // })
      // runInAction(() => {
      //   sceneStore.addSceneActions = addSceneActions
      // })
      // this.setData({
      //   editSelectMode: false,
      //   editSelectList: [],
      //   showBeforeAddScenePopup: true,
      // })

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-automation/automation-add/index', {
          roomid: roomStore.currentRoom.roomId,
        }),
      })
    },

    /**
     * @description 卡片点击事件处理
     * @param e 设备属性
     */
    async handleCardTap(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect } }) {
      // 如果在编辑状态，则选择或取消选择卡片
      if (this.data.editSelectMode) {
        this.handleCardEditSelect(e)
        return
      }
      // 不在编辑状态，如果是WIFI设备
      else if (e.detail.deviceType === 3) {
        const { deviceId } = e.detail
        const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId })
        // 若设备未确权、待确权，则弹出指引弹窗
        if (!res.success) {
          Toast('设备确权异常')
          return
        } else if (res.result.status === 1 || res.result.status === 2) {
          this.setData({ showAuthDialog: true, deviceIdForQueryAuth: deviceId })
          this.data._cardEventType = 'card'
          return
        }
      }

      // 其余情况正常响应点击
      this.handleCardCommonTap(e)
    },

    handleAuthSuccess() {
      const detail = deviceStore.deviceList.find((d) => d.deviceId === this.data.deviceIdForQueryAuth) as DeviceCard

      if (this.data._cardEventType === 'card') {
        this.handleCardCommonTap({ detail })
      } else {
        this.handleControlTap({ detail })
      }
      this.setData({ showAuthDialog: false })
    },

    handleAuthCancel() {
      this.setData({ showAuthDialog: false })
    },

    // 编辑模式下再点选
    handleCardEditSelect(e: { detail: DeviceCard }) {
      const device = e.detail
      const { uniId } = device
      const toCheck = !this.data.editSelectList.includes(uniId)
      const list = [...this.data.editSelectList]

      // 未选中，则追加到已选中列表
      if (toCheck) {
        list.push(uniId)
      }
      // 从列表中移除
      else {
        const index = list.findIndex((id) => uniId === id)
        list.splice(index, 1)
      }

      // 选择样式渲染
      this.toSelect(uniId)

      this.setData({
        editSelectList: list,
      })

      console.log('handleCardEditSelect', list)
    },

    /**
     * @description 编辑状态全选/全不选
     * @param e
     */
    editSelectAll(e: { detail: boolean }) {
      const toCheckAll = e.detail
      const diffData = {} as IAnyObject
      diffData.editSelectList = toCheckAll ? deviceStore.deviceFlattenList.map((device) => device.uniId) : []
      for (const groupIndex in this.data.devicePageList) {
        this.data.devicePageList[groupIndex].forEach((device, index) => {
          // 如果状态已是一样，则不放diff，减少数据的变更
          if (device.select !== toCheckAll) {
            diffData[`devicePageList[${groupIndex}][${index}].select`] = toCheckAll
          }
        })
      }

      this.setData(diffData)
    },

    handleCardCommonTap(e: { detail: DeviceCard }) {
      console.log('e.detail', e.detail)
      const { uniId } = e.detail // 灯的 deviceId===uniId
      const isChecked = this.data.checkedList.includes(uniId) // 点击卡片前，卡片是否选中
      const toCheck = !isChecked // 本次点击需执行的选中状态

      // 取消旧选择
      if (toCheck && this.data.checkedList.length) {
        const oldCheckedId = this.data.checkedList[0]
        this.toSelect(oldCheckedId)
      }

      // 选择样式渲染
      this.toSelect(uniId)

      const diffData = {} as IAnyObject

      // 选择项，只能单选，但仍沿用数组的形式
      this.data.checkedList = toCheck ? [uniId] : []

      // 选择卡片时，同步设备状态到控制弹窗
      if (toCheck) {
        const modelName = getModelName(e.detail.proType, e.detail.productId)
        diffData.checkedDeviceInfo = {
          ...e.detail,
          ...e.detail.mzgdPropertyDTOList[modelName],
        }
      }

      // 合并数据变化
      diffData.checkedList = [...this.data.checkedList]
      diffData.controlType = e.detail.proType

      // 更新视图
      this.setData(diffData)

      // 弹起popup后，选中卡片滚动到视图中央，以免被遮挡
      // type: DeviceCard & { clientRect: WechatMiniprogram.ClientRect }
      // 作用不大，减小渲染压力，暂时注释
      // this.setData({
      //   scrollTop: this.data.scrollTop + e.detail.clientRect.top - this.data.scrollViewHeight / 2,
      // })
    },

    /**
     * @description 卡片控制事件处理
     * @param e 设备属性
     */
    async queryAuthBeforeControlTap(e: { detail: DeviceCard }) {
      // 如果是WIFI设备
      if (e.detail.deviceType === 3) {
        const { deviceId } = e.detail
        const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId })
        // 若设备未确权、待确权，则弹出指引弹窗
        if (res.result.status === 1 || res.result.status === 2) {
          this.setData({ showAuthDialog: true, deviceIdForQueryAuth: deviceId })
          this.data._cardEventType = 'control'
          return
        }
      }

      // 其余情况正常响应控制事件
      this.handleControlTap(e)
    },

    // 卡片点击时，按品类调用对应方法
    async handleControlTap(e: { detail: DeviceCard }) {
      const device = { ...e.detail }
      const modelName = device.switchInfoDTOList
        ? device.switchInfoDTOList[0].switchId
        : getModelName(device.proType, device.productId)

      // 若面板关联场景
      if (device.proType === PRO_TYPE.switch && device.mzgdPropertyDTOList[modelName].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneConditionMap[device.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
        return
      }

      if (device.proType === PRO_TYPE.curtain) {
        const OldPosition = device.mzgdPropertyDTOList[modelName].curtain_position
        const NewPosition = Number(OldPosition) > 0 ? '0' : '100'
        const res = await sendDevice({
          proType: device.proType,
          deviceType: device.deviceType,
          deviceId: device.deviceId,
          property: { curtain_position: NewPosition },
        })

        if (!res.success) {
          Toast('控制失败')
        }
        return
      }

      // 灯和面板
      const OldOnOff = device.mzgdPropertyDTOList[modelName].power
      const newOnOff = OldOnOff ? 0 : 1

      // 不等待云端，即时改变视图，提升操作手感 // TODO 不插入队列
      device.mzgdPropertyDTOList[modelName].power = newOnOff
      this.updateQueue(device)
      // this.setData({
      //   'lightStatus.power': newOnOff,
      // })

      const res = await sendDevice({
        proType: device.proType,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        modelName,
        gatewayId: device.gatewayId,
        property: { power: newOnOff, time: 500 },
      })

      if (!res.success) {
        device.mzgdPropertyDTOList[modelName].power = OldOnOff
        this.updateQueue(device)
        // this.setData({
        //   'lightStatus.power': OldOnOff,
        // })
        Toast('控制失败')
      }

      // 首页需要更新灯光打开个数
      homeStore.updateCurrentHomeDetail()
    },
    handleAddScenePopupClose() {
      this.setData({
        showAddScenePopup: false,
      })
    },
    handleAddScenePopupReturn() {
      this.setData({
        showAddScenePopup: false,
        showBeforeAddScenePopup: true,
      })
    },
    handleBeforeAddScenePopupClose() {
      this.setData({
        showBeforeAddScenePopup: false,
      })
    },
    handleBeforeAddScenePopupNext() {
      this.setData({
        showBeforeAddScenePopup: false,
        showAddScenePopup: true,
      })
    },
    handleShowAddSceneSuccess() {
      wx.navigateTo({
        url: '/package-room-control/scene-request-list/index',
      })
    },
    /** 点击空位的操作 */
    handleScreenTap() {
      this.cancelCheckAndPops()
    },
    /** 取消单选，收起弹窗 */
    cancelCheckAndPops() {
      // 有选中项才执行置反操作
      if (!this.data.controlType) {
        return
      }

      // 更新选中状态样式
      const deviceId = this.data.checkedList[0]
      this.toSelect(deviceId, false)

      // 收起弹窗
      this.setData({
        checkedList: [],
        controlType: '',
      })
    },
    // 长按选择，进入编辑状态
    handleLongpress(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect } }) {
      // 已是编辑状态，不重复操作
      if (this.data.editSelectMode) {
        return
      }
      // 只有创建者或者管理员能够进入编辑模式
      if (!this.data.isCreator && !this.data.isAdmin) {
        return
      }

      const device = e.detail
      const diffData = {} as IAnyObject

      // 进入编辑模式
      diffData.editSelectMode = true

      // 选中当前长按卡片
      diffData.editSelectList = [device.uniId]

      // 取消普通选择
      if (this.data.checkedList?.length) {
        this.handleScreenTap()
      }
      this.setData(diffData)

      this.toSelect(device.uniId, true)

      // 弹起popup后，选中卡片滚动到视图中央，以免被遮挡
      // this.setData({
      //   scrollTop: this.data.scrollTop + e.detail.clientRect.top - this.data.scrollViewHeight / 2,
      // })

      console.log('handleLongpress', e, diffData)
    },

    exitEditMode() {
      this.setData({
        editSelectMode: false,
        editSelectList: [],
      })
      this.editSelectAll({ detail: false })
    },

    async handleAddDevice() {
      const res = await wx.getNetworkType()
      if (res.networkType === 'none') {
        Toast('当前无法连接网络\n请检查网络设置')
        return
      }
      wx.navigateTo({ url: '/package-distribution/choose-device/index' })
    },
    handleRebindGateway() {
      const gateway = deviceStore.allRoomDeviceMap[this.data.offlineDevice.gatewayId]
      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${gateway.sn}`,
      })
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        'roomLight.brightness': e.detail,
      })
    },
    handleLevelEnd(e: { detail: number }) {
      this.setData({
        'roomLight.brightness': e.detail,
      })
      this.lightSendDeviceControl('brightness')
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        'roomLight.colorTemperature': e.detail,
      })
    },
    handleColorTempEnd(e: { detail: number }) {
      this.setData({
        'roomLight.colorTemperature': e.detail,
      })
      this.lightSendDeviceControl('colorTemperature')
    },
    async lightSendDeviceControl(type: 'colorTemperature' | 'brightness') {
      const deviceId = roomStore.currentRoom.groupId

      const res = await sendDevice({
        proType: PRO_TYPE.light,
        deviceType: 4,
        deviceId,
        property: {
          [type]: this.data.roomLight[type],
        },
      })

      if (!res.success) {
        Toast('控制失败')
      }
    },
  },
})