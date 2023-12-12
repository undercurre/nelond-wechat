import { Logger, isArrEqual, showLoading, hideLoading, isNullOrUnDef } from '../../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, deviceStore, sceneStore, homeStore } from '../../../../store/index'
import {
  maxColorTemp,
  minColorTemp,
  getModelName,
  PRO_TYPE,
  SCREEN_PID,
  KNOB_PID,
  defaultImgDir,
} from '../../../../config/index'
import {
  sendDevice,
  findDevice,
  getLampDeviceByHouseId,
  updateScene,
  getRelLampInfo,
  editLampAndSwitchAssociated,
  delLampAndSwitchAssociated,
  getRelDeviceInfo,
  editSwitchAndSwitchAssociated,
  delSwitchAndSwitchAssociated,
  getSensorLogs,
} from '../../../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehavior from '../../../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'

type ILinkType = 'light' | 'switch' | 'scene'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehavior],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  properties: {
    /**
     * 选中设备的属性
     */
    deviceInfo: {
      type: Object,
      value: {} as Device.DeviceItem,
      observer(device) {
        if (!Object.keys(device).length) {
          return
        }
        const diffData = {} as IAnyObject
        const modelName = getModelName(device.proType, device.productId)
        const prop = device.mzgdPropertyDTOList[modelName]

        // 初始化可控变量
        if (device.proType === PRO_TYPE.light) {
          if (!isNullOrUnDef(prop.brightness)) diffData['lightInfoInner.brightness'] = prop.brightness
          if (!isNullOrUnDef(prop.colorTemperature)) diffData['lightInfoInner.colorTemperature'] = prop.colorTemperature
        } else if (device.proType === PRO_TYPE.curtain) {
          diffData.curtainInfo = {
            position: prop.curtain_position,
          }
        }

        // 初始化设备属性
        diffData.deviceProp = prop

        // 色温范围计算
        if (device.proType === PRO_TYPE.light) {
          const { minColorTemp, maxColorTemp } = device.mzgdPropertyDTOList['light'].colorTempRange!
          diffData.minColorTemp = minColorTemp
          diffData.maxColorTemp = maxColorTemp
        }
        // 是否智慧屏判断
        else if (device.proType === PRO_TYPE.switch) {
          diffData.isScreen = SCREEN_PID.includes(device.productId)
          diffData.isKnob = KNOB_PID.includes(device.productId)
        }
        this.setData(diffData)
      },
    },
    // 是否显示弹窗（简化逻辑，即原controlPopup参数）
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.updateLinkInfo()
          this.updateSensorLogs()
        }
      },
    },
    checkedList: {
      type: Array,
      value: [] as string[],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    defaultImgDir,
    show: false,
    lightInfoInner: {
      brightness: 10,
      colorTemperature: 20,
    },
    curtainInfo: {
      position: 0,
    },
    deviceProp: {} as Device.mzgdPropertyDTO,
    logList: [] as Device.Log[], // 设备（传感器）日志列表
    maxColorTemp,
    minColorTemp,
    /** 提供给关联选择的列表 */
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    /** 当前选中的开关，处于是什么关联模式, 可多选 */
    linkType: [] as ILinkType[],
    /** 关联弹出框，需要开关去关联什么模式 */
    selectLinkType: '' as ILinkType,
    /** 已选中设备或场景 TODO */
    linkSelectList: [] as string[],
    showLinkPopup: false,
    _switchRelInfo: {
      switchUniId: '', // 当前记录关联信息的面板，清空了才会重新更新数据
      lampRelList: Array<Device.IMzgdLampRelGetDTO>(), // 当前面板的灯关联数据
      switchRelList: Array<Device.IMzgdRelGetDTO>(), // 当前面板的关联面板数据
    },
    _allSwitchLampRelList: Array<Device.IMzgdLampDeviceInfoDTO>(), // 家庭所有面板的灯关联关系数据
    isScreen: false, // 当前选中项是否智慧屏
    isKnob: false, // 当前选中项是否旋钮开关
  },

  computed: {
    colorTempK(data) {
      if (!data.lightInfoInner?.colorTemperature) {
        return data.minColorTemp
      }
      return (data.lightInfoInner.colorTemperature / 100) * (data.maxColorTemp - data.minColorTemp) + data.minColorTemp
    },

    // 是否关联智能开关，模板语法不支持Array.includes,改为通过计算属性控制
    isLinkSwitch(data) {
      return data.linkType.includes('switch')
    },

    // 是否关联智能灯
    isLinkLight(data) {
      return data.linkType.includes('light')
    },

    // 是否关联场景
    isLinkScene(data) {
      return data.linkType.includes('scene')
    },

    disabledLinkSetting(data) {
      return data.isVisitor
    },

    selectCardPopupTitle(data) {
      let title = ''

      if (data.selectLinkType === 'light') {
        title = '关联智能灯'
      } else if (data.selectLinkType === 'switch') {
        title = '关联智能开关'
      } else if (data.selectLinkType === 'scene') {
        title = '关联场景'
      }
      return title
    },
    // 是否局域网可控
    isLanCtl(data) {
      return !data.deviceInfo.onLineStatus && data.deviceInfo.canLanCtrl
    },
    logListView(data) {
      return data.logList.map((log) => {
        const { reportAt } = log
        const [date, time] = reportAt.split(' ')
        return {
          content: log.content,
          date,
          time,
        }
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    sliderTap() {
      if (!this.data.deviceProp.power) {
        Toast('请先开灯')
      }
    },

    /**
     * 根据面板ID和面板开关获取关联的灯
     */
    async updateLamoRelInfo(deviceId: string, switchId: string) {
      const res = await getRelLampInfo({
        primaryDeviceId: deviceId,
        primarySwitchId: switchId,
      })

      if (res.success) {
        this.data._switchRelInfo.lampRelList = res.result.lampRelList
      }
    },

    /**
     * 根据面板ID和面板开关获取主动、被动的面板开关
     */
    async getRelSwitchInfo(deviceId: string, switchId: string) {
      const res = await getRelDeviceInfo({
        primaryDeviceId: deviceId,
        primarySwitchId: switchId,
      })

      if (res.success) {
        this.data._switchRelInfo.switchRelList = res.result.primaryRelDeviceInfo.concat(res.result.secondRelDeviceInfo)
      }
    },
    /**
     * 选择的设备为单个开关时触发更新【开关关联信息】
     */
    async updateLinkInfo() {
      const switchUniId = this.data.checkedList[0]
      const switchRelInfo = this.data._switchRelInfo
      // 仅弹窗时且选择的是开关面板时触发，通过_switchRelInfo.switchUniId标志是否为空来防止重复请求
      if (!this.data.checkedList[0]?.includes(':') || switchUniId === switchRelInfo.switchUniId) {
        return
      }

      switchRelInfo.switchUniId = switchUniId

      Logger.log('updateLinkInfo')
      const [deviceId, switchId] = switchUniId.split(':')

      let linkType = [] as ILinkType[]

      // 优先判断场景关联信息（已有数据）
      if (deviceStore.switchSceneConditionMap[switchUniId]) {
        linkType = ['scene']
      } else {
        await Promise.all([this.updateLamoRelInfo(deviceId, switchId), this.getRelSwitchInfo(deviceId, switchId)])

        if (switchRelInfo && switchRelInfo.lampRelList.length) {
          linkType.push('light')
        }

        if (switchRelInfo && switchRelInfo.switchRelList.length) {
          linkType.push('switch')
        }
      }

      this.setData({
        linkType: linkType,
      })
    },
    async updateSensorLogs() {
      const { deviceId, proType } = this.data.deviceInfo
      if (proType !== PRO_TYPE.sensor) {
        return
      }
      const res = await getSensorLogs({ deviceId, projectId: homeStore.currentProjectId })
      console.log(res)
      this.setData({
        logList: res.result,
      })
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleLinkPopup() {
      const switchUniId = this.data.checkedList[0]

      // 关联场景显示逻辑
      if (this.data.selectLinkType === 'scene') {
        this.setData({
          list: [...sceneStore.allRoomSceneList],
          linkSelectList: deviceStore.switchSceneConditionMap[switchUniId]
            ? [deviceStore.switchSceneConditionMap[switchUniId]]
            : [],
          showLinkPopup: true,
        })
        return
      }

      let linkSelectList = [] as string[]
      let list = [] as Device.DeviceItem[]

      const relInfo = this.data._switchRelInfo

      if (this.data.selectLinkType === 'light') {
        list = deviceStore.allRoomDeviceFlattenList.filter((item) => item.proType === PRO_TYPE.light)

        linkSelectList = relInfo.lampRelList.map((device) => device.lampDeviceId.replace('group-', ''))
      } else if (this.data.selectLinkType === 'switch') {
        list = deviceStore.allRoomDeviceFlattenList.filter(
          (item) => item.proType === PRO_TYPE.switch && item.uniId !== switchUniId,
        )

        // 合并主动和被动关联的开关列表数据，并去重，作为已选列表
        linkSelectList = relInfo.switchRelList.map((device) => `${device.deviceId}:${device.switchId}`)
      }

      if (list.length === 0) {
        Toast('没有可关联的设备')
        return
      }

      this.setData({
        list,
        linkSelectList,
        showLinkPopup: true,
      })
    },

    /**
     * 离线设备卡片选择事件
     * 存在之前关联的设备突然离线了,导致无法取消选择的情况，需要单独处理
     */
    handleOfflineTap(e: { detail: string }) {
      const selectId = e.detail

      if (this.data.linkSelectList.includes(selectId)) {
        const index = this.data.linkSelectList.findIndex((id) => id === selectId)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
        })
      } else {
        Toast({ message: '设备已离线', zIndex: 9999 })
      }
    },

    async handleLinkSelect(e: { detail: string }) {
      const deviceMap = deviceStore.allRoomDeviceFlattenMap
      const switchUniId = this.data.checkedList[0]
      const selectId = e.detail

      // 取消选择逻辑
      if (this.data.linkSelectList.includes(selectId)) {
        const index = this.data.linkSelectList.findIndex((id) => id === selectId)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
        })
        return
      }

      const switchSceneConditionMap = deviceStore.switchSceneConditionMap

      // 关联开关和灯时，选择设备的预校验
      if (['light', 'switch'].includes(this.data.selectLinkType)) {
        const device = deviceMap[selectId]
        device.deviceType === 2 && this.findDevice(device)

        const linkScene = switchSceneConditionMap[selectId]

        // 关联开关时，针对选择的开关做校验，是否已关联场景
        if (this.data.selectLinkType === 'switch' && linkScene) {
          const dialogRes = await Dialog.confirm({
            title: '此开关已关联场景，是否取消关联？',
            cancelButtonText: '取消',
            confirmButtonText: '确定',
            zIndex: 2000,
            context: this,
          })
            .then(() => true)
            .catch(() => false)

          if (!dialogRes) {
            return
          }
        }

        // 灯具关联，只允许关联1个
        this.setData({
          linkSelectList: this.data.selectLinkType === 'switch' ? [...this.data.linkSelectList, selectId] : [selectId],
        })
      } else if (this.data.selectLinkType === 'scene') {
        const switchSceneActionMap = deviceStore.switchSceneActionMap

        // todo: 是否需要该提示
        if (switchSceneActionMap[switchUniId]?.includes(selectId)) {
          const dialogRes = await Dialog.confirm({
            title: '此开关已被当前场景使用，是否需要变更？',
            cancelButtonText: '取消',
            confirmButtonText: '变更',
            zIndex: 2000,
            context: this,
          })
            .then(() => true)
            .catch(() => false)

          if (!dialogRes) {
            return
          }
        }

        this.setData({
          linkSelectList: [selectId],
        })
      }
    },
    async handleSelectLinkPopupConfirm(e: WechatMiniprogram.TouchEvent) {
      if (this.data.disabledLinkSetting) {
        const message = '只能创建者及管理员进行关联'
        Toast({ message, zIndex: 9999 })
        return
      }

      const { type } = e.currentTarget.dataset
      this.setData({
        selectLinkType: type,
      })

      if (type === 'switch') {
        const res = await getLampDeviceByHouseId({ projectId: homeStore.currentProjectId })

        if (res.success) {
          this.data._allSwitchLampRelList = res.result
        }
      }
      setTimeout(() => {
        this.handleLinkPopup()
      }, 500)
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupReturn() {
      this.setData({
        showLinkPopup: false,
      })
    },
    /** 关联开关 */
    async updateSwitchAssociate() {
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap

      // 遍历linkSelectList所选择的面板，是否存在已有关联，若是存在灯关联或者场景关联，则删除
      for (const uniId of this.data.linkSelectList) {
        const sceneId = switchSceneConditionMap[uniId]
        // 若存在场景关联则删除
        if (sceneId) {
          const res = await updateScene({
            sceneId: sceneId,
            updateType: '2',
          })

          if (!res.success) {
            Toast({ message: '删除场景关联失败', zIndex: 9999 })
            return
          }

          // 若存在场景关联，则不可能存在灯关联，无需判断后面的逻辑
          continue
        }

        const lampRelList = this.data._allSwitchLampRelList.filter(
          (item) => `${item.panelId}:${item.switchId}` === uniId,
        ) // 指定面板的灯关联关系列表

        if (lampRelList.length) {
          // 删除指定面板和灯的关联数据
          const [selectedDeviceId, selectedSwitchId] = uniId.split(':')

          const res = await delLampAndSwitchAssociated({
            deviceId: selectedDeviceId,
            switchId: selectedSwitchId,
            relIds: lampRelList.map((item) => item.lampDeviceId).join(','),
          })

          if (!res.success) {
            Toast({ message: '删除面板已有的灯关联失败', zIndex: 9999 })
            return
          }
        }
      }

      // 编辑面板和面板的关联数据
      return editSwitchAndSwitchAssociated({
        primaryDeviceId: deviceId,
        primarySwitchId: switchId,
        secondSwitchs: this.data.linkSelectList.map((item) => item.replace(':', '-')).join(','),
      })
    },

    /**
     * 更新场景绑定数据
     */
    async updataSceneLink() {
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      const oldSceneId = switchSceneConditionMap[switchUniId]
      const newSceneId = this.data.linkSelectList[0]

      if (oldSceneId) {
        // 更新场景关联，先取消关联当前场景，再关联其他场景
        const res = await updateScene({
          conditionType: '0',
          sceneId: oldSceneId,
          updateType: '2',
        })

        if (!res.success) {
          Toast({
            message: '更新失败',
            zIndex: 99999,
          })
          return
        }
        sceneStore.removeCondition(oldSceneId)
      }

      // 关联新的场景
      const updateSceneDto = {
        conditionType: '0',
        sceneId: newSceneId,
        updateType: '3',
        deviceConditions: [
          {
            deviceId,
            controlEvent: [
              {
                modelName: switchId,
                buttonScene: 1,
              },
            ],
          },
        ],
      } as Scene.UpdateSceneDto

      const res = await updateScene(updateSceneDto)
      sceneStore.addCondition(updateSceneDto)

      return res
    },

    /**
     * 删除面板的关联关系
     * @param delTypeList 要删除的关联数据类型List
     */
    async deleteAssocite(delTypeList: ILinkType[]) {
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      let res

      if (delTypeList.includes('light')) {
        // 删除面板和灯的关联数据
        res = await delLampAndSwitchAssociated(
          {
            deviceId,
            switchId,
            relIds: this.data._switchRelInfo.lampRelList.map((item) => item.relId).join(','),
          },
          { loading: true },
        )

        if (!res?.success) {
          Toast({
            message: '解除原关联失败',
            zIndex: 99999,
          })

          return res
        }
      }

      if (delTypeList.includes('switch')) {
        // 删除面板和面板的关联数据
        res = await delSwitchAndSwitchAssociated(
          {
            relIds: this.data._switchRelInfo.switchRelList.map((item) => item.relId).join(','),
          },
          { loading: true },
        )

        if (!res?.success) {
          Toast({
            message: '解除原关联失败',
            zIndex: 99999,
          })

          return res
        }
      }

      if (delTypeList.includes('scene')) {
        // 删除场景关联
        const oldSceneId = deviceStore.switchSceneConditionMap[switchUniId]

        if (oldSceneId) {
          res = await updateScene(
            {
              sceneId: oldSceneId,
              updateType: '2',
            },
            { loading: true },
          )

          if (!res?.success) {
            Toast({
              message: '解除原关联失败',
              zIndex: 99999,
            })

            return res
          }
        }

        sceneStore.removeCondition(oldSceneId)
      }

      return { success: true }
    },

    async editAssocite() {
      const switchUniId = this.data.checkedList[0]
      const [deviceId, switchId] = switchUniId.split(':')
      let res

      if (this.data.selectLinkType === 'light') {
        const deviceMap = deviceStore.allRoomDeviceMap
        const device = deviceMap[this.data.linkSelectList[0]]

        if (device.deviceType === 4) {
          this.data.linkSelectList[0] = 'group-' + this.data.linkSelectList[0]
        }

        // 编辑和灯的关联数据
        res = await editLampAndSwitchAssociated({
          primaryDeviceId: deviceId,
          primarySwitchId: switchId,
          lampDevices: this.data.linkSelectList.join(','),
        })
      } else if (this.data.selectLinkType === 'switch') {
        res = await this.updateSwitchAssociate()
      } else if (this.data.selectLinkType === 'scene') {
        res = await this.updataSceneLink()
      }

      if (!res?.success) {
        Toast('更新关联关系失败')
      }

      return res
    },

    /**
     * 关联逻辑，开关关联和灯关联可以共存，场景关联和其他不能共存
     */
    async handleLinkPopupConfirm() {
      this.setData({
        showLinkPopup: false,
      })
      const switchUniId = this.data.checkedList[0]
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const lampRelList = this.data._switchRelInfo.lampRelList.map(
        (item) => `${item.lampDeviceId.replace('group-', '')}`,
      ) // 指定面板的灯关联关系列表
      const switchRelList = this.data._switchRelInfo.switchRelList.map((item) => `${item.deviceId}:${item.switchId}`) // 指定面板的灯关联关系列表
      const { linkType, selectLinkType, linkSelectList } = this.data

      // 关联操作，选择前后的数据没变化，不执行操作，如
      // 1、关联类型且选择前后的数据一致
      if (
        (!linkType.includes(selectLinkType) && linkSelectList.length === 0) ||
        (linkType.includes(selectLinkType) &&
          ((linkType.includes('scene') && linkSelectList[0] === switchSceneConditionMap[switchUniId]) ||
            (linkType.includes('light') && isArrEqual(linkSelectList, lampRelList)) ||
            (linkType.includes('switch') && isArrEqual(linkSelectList, switchRelList))))
      ) {
        Logger.log('关联关系没发生变化，不执行操作')
        return
      }

      // 若面板已存在关联的情况下， 开关关联和灯关联可以共存，场景关联和其他不能共存
      // 1、若面板已存在关联且与新关联数据的类型不能共存
      // 2、已选择的列表为空时即清空指定关联类型的原有绑定关系
      // 执行删除已有关联操作
      if (
        linkType.length &&
        ((!linkType.includes(selectLinkType) && [...linkType, selectLinkType].includes('scene')) ||
          linkSelectList.length === 0)
      ) {
        // 场景关联和设备关联，这两种不能共存，变更绑定类型的情况下弹框确认
        if (!linkType.includes(selectLinkType) && [...linkType, selectLinkType].includes('scene')) {
          const dialogRes = await Dialog.confirm({
            title: '设备关联和场景关联不能同时存在，是否变更？',
            cancelButtonText: '取消',
            confirmButtonText: '确定',
            zIndex: 2000,
            context: this,
          })
            .then(() => true)
            .catch(() => false)

          if (!dialogRes) {
            return
          }
        }

        // 当linkSelectList为空时，代表清空当前指定类型的关联数据，不应全部清除
        const delRes = await this.deleteAssocite(linkSelectList.length === 0 ? [selectLinkType] : linkType)

        if (!delRes?.success) {
          return
        }
      }

      showLoading()
      // 编辑新增新的绑定关系数据
      // 若选择的数据linkSelectList为空,无需执行编辑操作
      if (linkSelectList.length > 0) {
        await this.editAssocite()
      }

      // sceneStore.updateAllRoomSceneList(),
      await Promise.all([deviceStore.updateAllRoomDeviceList()])

      this.data._switchRelInfo.switchUniId = '' // 置空标志位，否则不会更新数据
      this.updateLinkInfo()

      hideLoading()
    },
    async lightSendDeviceControl(type: 'colorTemperature' | 'brightness') {
      const deviceId = this.data.checkedList[0]
      const { proType, deviceType, gatewayId } = this.data.deviceInfo
      const device = deviceStore.deviceMap[deviceId]
      if (deviceId.indexOf(':') !== -1 || proType !== PRO_TYPE.light) {
        return
      }

      const oldValue = this.data.deviceInfo[type]

      // 即时改变devicePageList，以便场景引用
      runInAction(() => {
        deviceStore.deviceMap[deviceId].mzgdPropertyDTOList['light'][type] = this.data.lightInfoInner[type]
      })
      device.mzgdPropertyDTOList['light'][type] = this.data.lightInfoInner[type]
      this.triggerEvent('updateDevice', device)

      const res = await sendDevice({
        proType,
        deviceType,
        gatewayId,
        deviceId,
        modelName: proType === PRO_TYPE.light ? 'light' : 'wallSwitch1',
        property: {
          [type]: this.data.lightInfoInner[type],
        },
      })

      if (!res.success) {
        device.mzgdPropertyDTOList['light'][type] = oldValue
        this.triggerEvent('updateDevice', device)
        Toast('控制失败')
      }
    },
    async handleLevelDrag(e: { detail: number }) {
      this.setData({
        'lightInfoInner.brightness': e.detail,
      })
    },
    async handleLevelChange(e: { detail: number }) {
      this.setData({
        'lightInfoInner.brightness': e.detail,
      })
      this.lightSendDeviceControl('brightness')
      this.triggerEvent('lightStatusChange')
    },
    handleColorTempChange(e: { detail: number }) {
      console.log('handleColorTempChange', e.detail)
      this.setData({
        'lightInfoInner.colorTemperature': e.detail,
      })
      this.lightSendDeviceControl('colorTemperature')
      this.triggerEvent('lightStatusChange')
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        'lightInfoInner.colorTemperature': e.detail,
      })
    },

    findDevice(device: Device.DeviceItem) {
      let modelName = 'light'
      if (device.proType === PRO_TYPE.switch) {
        modelName = device.switchInfoDTOList[0].switchId
      }

      findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })
    },
    toDetail() {
      const deviceId = this.data.checkedList[0].split(':')[0]
      const { deviceType, productId, gatewayId } = this.data.deviceInfo
      const pageName = deviceType === 4 ? 'group-detail' : 'device-detail'
      const _deviceId = SCREEN_PID.includes(productId) ? gatewayId : deviceId

      wx.navigateTo({
        url: `/package-mine/device-manage/${pageName}/index?deviceId=${_deviceId}`,
      })
    },
    async curtainControl(property: IAnyObject) {
      const deviceId = this.data.checkedList[0]
      const { deviceType, proType } = this.data.deviceInfo
      if (proType !== PRO_TYPE.curtain) {
        return
      }

      const res = await sendDevice({
        proType,
        deviceType,
        deviceId,
        property,
      })

      if (!res.success) {
        Toast('控制失败')
      }
    },
    openCurtain() {
      this.curtainControl({
        curtain_position: '100',
        curtain_status: 'open',
      })
    },
    closeCurtain() {
      this.curtainControl({
        curtain_position: '0',
        curtain_status: 'close',
      })
    },
    pauseCurtain() {
      this.curtainControl({
        curtain_status: 'stop',
      })
    },
    changeCurtain(e: { detail: number }) {
      this.curtainControl({
        curtain_position: e.detail,
      })
    },
    handleCardTap() {},
  },
})
