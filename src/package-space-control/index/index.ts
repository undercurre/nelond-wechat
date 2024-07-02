import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  userStore,
  userBinding,
  spaceBinding,
  deviceBinding,
  sceneBinding,
  projectBinding,
  deviceStore,
  sceneStore,
  spaceStore,
  projectStore,
} from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { sendDevice, execScene, queryGroupBySpaceId } from '../../apis/index'
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
  getModelName,
  CARD_REFRESH_TIME,
  sceneImgDir,
  defaultImgDir,
} from '../../config/index'

type DeviceCard = Device.DeviceItem & {
  type: string
  select: boolean
  linkSceneName: string
  isRefresh: boolean // 是否整个列表刷新
  timestamp: number // 加入队列时打上的时间戳
}

ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [userBinding, spaceBinding, deviceBinding, sceneBinding, projectBinding] }),
    pageBehavior,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    sceneImgDir: sceneImgDir(),
    defaultImgDir: defaultImgDir(),
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
    toolboxTop: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number), // 工具栏上边补白
    /** 展示点中离线设备弹窗 */
    showDeviceOffline: false,
    /** 点击的离线设备的信息 */
    offlineDevice: {} as DeviceCard,
    /** 弹层要控制的设备品类 */
    controlType: '',
    showAddScenePopup: false,
    deviceIdForQueryAuth: '', // 用于确权的设备id
    _cardEventType: '' as 'card' | 'control', // 触发确权前的操作类型
    // 设备卡片列表，二维数组
    devicePageList: [] as DeviceCard[][],
    checkedList: [] as string[], // 已选择设备的id列表
    editSelectList: [] as string[], // 编辑状态下，已勾选的设备id列表
    editSelectMode: false, // 是否编辑状态
    checkedDeviceInfo: {} as DeviceCard, // 选中设备的数据
    deviceListInited: false, // 设备列表是否初始化完毕
    spaceLight: {
      brightness: 0,
      colorTemperature: 0,
      maxColorTemp,
      minColorTemp,
      power: 0,
      groupId: '',
    },
  },

  computed: {
    // 空间亮度toast格式化
    colorTempFormatter(data) {
      const { maxColorTemp, minColorTemp } = data.spaceLight
      return (value: number) => {
        return `${Math.round((value / 100) * (maxColorTemp - minColorTemp) + minColorTemp)}K`
      }
    },
    // 房间灯光可控状态
    hasSpaceLightOn(data) {
      const { devicePageList } = data
      const flag = devicePageList.some((g) =>
        g.some((d) => !!(d.proType === PRO_TYPE.light && d.mzgdPropertyDTOList['light'].power)),
      )
      return flag
    },
    // 是否可调整空间色温
    canEditSpaceColorTemp(data) {
      const { minColorTemp, maxColorTemp } = data.spaceLight
      return minColorTemp !== 0 && maxColorTemp !== 0
    },
    // 空间存在可显示的灯具
    spaceHasLight(data) {
      const { devicePageList } = data
      const flag = devicePageList.some((g) => g.some((d) => !!(d.proType === PRO_TYPE.light)))
      return flag
    },
    // 空间存在可显示的设备
    roomHasDevice(data) {
      const { devicePageList } = data
      return devicePageList?.length > 1 || (devicePageList?.length === 1 && devicePageList[0].length > 0)
    },
    parentSpace(data) {
      const { allSpaceList } = data
      return allSpaceList?.find((s: Space.SpaceInfo) => s.spaceId === data.currentSpace?.pid) ?? {}
    },
    /**
     * 空间显示名称
     */
    title(data) {
      const { currentSpaceNameClear = '' } = data
      return currentSpaceNameClear.length > 9 ? currentSpaceNameClear + '　　' : currentSpaceNameClear
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
    // 判断是否是创建者或者管理员，其他角色不能添加设备
    canAddDevice(data) {
      return data.isManager
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
      return data.spaceHasLight ? 150 : 60
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

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad(query: { from?: string }) {
      Logger.log('space-onLoad', query, 'isManager', this.data.isManager)
      this.data._from = query.from ?? ''
    },

    async onShow() {
      Logger.log('space-onShow, _firstShow', this.data._firstShow, spaceStore.currentSpace)
      // 首次进入
      if (this.data._firstShow && this.data._from !== 'addDevice') {
        this.updateQueue({ isRefresh: true })
        sceneStore.updateAllRoomSceneList()
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
        const { eventType, eventData } = e.result

        // 过滤非本空间的消息
        if (eventData.spaceId !== spaceStore.currentSpace.spaceId) {
          return
        }

        if (eventType === WSEventType.updateHomeDataLanInfo) {
          this.updateQueue({ isRefresh: true })
          return
        }

        // 出现控制失败，控制与消息的对应关系已不可靠，刷新整体数据
        if (eventType === WSEventType.control_fail) {
          this.reloadDataThrottle()
          return
        }

        if (eventType === WSEventType.device_property) {
          // 组装要更新的设备数据，更新的为flatten列表，结构稍不同
          const device = {} as DeviceCard
          device.deviceId = eventData.deviceId
          device.uniId = `${eventData.deviceId}:${eventData.modelName}`
          device.mzgdPropertyDTOList = {}
          device.mzgdPropertyDTOList[eventData.modelName] = {
            ...eventData.event,
          }

          this.updateQueue(device)

          return
        }
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
          ].includes(eventType)
        ) {
          this.reloadDataThrottle(e)
        } else if (eventType === WSEventType.room_del && eventData.spaceId === spaceStore.currentSpaceId) {
          // 空间被删除，退出到首页
          await projectStore.updateSpaceCardList()
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })
    },

    // 响应控制弹窗中单灯/灯组的控制变化，直接按本地设备列表数值以及设置值，刷新空间灯的状态
    refreshLightStatus() {
      let sumOfBrightness = 0,
        sumOfColorTemp = 0,
        count = 0,
        brightness = 0,
        colorTemperature = 0

      // 房间所有灯的亮度计算
      deviceStore.deviceFlattenList.forEach((device) => {
        const { proType, deviceType, mzgdPropertyDTOList, onLineStatus } = device

        // 只需要灯需要参与计算，过滤属性数据不完整的数据，过滤灯组，过滤不在线设备，过滤未开启设备
        if (
          proType !== PRO_TYPE.light ||
          deviceType === 4 ||
          onLineStatus !== 1 ||
          mzgdPropertyDTOList?.light?.power !== 1
        ) {
          return
        }

        sumOfBrightness += mzgdPropertyDTOList.light?.brightness ?? 0
        sumOfColorTemp += mzgdPropertyDTOList.light?.colorTemperature ?? 0
        count++
      })

      if (count) {
        brightness = sumOfBrightness / count
        colorTemperature = sumOfColorTemp / count
      }

      console.log('本地更新房间灯状态', { brightness, colorTemperature })

      this.setData({
        'spaceLight.brightness': brightness,
        'spaceLight.colorTemperature': colorTemperature,
      })
    },

    // 查询空间分组详情
    async queryGroupInfo() {
      const res = await queryGroupBySpaceId({ spaceId: spaceStore.currentSpaceId })
      if (res.success) {
        const spaceStatus = res.result.controlAction[0]
        const { colorTempRangeMap, groupId } = res.result
        this.setData({
          spaceLight: {
            brightness: spaceStatus.brightness,
            colorTemperature: spaceStatus.colorTemperature,
            maxColorTemp: colorTempRangeMap.maxColorTemp,
            minColorTemp: colorTempRangeMap.minColorTemp,
            power: spaceStatus.power,
            groupId,
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
        sceneStore.updateAllRoomSceneList(), this.queryGroupInfo()
        await Promise.all([projectStore.updateSpaceCardList()])

        this.updateQueue({ isRefresh: true })
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 节流更新空间各种关联信息
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

      await deviceStore.updateSpaceDeviceList()
      this.updateQueue({ isRefresh: true })

      this.queryGroupInfo()
    },

    // 节流更新设备列表
    reloadDeviceListThrottle: throttle(function (this: IAnyObject) {
      this.reloadDeviceList()
    }, 3000),

    onUnload() {
      console.log('onUnload spaceStore.currentSpaceId', spaceStore.currentSpaceId)
    },
    onHide() {
      console.log('【onHide】')

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

        const _list = flattenList
          // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
          // 不再排除灯组
          // .filter((device) => !deviceStore.lightsInGroup.includes(device.deviceId))
          // 补充字段
          .map((device) => ({
            ...device,
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

    handleSceneTap() {
      // wx.switchTab({
      //   url: '/pages/automation/index',
      // })
      wx.navigateTo({
        url: '/package-space-control/scene-list/index',
      })
    },
    /** 点击创建场景按钮回调 */
    handleCollect() {
      if (!this.data.isManager) {
        Toast('您当前身份为项目使用者，无法创建场景')
        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-automation/automation-add/index', {
          spaceid: spaceStore.currentSpace.spaceId,
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

      // 其余情况正常响应点击
      this.handleCardCommonTap(e)
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
        const posAttrName = device.deviceType === 2 ? 'level' : 'curtain_position'
        const OldPosition = device.mzgdPropertyDTOList[modelName][posAttrName]
        const NewPosition = Number(OldPosition) > 0 ? '0' : '100'
        const res = await sendDevice({
          proType: device.proType,
          deviceType: device.deviceType,
          deviceId: device.deviceId,
          gatewayId: device.gatewayId,
          property: { [posAttrName]: NewPosition },
          modelName,
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
      projectStore.updateCurrentProjectDetail()
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
      if (!userStore.isManager) {
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

      wx.navigateTo({ url: '/package-distribution/pages/choose-device/index' })
    },
    // ! 目前只有网关离线卡片会有重新联网操作
    handleRebindGateway() {
      const gateway = deviceStore.allDeviceMap[this.data.offlineDevice.deviceId]
      wx.navigateTo({
        url: `/package-distribution/pages/wifi-connect/index?type=changeWifi&sn=${gateway.sn}`,
      })
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        'spaceLight.brightness': e.detail,
      })
    },
    handleLevelEnd(e: { detail: number }) {
      this.setData({
        'spaceLight.brightness': e.detail,
      })
      this.lightSendDeviceControl('brightness')
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        'spaceLight.colorTemperature': e.detail,
      })
    },
    handleColorTempEnd(e: { detail: number }) {
      this.setData({
        'spaceLight.colorTemperature': e.detail,
      })
      this.lightSendDeviceControl('colorTemperature')
    },
    handleSpaceLightTouch() {
      if (!this.data.hasSpaceLightOn) {
        Toast('控制房间色温和亮度前至少开启一盏灯')
      }
    },
    async lightSendDeviceControl(type: 'colorTemperature' | 'brightness') {
      const deviceId = this.data.spaceLight.groupId

      const res = await sendDevice({
        proType: PRO_TYPE.light,
        deviceType: 4,
        deviceId,
        property: {
          [type]: this.data.spaceLight[type],
        },
      })

      if (!res.success) {
        Toast('控制失败')
      }
    },
  },
})
