import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { deleteScene, addScene, updateScene, findDevice, sendDevice, execScene } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore, sceneStore, projectStore, autosceneStore, spaceStore } from '../../store/index'
import { PRO_TYPE, PRODUCT_ID, getModelName, sceneImgDir, SENSOR_MODEL_NAME } from '../../config/index'
import {
  toPropertyDesc,
  storage,
  getCurrentPageParams,
  strUtil,
  checkInputNameIllegal,
  emitter,
} from '../../utils/index'
import { adviceSceneNameList } from '../../config/scene'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    dialogConfirmBtnColor: '#27282A',
    sceneImgDir: sceneImgDir(),
    opearationType: 'yijian', // yijian是一键场景，auto是自动化场景
    conditionMultiple: '',
    spaceId: '', //选中的最后一级空间Id
    // 选中的四级空间信息
    selectedSpaceInfo: [] as Space.allSpace[],
    showEditRoomPopup: false,
    adviceSceneNameList: adviceSceneNameList,
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    _autosceneInfo: {} as AutoScene.AutoSceneItem, //待编辑的自动化
    autoSceneId: '',
    yijianSceneId: '',
    isDefaultYijianScene: false,
    sceneIcon: 'icon-1',
    sceneName: '',
    //场景的生效时间段
    effectiveTime: {
      timePeriod: '1,2,3,4,5,6,7', //周日-周六
      timeType: '1', //时间类型，0-仅一次，1-自定义，2-法定工作日，3-法定节假日
      startTime: '00:00',
      endTime: '23:59',
    },
    // contentHeight: 0,
    showEditIconPopup: false, //展示编辑场景图标popup
    showEditConditionPopup: false, //展示添加条件popup
    showPreConditionPopup: false, //展示预制条件popup
    showEditActionPopup: false, //展示添加执行动作popup
    showTimeConditionPopup: false, //展示时间条件popup
    showDelayPopup: false, //展示延时popup
    showEffectiveTimePopup: false, //设置场景生效时间段
    showEditPopup: '', // 要展示的编辑弹窗类型
    sceneEditTitle: '',
    sceneEditInfo: {} as IAnyObject,

    //场景和设备的组合列表
    // list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    //场景列表
    sceneList: [] as Scene.SceneItem[],
    //设备列表 //除网关智慧屏和传感器
    deviceList: [] as Device.DeviceItem[],
    //传感器列表
    sensorList: [] as Device.DeviceItem[],
    /** 已选中设备或场景 TODO */
    sceneDevicelinkSelectList: [] as string[],
    tempSceneDevicelinkSelectedList: [] as string[],
    /** 已选中的传感器 */
    sensorlinkSelectList: [] as { deviceId: string; datetime: string }[],
    tempSensorlinkSelectList: [] as string[],
    selectCardType: 'device', //设备卡片：'device'  场景卡片： 'scene'  传感器卡片：'sensor'
    showSelectCardPopup: false,
    /** 将当前场景里多路的action拍扁 */
    sceneDeviceActionsFlatten: [] as AutoScene.AutoSceneFlattenAction[],
    /** 将当前场景里多路的Condition拍扁 */
    sceneDeviceConditionsFlatten: [] as AutoScene.AutoSceneFlattenCondition[],
    //延时
    delay: [0, 0],
    timeConditions: [] as {
      timeId: string
      time: string
      timePeriod: string | null
      timeType: string
    }[],
    //时间条件
    timeCondition: {
      timeId: '',
      time: '',
      timePeriod: '',
      timeType: '',
    },
    _cacheDeviceMap: {} as IAnyObject, // 缓存设备设置预览前的设备状态，用于退出时恢复
    /** 是否修改过action */
    _isEditAction: false,
    /** 是否修改过Condition */
    _isEditCondition: false,
    /** 是否修改过图标或名称 */
    // _isEditIconOrName: false,

    editingSensorType: 'midea.ir.201',
    editingSensorAbility: ['有人移动'],
    editingSensorProperty: { occupancy: 1, modelName: 'irDetector' } as IAnyObject,
    editingUniId: '',
    editingDelayId: '',
    scrollTop: 0,
    _isSaving: false,
    timeConditionPopupLock: false,
  },

  computed: {
    list(data) {
      if (data.selectCardType === 'scene') {
        return data.sceneList
      } else if (data.selectCardType === 'sensor') {
        return data.sensorList
      } else {
        return data.deviceList.filter(
          (item) => !data.sceneDevicelinkSelectList.includes(item.uniId) && item.onLineStatus === 1,
        )
      }
    },
    showFindBtn(data) {
      const { selectCardType, linkSelectList } = data
      if (selectCardType !== 'device') return false
      if (linkSelectList?.length !== 1) return false

      const { proType } = deviceStore.allDeviceFlattenMap[linkSelectList[0]]
      return proType === PRO_TYPE.light
    },
    // cardType(data) {
    //   return data.selectCardType === 'device' || data.selectCardType === 'sensor' ? 'device' : 'scene'
    // },

    isAllday(data) {
      const start = data.effectiveTime.startTime.split(':')
      const startMin = Number(start[0]) * 60 + Number(start[1])
      const end = data.effectiveTime.endTime.split(':')
      const endMin = Number(end[0]) * 60 + Number(end[1])
      if (startMin - endMin === 1 || (startMin === 0 && endMin === 1439)) {
        return true
      } else {
        return false
      }
    },
    timePeriodDesc(data) {
      return strUtil.transPeriodDesc(data.effectiveTime.timeType, data.effectiveTime.timePeriod)
    },
    endTimeDesc(data) {
      const startTimeHour = parseInt(data.effectiveTime.startTime.substring(0, 2))
      const endTimeHour = parseInt(data.effectiveTime.endTime.substring(0, 2))
      const startTimeMin = parseInt(
        data.effectiveTime.startTime.substring(data.effectiveTime.startTime.indexOf(':') + 1),
      )
      const endTimeMin = parseInt(data.effectiveTime.endTime.substring(data.effectiveTime.endTime.indexOf(':') + 1))

      if (endTimeHour < startTimeHour) {
        return `次日${data.effectiveTime.endTime}`
      } else if (endTimeHour === startTimeHour) {
        if (endTimeMin <= startTimeMin) {
          return `次日${data.effectiveTime.endTime}`
        } else {
          return data.effectiveTime.endTime
        }
      } else {
        return data.effectiveTime.endTime
      }
    },
    linkSelectList(data) {
      if (data.selectCardType === 'sensor') {
        return data.tempSensorlinkSelectList
      } else {
        return data.tempSceneDevicelinkSelectedList
      }
    },
    linkSelectSensorListMapProductId(data) {
      return data.sensorList
        .filter((item) => data.sensorlinkSelectList.map((item) => item.deviceId).includes(item.deviceId))
        .map((item) => item.productId)
    },

    //只包含场景和设备的动作列表长度
    sceneDeviceActionsLength(data) {
      return data.sceneDeviceActionsFlatten.filter((item) => item.uniId.indexOf('DLY') === -1).length
    },
    okBtnText(data) {
      return data.autoSceneId || data.yijianSceneId ? '确定' : '设置好了'
    },
  },
  lifetimes: {
    attached() {
      // wx.createSelectorQuery()
      //   .select('#content')
      //   .boundingClientRect()
      //   .exec((res) => {
      //     console.log('res', res)
      //     if (res[0] && res[0].height) {
      //       this.setData({
      //         contentHeight: res[0].height,
      //       })
      //     }
      //   })
    },
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad() {
      const { autosceneid, spaceid, yijianSceneId, selectedSpaceInfo } = getCurrentPageParams()
      console.log(
        '_selectedSpaceInfo_selectedSpaceInfo',
        selectedSpaceInfo,
        Boolean(selectedSpaceInfo),
        typeof selectedSpaceInfo,
      )

      const _selectedSpaceInfo = selectedSpaceInfo ? JSON.parse(selectedSpaceInfo) : []

      // #region 处理三个传感器、场景和设备列表
      await Promise.all([
        sceneStore.updateAllRoomSceneList(),
        deviceStore.updateAllDeviceList(), //deviceStore.updateSubDeviceList(), //
      ])
      const sensorList = deviceStore.allDeviceFlattenList.filter((item) => item.proType === PRO_TYPE.sensor)
      sensorList.forEach((item) => {
        if ([PRODUCT_ID.humanSensor, PRODUCT_ID.bodysensor].includes(item.productId)) {
          item.property = { occupancy: 1, modelName: SENSOR_MODEL_NAME[item.productId] }
        } else if (item.productId === PRODUCT_ID.doorSensor) {
          item.property = { doorStatus: 1, modelName: SENSOR_MODEL_NAME[item.productId] }
        } else if (item.productId === PRODUCT_ID.lightSensor) {
          item.property = {
            illuminance: 0,
            illuminance_symbol: 'equalTo',
            modelName: SENSOR_MODEL_NAME[item.productId],
          }
        } else {
          item.property = { buttonClicked: 1, modelName: 'freepad' }
        }
      })
      this.setData({
        sceneList: [...sceneStore.allRoomSceneList],
        deviceList: deviceStore.allDeviceFlattenList.filter(
          (item) => item.proType !== PRO_TYPE.gateway && item.proType !== PRO_TYPE.sensor,
        ),
        sensorList,
      })
      // #endregion 处理三个传感器、场景和设备列表

      if (autosceneid) {
        this.setData({ autoSceneId: autosceneid, opearationType: 'auto' })

        const sensorlinkSelectList = [] as { deviceId: string; datetime: string }[]

        const autoSceneInfo = autosceneStore.allRoomAutoSceneList.find(
          (item) => item.sceneId === autosceneid,
        ) as AutoScene.AutoSceneItem
        console.log('autoSceneInfo', autoSceneInfo)
        console.log('typeof', typeof autoSceneInfo.deviceConditions, !autoSceneInfo.deviceConditions)

        this.data._autosceneInfo = autoSceneInfo
        const conditionsLength = autoSceneInfo.timeConditions.length + autoSceneInfo.deviceConditions.length
        this.setData({
          conditionMultiple: conditionsLength > 1 ? (autoSceneInfo.conditionType === '1' ? 'all' : 'some') : '',
          sceneIcon: autoSceneInfo.sceneIcon,
          sceneName: autoSceneInfo.sceneName,
          'effectiveTime.startTime': autoSceneInfo.effectiveTime.startTime.substring(0, 5),
          'effectiveTime.endTime': autoSceneInfo.effectiveTime.endTime.substring(0, 5),
          'effectiveTime.timePeriod': autoSceneInfo.effectiveTime.timePeriod,
          'effectiveTime.timeType': autoSceneInfo.effectiveTime.timeType,
        })
        // autoSceneInfo.deviceConditions = autoSceneInfo.deviceConditions || []
        // autoSceneInfo.deviceActions = autoSceneInfo.deviceActions || []
        console.log('场景数据', autoSceneInfo.deviceActions, autoSceneInfo.deviceActions.length)
        // return
        //处理执行条件
        // if (autoSceneInfo.deviceConditions.length) {
        //传感器条件
        autoSceneInfo.deviceConditions.forEach((action, dIndex) => {
          const index = this.data.sensorList.findIndex((item) => item.uniId === action.deviceId)
          if (index !== -1) {
            sensorlinkSelectList.push({
              deviceId: action.deviceId,
              datetime: (new Date().getTime() + dIndex).toString(),
            })

            // TODO: 拿到正确的event回显
            this.data.sensorList[index].property = {
              ...action.controlEvent[0],
            }
          } else {
            console.log('设备不存在', action)
          }
        })
        // } else {
        //时间条件
        if (autoSceneInfo.timeConditions.length > 0) {
          const timeConditions = autoSceneInfo.timeConditions[0]
          console.log('初始化的timeCondition', autoSceneInfo.timeConditions)
          this.setData({
            timeConditions: autoSceneInfo.timeConditions.map((item) => {
              return {
                ...item,
                timeId: `time${(new Date().getTime() + Math.floor(Math.random() * 10) + 1).toString()}`,
              }
            }),
            'timeCondition.time': timeConditions.time,
            'timeCondition.timePeriod': timeConditions.timePeriod,
            'timeCondition.timeType': timeConditions.timeType,
          })
        }
        // }
        //处理执行结果
        const tempSceneDeviceActionsFlatten = [] as AutoScene.AutoSceneFlattenAction[]

        autoSceneInfo.deviceActions.forEach((action, index) => {
          if (action.deviceType === 6) {
            tempSceneDeviceActionsFlatten.push({
              uniId: action.deviceId,
              name: '延时',
              desc: [strUtil.formatTime(action.delayTime)],
              type: action.deviceType,
              pic: '/package-automation/assets/imgs/automation/stopwatch-materialized.png',
              value: { delayTime: action.delayTime },
              orderNum: index,
              dragId: action.deviceId,
            })
          } else if (action.deviceType === 5) {
            //场景
            const scene = this.data.sceneList.find((item) => item.sceneId === action.deviceId)
            if (scene) {
              //是场景
              const space = spaceStore.allSpaceList.find((item) => item.spaceId === scene.spaceId) as Space.allSpace
              tempSceneDeviceActionsFlatten.push({
                uniId: scene.sceneId,
                name: scene.sceneName,
                type: 5,
                desc: [spaceStore.getSpaceClearName(space)],
                pic: `${this.data.sceneImgDir}/${scene.sceneIcon}.png`,
                value: {},
                orderNum: index,
                dragId: scene.sceneId + Math.floor(Math.random() * 1001),
              })
            } else {
              console.log('场景不存在', action)
            }
          } else {
            //设备
            let deviceUniId = action.deviceId
            if (action.proType === PRO_TYPE.switch) {
              deviceUniId = `${action.deviceId}:${action.controlAction[0].modelName}`
            }
            const device = this.data.deviceList.find((item) => item.uniId === deviceUniId)

            if (device) {
              //是设备
              if (device.proType === PRO_TYPE.switch) {
                //是开关面板
                const power = action.controlAction[0].power
                const desc = toPropertyDesc(device, action.controlAction[0])
                const { switchName } = device.switchInfoDTOList[0]
                let { deviceName } = device
                console.log('[ssss]', switchName, deviceName)
                if (switchName.length + deviceName.length > 15) {
                  deviceName = deviceName.slice(0, 12 - switchName.length) + '...' + deviceName.slice(-2)
                }
                tempSceneDeviceActionsFlatten.push({
                  uniId: device.uniId,
                  name: `${switchName}|${deviceName}`,
                  type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                  desc,
                  pic: device.switchInfoDTOList[0].pic,
                  proType: PRO_TYPE.switch,
                  value: {
                    modelName: action.controlAction[0].modelName,
                    power,
                  },
                  productId: device.productId,
                  orderNum: 0,
                  dragId: device.uniId + Math.floor(Math.random() * 1001),
                })
                console.log('添加开关面板', tempSceneDeviceActionsFlatten)
              } else {
                const modelName = getModelName(device.proType, device.productId)
                const property = {
                  ...device.mzgdPropertyDTOList[modelName],
                  ...action.controlAction[0],
                }
                const desc = toPropertyDesc(device, property)
                tempSceneDeviceActionsFlatten.push({
                  uniId: device.uniId,
                  name: device.deviceName,
                  type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                  desc,
                  pic: device.pic as string,
                  proType: device.proType,
                  value: {
                    ...property,
                    modelName: getModelName(device.proType, device.productId),
                  },
                  productId: device.productId,
                  orderNum: 0,
                  dragId: device.uniId + Math.floor(Math.random() * 1001),
                })
              }
            } else {
              console.log('设备不存在', action)
            }
          }
        })

        this.setData(
          {
            sensorlinkSelectList,
            sceneDeviceActionsFlatten: tempSceneDeviceActionsFlatten,
          },
          () => {
            this.updateSceneDeviceActionsFlatten(false)
            this.updateSceneDeviceConditionsFlatten()
          },
        )
        return
      }

      if (yijianSceneId && spaceid) {
        this.setData({ yijianSceneId: yijianSceneId, opearationType: 'yijian' })

        // 获取当前scene
        const sceneInfo = sceneStore.allRoomSceneList.find((item) => item.sceneId === yijianSceneId) as Scene.SceneItem
        console.log('当前场景', sceneInfo)
        this.data._sceneInfo = sceneInfo
        this.setData({
          sceneIcon: sceneInfo.sceneIcon,
          sceneName: sceneInfo.sceneName,
          spaceId: sceneInfo.spaceId,
          selectedSpaceInfo: _selectedSpaceInfo,
          isDefaultYijianScene: sceneInfo.isDefault === '1',
        })

        this.updateSceneDeviceConditionsFlatten()

        //处理执行结果
        const tempSceneDeviceActionsFlatten = [] as AutoScene.AutoSceneFlattenAction[]
        const tempSceneDevicelinkSelectList: string[] = []

        sceneInfo.deviceActions.forEach((action) => {
          //设备
          let deviceUniId = action.deviceId
          if (action.proType === PRO_TYPE.switch) {
            deviceUniId = `${action.deviceId}:${action.controlAction[0].modelName}`
          }
          let device = this.data.deviceList.find((item) => item.uniId === deviceUniId)
          console.log('找到选项', device)
          if (device) {
            //是设备
            if (device.proType === PRO_TYPE.switch) {
              //是开关面板
              action.controlAction.forEach((switchInPanel, switchIndex) => {
                deviceUniId = `${action.deviceId}:${action.controlAction[switchIndex].modelName}`
                device = this.data.deviceList.find((item) => item.uniId === deviceUniId)
                if (device) {
                  console.log('找到选项', device)
                  const power = action.controlAction[switchIndex].power
                  const desc = toPropertyDesc(device, action.controlAction[switchIndex])
                  const { switchName } = device.switchInfoDTOList[0]
                  let { deviceName } = device
                  if (switchName.length + deviceName.length > 15) {
                    deviceName = deviceName.slice(0, 12 - switchName.length) + '...' + deviceName.slice(-2)
                  }
                  tempSceneDevicelinkSelectList.push(device.uniId)
                  tempSceneDeviceActionsFlatten.push({
                    uniId: device.uniId,
                    name: `${switchName}|${deviceName}`,
                    type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                    desc,
                    pic: device.switchInfoDTOList[0].pic,
                    proType: PRO_TYPE.switch,
                    value: {
                      modelName: action.controlAction[switchIndex].modelName,
                      power,
                    },
                    productId: device.productId,
                    orderNum: 0,
                    dragId: device.uniId + Math.floor(Math.random() * 1001),
                  })
                  console.log(
                    '初始化',
                    switchInPanel,
                    `${device.switchInfoDTOList[0].switchName} | ${device.deviceName}`,
                  )
                }
              })
            } else {
              const modelName = getModelName(device.proType, device.productId)
              const property = {
                ...device.mzgdPropertyDTOList[modelName],
                ...action.controlAction[0],
              }
              console.log('propertyproperty', property)

              const desc = toPropertyDesc(device, property)
              tempSceneDevicelinkSelectList.push(device.uniId)
              tempSceneDeviceActionsFlatten.push({
                uniId: device.uniId,
                name: device.deviceName,
                type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                desc,
                pic: device.pic as string,
                proType: device.proType,
                value: {
                  ...property,
                  modelName: getModelName(device.proType, device.productId),
                },
                productId: device.productId,
                orderNum: 0,
                dragId: device.uniId + Math.floor(Math.random() * 1001),
              })
            }
          } else {
            console.log('设备不存在', action)
          }
        })
        this.setData(
          {
            sceneDevicelinkSelectList: tempSceneDevicelinkSelectList,
            sceneDeviceActionsFlatten: tempSceneDeviceActionsFlatten,
          },
          () => {
            console.log('初始化已选择列表', this.data.sceneDevicelinkSelectList, this.data.sceneDeviceActionsFlatten)
            this.updateSceneDeviceActionsFlatten()
            this.updateSceneDeviceConditionsFlatten()
          },
        )
        return
      }
      if (spaceid) {
        const deviceListInRoom: Device.DeviceItem[] = deviceStore.allDeviceFlattenList.filter(
          (item) => item.spaceId === spaceid,
        )
        console.log('默认选中', deviceListInRoom)
        this.setData(
          {
            spaceId: spaceid,
            selectedSpaceInfo: spaceStore.currentSpaceSelect as Space.allSpace[],
            _isEditCondition: true,
            // sceneDevicelinkSelectList: deviceListInRoom.map((item) => item.uniId),
            opearationType: 'yijian',
          },
          () => {
            // this.updateSceneDeviceActionsFlatten(false)
            this.updateSceneDeviceConditionsFlatten()
          },
        )
        return
      }
    },

    inputAutoSceneName(e: { detail: string }) {
      console.log('changeAutoSceneName', e)

      this.setData({
        sceneName: e.detail || '',
      })

      // this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },
    /* 设置自动化场景图标 start */
    handleEditIconShow() {
      this.setData({
        showEditIconPopup: true,
      })
    },
    /* 选择建议的空间名称 start */
    selectAdviceName(e: { currentTarget: { dataset: { text: string } } }) {
      const name = e.currentTarget.dataset.text
      this.setData({
        sceneName: name,
      })
    },

    handleEditIconClose() {
      this.setData({
        showEditIconPopup: false,
      })
    },
    handleEditIconConfirm(e: { detail: string }) {
      console.log(e)
      this.setData({
        showEditIconPopup: false,
        sceneIcon: e.detail,
      })
    },
    /* 设置自动化场景图标 end */
    /* 设置场景生效时间段 start */
    handleEffectiveTimeShow() {
      this.setData({
        showEffectiveTimePopup: true,
      })
    },
    handleEffectiveTimeClose() {
      this.setData({
        showEffectiveTimePopup: false,
      })
    },
    // 生效时间
    handleEffectiveTimeConfirm(e: {
      detail: { startTime: string; endTime: string; periodType: string; week: string }
    }) {
      const { startTime, endTime, periodType, week } = e.detail
      this.setData({
        _isEditCondition: true,
        showEffectiveTimePopup: false,
        'effectiveTime.startTime': startTime,
        'effectiveTime.endTime': endTime,
        'effectiveTime.timeType': periodType,
        'effectiveTime.timePeriod': week,
      })
    },
    /* 设置场景生效时间段 end */
    /* 设置场景条件弹窗 start */
    handleConditionShow() {
      this.setData({
        showEditConditionPopup: true,
      })
    },
    addMultipleCondition() {
      if (this.data.sceneDeviceConditionsFlatten.length === 1) {
        this.setData({
          showPreConditionPopup: true,
        })
      } else {
        this.setData({
          showEditConditionPopup: true,
        })
      }
    },
    handleConditionClose() {
      this.setData({
        showEditConditionPopup: false,
      })
    },
    handlePreConditionClose() {
      this.setData({
        showPreConditionPopup: false,
      })
    },
    /* 条件弹窗点击回调 */
    onConditionClicked(e: { detail: string }) {
      // 预条件“与”非状态值禁行
      // “与”情况下
      if (this.data.conditionMultiple === 'all') {
        // 非状态值单位占用
        if (
          this.data.linkSelectSensorListMapProductId.includes('midea.freepad.001.201') ||
          this.data.timeConditions.length > 0
        ) {
          if (e.detail === 'time') {
            Toast({ message: '你已设置了其他条件，与此条件冲突', zIndex: 9999 })
            this.setData({
              showEditConditionPopup: false,
            })
            return
          }
        }
      }
      if (e.detail === 'time') {
        this.setData({
          opearationType: 'auto',
          showTimeConditionPopup: true,
          'timeCondition.timeId': '',
          'timeCondition.time': '',
          'timeCondition.timeType': '',
          'timeCondition.timePeriod': '',
        })
      } else if (e.detail === 'touch') {
        if (spaceStore.allSpaceList.length) {
          this.setData({
            opearationType: 'yijian',
            showEditRoomPopup: true,
          })
        } else {
          Toast({ message: '尚未添加空间', zIndex: 9999 })
          return
        }
      } else {
        console.log('当前传感器', this.data.sensorList)
        this.setData({
          opearationType: 'auto',
        })

        if (this.data.sensorList.length) {
          this.addSensorPopup()
        } else {
          Toast({ message: '尚未添加传感器', zIndex: 9999 })
          return
        }
      }
      this.setData({
        showEditConditionPopup: false,
      })
    },
    /* 设置场景条件弹窗 end */
    onPreConditionClicked(e: { detail: string }) {
      this.setData(
        {
          conditionMultiple: e.detail,
          showPreConditionPopup: false,
        },
        () => {
          this.setData({
            showEditConditionPopup: true,
          })
        },
      )
    },
    /* 设置手动场景——空间 */
    handleSceneRoomEditCancel() {
      this.setData({
        showEditRoomPopup: false,
      })
    },
    handleRoomReturn() {
      this.setData({
        showEditRoomPopup: false,
      })
      this.handleConditionShow()
    },
    async handleSceneRoomEditConfirm(e: { detail: Space.allSpace[] }) {
      console.log(e)
      const currentSpaceId = e.detail[e.detail.length - 1].spaceId
      console.log(currentSpaceId)
      const deviceListInRoom: Device.DeviceItem[] = deviceStore.allDeviceFlattenList.filter(
        (item) => item.spaceId === currentSpaceId,
      )
      console.log('默认选中', deviceListInRoom)
      this.setData(
        {
          selectedSpaceInfo: e.detail,
          spaceId: currentSpaceId,
          showEditRoomPopup: false,
          _isEditCondition: true,
          // sceneDevicelinkSelectList: deviceListInRoom.map((item) => item.uniId),
        },
        // () => {
        //   this.updateSceneDeviceActionsFlatten()
        // },
      )
      this.updateSceneDeviceConditionsFlatten()
    },
    /* 设置手动场景——空间 */
    /**
     * 增加传感器做场景条件
     */
    addSensorPopup() {
      this.setData({
        selectCardType: 'sensor',
      })
      this.handleSelectCardShow()
    },
    /* 时间条件 start */
    handleTimeConditionClose() {
      this.setData({
        showTimeConditionPopup: false,
      })
    },
    handleTimeConditionReturn() {
      this.setData({
        showTimeConditionPopup: false,
      })
      this.handleConditionShow()
    },
    // 时间点条件编辑
    handleTimeConditionConfirm(e: { detail: { timeId: string; time: string; periodType: string; week: string } }) {
      console.log('时间点确认', e.detail)
      if (this.data.timeConditionPopupLock) {
        console.log('Lock', this.data.timeConditionPopupLock)
        return
      }
      this.data.timeConditionPopupLock = true
      const { timeId, time, periodType, week } = e.detail
      if (timeId && timeId !== 'default-timeId') {
        // 修改
        const curCondition = this.data.timeConditions.find((item) => item.timeId === e.detail.timeId)
        console.log('找到时间点', curCondition)
        if (curCondition) {
          curCondition.time = e.detail.time
          curCondition.timePeriod = periodType === '4' || periodType === '1' ? week : null
          curCondition.timeType = e.detail.periodType
        }
      } else {
        // 新增
        this.data.timeConditions.push({
          timeId: `time${new Date().getTime().toString()}`,
          time,
          timeType: periodType,
          timePeriod: periodType === '4' || periodType === '1' ? week : null,
        })
      }
      console.log('结算', this.data.timeConditions)
      this.setData(
        {
          timeConditions: [...this.data.timeConditions],
          showTimeConditionPopup: false,
          _isEditCondition: true,
          'timeCondition.time': time,
          'timeCondition.timeType': periodType,
          'timeCondition.timePeriod': week,
          'effectiveTime.startTime': '00:00',
          'effectiveTime.endTime': '23:59',
          'effectiveTime.timeType': '1',
          'effectiveTime.timePeriod': '1,2,3,4,5,6,7',
        },
        () => {
          setTimeout(() => (this.data.timeConditionPopupLock = false), 1000)
        },
      )
      this.updateSceneDeviceConditionsFlatten()
    },
    /* 时间条件 end */
    handleActionShow() {
      if (this.data.opearationType === 'auto') {
        this.setData({
          showEditActionPopup: true,
        })
      } else {
        this.handleSelectCardShow()
      }
    },
    handleActionClose() {
      this.setData({
        showEditActionPopup: false,
      })
    },
    onActionClicked(e: { detail: string }) {
      console.log(e.detail)
      if (e.detail === 'delay') {
        this.setData({
          showDelayPopup: true,
          delay: [0, 0],
        })
      } else if (e.detail === 'scene') {
        if (this.data.sceneList.length) {
          this.setData({
            selectCardType: 'scene',
          })
          this.handleSelectCardShow()
        } else {
          Toast({ message: '暂无可执行场景', zIndex: 9999 })
          return
        }
      } else {
        if (this.data.deviceList.length) {
          this.setData({
            selectCardType: 'device',
          })
          this.handleSelectCardShow()
        } else {
          Toast({ message: '暂无可执行设备', zIndex: 9999 })
          return
        }
      }
      this.setData({
        showEditActionPopup: false,
      })
    },
    /* 延时弹窗 start */
    handleDelayClose() {
      this.setData({
        showDelayPopup: false,
      })
    },
    handleDelayReturn() {
      this.setData({
        showDelayPopup: false,
      })
      this.handleActionShow()
    },
    handleDelayConfirm(e: { detail: number[] }) {
      console.log(e.detail)
      if (!e.detail[0] && !e.detail[1]) {
        if (this.data.editingDelayId) {
          const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.uniId === this.data.editingDelayId)
          this.data.sceneDeviceActionsFlatten.splice(index, 1)
        }
      } else {
        const delaySec = e.detail[0] * 60 + e.detail[1]

        if (this.data.editingDelayId) {
          //更新原来的延时Id
          const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.uniId === this.data.editingDelayId)
          this.setData({
            [`sceneDeviceActionsFlatten[${index}].desc`]: [strUtil.formatTime(delaySec)],
            [`sceneDeviceActionsFlatten[${index}].value`]: { delayTime: delaySec },
          })
        } else {
          //新增一个Id并push到列表后
          this.data.sceneDeviceActionsFlatten.push({
            uniId: new Date().getTime() + 'DLY',
            name: '延时',
            desc: [strUtil.formatTime(delaySec)],
            type: 6,
            pic: '/package-automation/assets/imgs/automation/stopwatch-materialized.png',
            value: { delayTime: delaySec },
            orderNum: 0,
            dragId: new Date().getTime() + 'DLY',
          })
        }
      }
      this.updateSceneDeviceActionsFlatten()
      this.setData({
        editingDelayId: '',
        showDelayPopup: false,
      })
    },
    /* 延时弹窗 end */

    /**
     * 弹出添加场景或设备弹窗
     * @returns
     */
    handleSelectCardShow() {
      // const switchUniId = this.data.checkedList[0]
      // 默认场景不可编辑场景设备数据
      if (this.data.isDefaultYijianScene) {
        console.log('默认场景不可编辑场景设备数据')
        return
      }
      console.log('handleSelectCardShow', this.data.sceneDevicelinkSelectList, this.data.deviceList)
      if (
        this.data.opearationType === 'yijian' &&
        this.data.deviceList.filter((item) => !this.data.sceneDevicelinkSelectList.includes(item.uniId)).length === 0
      ) {
        Toast({ message: '手动点击场景已无设备选择', zIndex: 9999 })
      } else {
        this.setData({
          showSelectCardPopup: true,
        })
      }
    },
    async handleSelectCardSelect(e: { detail: string }) {
      console.log('选择设备', e.detail)
      const selectId = e.detail
      const listType =
        this.data.selectCardType === 'sensor' ? 'tempSensorlinkSelectList' : 'tempSceneDevicelinkSelectedList'
      // 取消选择逻辑
      if (this.data[listType].includes(selectId)) {
        const index = this.data[listType].findIndex((id) => id === selectId)
        console.log('找到取消选择的设备', index)
        this.data[listType].splice(index, 1)
        this.setData({
          [`${listType}`]: [...this.data[listType]],
        })
        return
      }
      if (this.data.selectCardType === 'sensor') {
        const selectedProductId = this.data.sensorList.find((item) => item.deviceId === e.detail)?.productId
        const limitProductId = ['midea.freepad.001.201']
        // 非状态值禁行
        if (
          this.data.conditionMultiple === 'all' &&
          (this.data.timeCondition.time !== '' ||
            this.data.linkSelectSensorListMapProductId.includes('midea.freepad.001.201')) &&
          selectedProductId &&
          limitProductId.includes(selectedProductId)
        ) {
          Toast({ message: '你已设置了其他条件，与此条件冲突', zIndex: 9999 })
          return
        }
        // this.data.sensorlinkSelectList.push({ deviceId: selectId, datetime: new Date().getTime().toString() })
        // this.data.tempSensorlinkSelectList.push(selectId)
        //传感器只单选
        this.setData({
          // sensorlinkSelectList: [...this.data.sensorlinkSelectList],
          tempSensorlinkSelectList: [selectId],
        })
      } else {
        this.setData({
          tempSceneDevicelinkSelectedList: [...this.data['tempSceneDevicelinkSelectedList'], selectId],
        })
      }
    },
    handleSelectAll(e: {
      detail: {
        isSelect: boolean
        roomSelect: string
      }
    }) {
      if (this.data.selectCardType !== 'device') return

      const { isSelect, roomSelect } = e.detail
      console.log('[handleSelectAll]', roomSelect)
      const listType = 'tempSceneDevicelinkSelectedList'
      const list = (this.data.list as Device.DeviceItem[])
        .filter((item) => item.spaceId === roomSelect)
        .map((item) => item.uniId)
      if (isSelect) {
        this.setData({
          [`${listType}`]: [...this.data[listType], ...list],
        })
      } else {
        list.forEach((devcieId) => {
          const index = this.data[listType].findIndex((id) => id === devcieId)
          console.log('找到取消选择的设备', index)
          this.data[listType].splice(index, 1)
        })
        this.setData({
          [`${listType}`]: [...this.data[listType]],
        })
      }
    },
    handleSelectCardClose() {
      this.setData({
        showSelectCardPopup: false,
      })
    },
    handleSelectCardReturn(e: { detail: string[] }) {
      if (this.data.selectCardType === 'sensor') {
        this.handleConditionShow()
      }
      // 设备找一找
      else if (this.data.selectCardType === 'device') {
        console.log('handleSelectCardReturn', e)
        const allDeviceMap = deviceStore.allDeviceFlattenMap
        const device = allDeviceMap[e.detail[0]]
        const modelName = 'light'
        findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })
      } else {
        this.setData({
          showSelectCardPopup: false,
        })
      }
      // 是否还有其他情况？
      // else {
      //   this.handleActionShow()
      // }
    },
    // 设备选择确认
    async handleSelectCardConfirm() {
      console.log('handleSelectCardConfirm', this.data.selectCardType, this.data.tempSceneDevicelinkSelectedList)
      // console.log('handleSelectCardConfirm', e)
      this.setData({
        sensorlinkSelectList: [
          ...this.data['sensorlinkSelectList'],
          ...this.data['tempSensorlinkSelectList'].map((item) => {
            return { deviceId: item, datetime: new Date().getTime().toString() }
          }),
        ],
      })
      this.setData({
        tempSensorlinkSelectList: [],
        showSelectCardPopup: false,
      })
      if (this.data.selectCardType === 'sensor') {
        this.updateSceneDeviceConditionsFlatten()
        this.setData({
          _isEditCondition: true,
        })
      } else {
        this.setData(
          {
            sceneDevicelinkSelectList: [
              ...this.data['sceneDevicelinkSelectList'],
              ...this.data['tempSceneDevicelinkSelectedList'],
            ],
          },
          () => {
            this.updateSceneDeviceActionsFlatten()
            this.setData({
              tempSceneDevicelinkSelectedList: [],
            })
          },
        )
      }
    },
    handleActionDelete(e: { detail: string }) {
      const dragId = e.detail

      const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.dragId === dragId)
      const deleteId = this.data.sceneDeviceActionsFlatten[index].uniId
      this.data.sceneDeviceActionsFlatten.splice(index, 1)
      const afterSelected = this.data.sceneDevicelinkSelectList.filter((item) => item !== deleteId)
      this.setData(
        {
          sceneDevicelinkSelectList: afterSelected,
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
        },
      )
    },
    updateSceneDeviceActionsFlatten(isEditAction = true) {
      console.log('执行动作表', this.data.sceneDeviceActionsFlatten)
      const tempSceneDeviceActionsFlatten = this.data.sceneDeviceActionsFlatten as AutoScene.AutoSceneFlattenAction[]

      //删除取消选中的设备和场景 //可选多设备改造后无需删除
      // tempSceneDeviceActionsFlatten = tempSceneDeviceActionsFlatten.filter((item) => {
      //   const index = this.data.linkSelectList.findIndex((id) => id === item.uniId)
      //   return index !== -1 || item.type === 6
      // })

      //从后面插入已选中的设备和场景
      console.log('设备列表', this.data.deviceList)
      this.data.sceneDevicelinkSelectList.forEach((id) => {
        if (
          this.data.opearationType === 'yijian' &&
          this.data.sceneDeviceActionsFlatten.map((item) => item.uniId).includes(id)
        ) {
          return
          // 在自动化的时候，找到队列中最后一个相同的设备，看他后面有没有延时，有就不return，没有就依旧return
          // const deviceCondition = (element: AutoScene.AutoSceneFlattenAction) => element.uniId === id;
          // const delayCondition = (element: AutoScene.AutoSceneFlattenAction) => element.type === 6;
          // const lastDeviceIndex = this.data.sceneDeviceActionsFlatten.reduceRight((lastIndex: number, currentElement: AutoScene.AutoSceneFlattenAction, currentIndex: number) => {
          //   if (lastIndex === -1 && deviceCondition(currentElement)) {
          //     return currentIndex
          //   }
          //   return lastIndex
          // }, -1)
          // const lastDelayIndex = this.data.sceneDeviceActionsFlatten.reduceRight((lastIndex: number, currentElement: AutoScene.AutoSceneFlattenAction, currentIndex: number) => {
          //   if (lastIndex === -1 && delayCondition(currentElement)) {
          //     return currentIndex
          //   }
          //   return lastIndex
          // }, -1)
          // if (lastDelayIndex > lastDeviceIndex && this.data.opearationType === 'auto') { } else { return }
        }
        //每次选中的都push到最后
        const device = this.data.deviceList.find((item) => item.uniId === id)
        if (device) {
          //是设备
          console.log('是设备', device)
          let { deviceName } = device
          let name = deviceName
          const isSwitch = device.proType === PRO_TYPE.switch
          if (isSwitch) {
            const { switchName } = device.switchInfoDTOList[0]
            if (switchName.length + deviceName.length > 15) {
              deviceName = deviceName.slice(0, 12 - switchName.length) + '...' + deviceName.slice(-2)
            }
            name = `${switchName}|${deviceName}`
          }
          const modelName = isSwitch ? device.uniId.split(':')[1] : getModelName(device.proType, device.productId)
          const pic = isSwitch ? device.switchInfoDTOList[0].pic : device.pic
          const desc = toPropertyDesc(device, device.property!)

          tempSceneDeviceActionsFlatten.push({
            uniId: device.uniId,
            name,
            type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
            desc,
            pic,
            proType: device.proType,
            productId: device.productId,
            value: {
              modelName,
              ...device.property,
            },
            orderNum: 0,
            dragId: device.uniId + Math.floor(Math.random() * 1001),
          })
        } else {
          const scene = this.data.sceneList.find((item) => item.sceneId === id)
          const space = spaceStore.allSpaceList.find((item) => item.spaceId === scene?.spaceId) as Space.allSpace
          if (scene) {
            //是场景
            console.log('是场景', scene)
            tempSceneDeviceActionsFlatten.push({
              uniId: scene.sceneId,
              name: scene.sceneName,
              type: 5,
              desc: [spaceStore.getSpaceClearName(space)],
              pic: `${this.data.sceneImgDir}/${scene.sceneIcon}.png`,
              value: {},
              orderNum: 0,
              dragId: scene.sceneId + Math.floor(Math.random() * 1001),
            })
          }
        }
      })

      //增加排序顺序字段
      const sceneDeviceActionsFlatten = tempSceneDeviceActionsFlatten.map((item, index) => {
        return { ...item, orderNum: index }
      })
      this.setData({
        sceneDeviceActionsFlatten,
        _isEditAction: isEditAction,
        sceneDevicelinkSelectList: this.data.opearationType === 'auto' ? [] : this.data.sceneDevicelinkSelectList,
        tempSceneDevicelinkSelectedList:
          this.data.opearationType === 'auto' ? [] : this.data.tempSceneDevicelinkSelectedList,
      })

      // 防止场景为空，drag为null·
      if (sceneDeviceActionsFlatten.length) {
        const drag = this.selectComponent('#drag')
        drag.init()
      }
    },
    /* 条件方法 start */
    updateSceneDeviceConditionsFlatten() {
      const diffSceneDeviceConditionsFlatten = [] as AutoScene.AutoSceneFlattenCondition[]

      if (this.data.spaceId !== '' && this.data.opearationType === 'yijian') {
        const space = spaceStore.allSpaceList.find((item) => item.spaceId === this.data.spaceId) as Space.allSpace
        const curSceneInfo: AutoScene.AutoSceneFlattenCondition = {
          uniId: 'room',
          name: '手动点击场景',
          desc: [spaceStore.getSpaceClearName(space)],
          pic: '/package-automation/assets/imgs/automation/touch-materialized.png',
          productId: 'touch',
          property: {},
          type: 5,
        }
        const roomConditionIndex = this.data.sceneDeviceConditionsFlatten.findIndex((item) => item.uniId === 'room')
        if (roomConditionIndex !== -1) {
          this.data.sceneDeviceConditionsFlatten[roomConditionIndex] = curSceneInfo
        } else {
          this.data.sceneDeviceConditionsFlatten.push(curSceneInfo)
        }
        this.setData({
          sceneDeviceConditionsFlatten: [...this.data.sceneDeviceConditionsFlatten],
        })
        return
      }

      if (this.data.timeConditions.length > 0) {
        for (let i = 0; i < this.data.timeConditions.length; i++) {
          if (
            !this.data.sceneDeviceConditionsFlatten
              .map((item) => item.uniId)
              .includes(this.data.timeConditions[i].timeId)
          ) {
            diffSceneDeviceConditionsFlatten.push({
              uniId: this.data.timeConditions[i].timeId,
              name: this.data.timeConditions[i].time,
              desc: [
                strUtil.transPeriodDesc(this.data.timeConditions[i].timeType, this.data.timeConditions[i].timePeriod),
              ],
              pic: '/package-automation/assets/imgs/automation/time-materialized.png',
              productId: `time${i}`,
              property: {},
              type: 6,
            })
          } else {
            const curTimeConditionFlattenIndex = this.data.sceneDeviceConditionsFlatten.findIndex(
              (item) => item.uniId === this.data.timeConditions[i].timeId,
            )
            if (curTimeConditionFlattenIndex !== -1) {
              this.data.sceneDeviceConditionsFlatten[curTimeConditionFlattenIndex] = {
                uniId: this.data.timeConditions[i].timeId,
                name: this.data.timeConditions[i].time,
                desc: [
                  strUtil.transPeriodDesc(this.data.timeConditions[i].timeType, this.data.timeConditions[i].timePeriod),
                ],
                pic: '/package-automation/assets/imgs/automation/time-materialized.png',
                productId: `time${i}`,
                property: {},
                type: 6,
              }
            }
          }
        }
      }

      // 已选中的传感器
      console.log('即将diff的传感器列表')
      const sensorSelected = JSON.parse(
        JSON.stringify(
          this.data.sensorlinkSelectList
            .map((id) => {
              return {
                device: this.data.sensorList.find((item) => item.uniId === id.deviceId),
                uniId: `${id.deviceId}${id.datetime}`,
              }
            })
            .filter((item) => item.device !== undefined),
        ),
      ) as { device: Device.DeviceItem; uniId: string }[]

      if (this.data._autosceneInfo && this.data._autosceneInfo.deviceConditions) {
        const deviceConditionsQuchongById = Array.from(
          new Set(this.data._autosceneInfo.deviceConditions.map((item) => item.deviceId)),
        )

        deviceConditionsQuchongById.forEach((deviceQuchongById) => {
          const curIntancesIndexs: number[] = []
          sensorSelected.forEach((selected, index: number) => {
            if (selected.device.deviceId === deviceQuchongById) {
              curIntancesIndexs.push(index)
            }
          })

          const curConditions = this.data._autosceneInfo.deviceConditions.filter(
            (item) => deviceQuchongById === item.deviceId,
          )
          if (curIntancesIndexs.length === curConditions.length) {
            curIntancesIndexs.forEach((instanceIndex, index) => {
              sensorSelected[instanceIndex].device.property = {
                ...curConditions[index].controlEvent[0],
              }
            })
          }
        })
      }

      console.log('已选中的传感器', sensorSelected)

      const sensorSelectedChanged = sensorSelected.filter(
        (item) => !this.data.sceneDeviceConditionsFlatten.map((flatten) => flatten.uniId).includes(item.uniId),
      )

      sensorSelectedChanged.forEach((item) => {
        diffSceneDeviceConditionsFlatten.push({
          uniId: item.uniId,
          name: item.device.deviceName,
          desc: toPropertyDesc(item.device, item.device.property!),
          pic: item.device.pic,
          productId: item.device.productId,
          property: item.device.property!,
          proType: item.device.proType,
          type: item.device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
        })
      })

      this.setData({
        sceneDeviceConditionsFlatten: [
          ...this.data.sceneDeviceConditionsFlatten.concat(diffSceneDeviceConditionsFlatten),
        ],
      })
    },
    // 删除条件
    handleConditionDelete(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        sceneDevicelinkSelectList: [],
      })
      const uniId = e.currentTarget.dataset.info.uniId
      console.log('删除条件', uniId)
      if (this.data.sensorlinkSelectList.map((item) => `${item.deviceId}${item.datetime}`).includes(uniId)) {
        const index = this.data.sensorlinkSelectList.findIndex((id) => `${id.deviceId}${id.datetime}` === uniId)
        console.log('找到传感器列表中', index)
        this.data.sensorlinkSelectList.splice(index, 1)
        this.setData({
          sensorlinkSelectList: [...this.data.sensorlinkSelectList],
        })
      }
      if (uniId.includes('time')) {
        this.setData({
          'timeCondition.time': '',
          'timeCondition.timePeriod': '',
          'timeCondition.timeType': '',
        })
        this.data.timeConditions = this.data.timeConditions.filter(
          (item) => item.timeId !== this.data.sceneDeviceConditionsFlatten[e.currentTarget.dataset.index].uniId,
        )
      }
      this.data.sceneDeviceConditionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        _isEditCondition: true,
        sceneDeviceConditionsFlatten: [...this.data.sceneDeviceConditionsFlatten],
      })
      if (this.data.sceneDeviceConditionsFlatten.length <= 1) {
        this.setData({
          conditionMultiple: '',
        })
      }
      console.log(this.data.sensorlinkSelectList, this.data.sceneDeviceConditionsFlatten)
    },
    /* 条件方法 end */

    /* 传感器条件编辑 start */
    handleEditSensorClose() {
      this.setData({
        showEditSensorPopup: false,
      })
    },
    handleEditSensorConfirm(e: { detail: IAnyObject }) {
      console.log('传感器条件编辑', e.detail, this.data.editingUniId)
      const listEditIndex = this.data.sensorList.findIndex(
        (item) => item.uniId === this.data.editingUniId.slice(0, -13),
      )
      const flattenEditIndex = this.data.sceneDeviceConditionsFlatten.findIndex(
        (item) => item.uniId === this.data.editingUniId,
      )

      const listItem = this.data.sensorList[listEditIndex]

      const conditionItem = this.data.sceneDeviceConditionsFlatten[flattenEditIndex]

      conditionItem.property = {
        ...e.detail,
      }
      conditionItem.desc = toPropertyDesc(listItem, conditionItem.property)
      listItem.property = {
        ...e.detail,
      }
      this.setData({
        _isEditCondition: true,
        showEditSensorPopup: false,
        sceneDeviceConditionsFlatten: [...this.data.sceneDeviceConditionsFlatten],
        sensorList: [...this.data.sensorList],
      })
    },
    /* 传感器条件编辑 end */

    handleAutoSceneConditionEdit(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset
      const action = this.data.sceneDeviceConditionsFlatten[index]

      console.log('当前编辑condition', this.data.sceneDeviceConditionsFlatten, action)

      if (action.productId.includes('time')) {
        const curTimeCondition = this.data.timeConditions.find((item) => item.timeId === action.uniId)
        this.setData({
          'timeCondition.timeId': curTimeCondition?.timeId,
          'timeCondition.time': curTimeCondition?.time,
          'timeCondition.timePeriod': curTimeCondition?.timePeriod,
          'timeCondition.timeType': curTimeCondition?.timeType,
          showTimeConditionPopup: true,
        })
      } else if (action.productId === 'touch') {
        if (this.data.isDefaultYijianScene) {
          // 默认情景不能换空间
          return
        }
        this.setData({
          showEditRoomPopup: true,
        })
      } else {
        this.setData({
          editingSensorType: action.productId,
          editingSensorAbility: action.desc,
          editingSensorProperty: action.property,
          editingUniId: action.uniId,
          showEditSensorPopup: true,
        })
      }
    },

    /**
     * 编辑场景延时/设备动作结果
     * @param e
     * @returns
     */
    handleAutoSceneActionEdit(e: { detail: number }) {
      // 默认场景不可编辑场景设备数据
      if (this.data.isDefaultYijianScene) {
        return
      }
      const index = e.detail
      const action = this.data.sceneDeviceActionsFlatten[index]
      console.log('handleAutoSceneActionEdit', action)
      if (action.type === 6) {
        const delay = [0, 0] as number[]
        delay[0] = Math.trunc(action.value.delayTime / 60)
        delay[1] = Math.trunc(action.value.delayTime % 60)
        this.setData({
          delay,
          editingDelayId: action.uniId,
          showDelayPopup: true,
        })
      } else if (action.type === 5) {
        return
      } else {
        const allDeviceMap = deviceStore.allDeviceFlattenMap
        const device = allDeviceMap[action.uniId]
        console.log('device', device)
        // let modelName = 'light'

        // if (action.proType === PRO_TYPE.switch) {
        //   modelName = String(device.switchInfoDTOList[0].switchId)
        // }

        // device.deviceType === 2 && findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })

        this.setData({
          sceneEditTitle: action.name,
          sceneEditInfo: {
            ...action.value,
            deviceType: device.deviceType,
            gatewayId: device.gatewayId,
            deviceId: device.deviceId,
          },
          showEditPopup: device.proType,
          editingUniId: action.dragId,
        })
      }
    },
    /* 编辑设备动作弹窗 start */
    handleEditPopupClose() {
      this.setData({
        showEditPopup: '',
      })
    },
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      const { _cacheDeviceMap } = this.data
      const flattenEditIndex = this.data.sceneDeviceActionsFlatten.findIndex(
        (item) => item.dragId === this.data.editingUniId,
      )
      const actionItem = this.data.sceneDeviceActionsFlatten[flattenEditIndex]
      const listEditIndex = this.data.deviceList.findIndex((item) => item.uniId === actionItem.uniId)
      const listItem = this.data.deviceList[listEditIndex]
      const device = deviceStore.allDeviceFlattenMap[actionItem.uniId]

      if (!_cacheDeviceMap[actionItem.uniId]) {
        let oldProperty = {
          ...device.property,
        }

        delete oldProperty.minColorTemp
        delete oldProperty.maxColorTemp

        if (oldProperty.proType === PRO_TYPE.curtain) {
          const posAttrName = device.deviceType === 2 ? 'level' : 'curtain_position'
          oldProperty = { [posAttrName]: oldProperty[posAttrName] }
        }

        _cacheDeviceMap[actionItem.uniId] = {
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
          proType: device.proType,
          deviceType: device.deviceType,
          modelName: actionItem.value?.modelName,
          property: oldProperty,
        }
      }
      listItem.property = {
        ...listItem.property,
        ...e.detail,
      }

      actionItem.value = {
        ...actionItem.value,
        ...e.detail,
      }

      actionItem.desc = toPropertyDesc(listItem, actionItem.value)

      console.log('actionItem', actionItem)

      this.setData(
        {
          sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
          deviceList: [...this.data.deviceList],
          showEditPopup: '',
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
        },
      )
    },
    async updateYijianScene() {
      if (this.data.sceneDeviceActionsFlatten.length === 0) {
        // 删完actions按照删除场景处理
        Dialog.confirm({
          title: '清空操作将会删除场景，确定删除该场景？',
        }).then(async () => {
          const res = await deleteScene(this.data._sceneInfo.sceneId)
          if (res.success) {
            emitter.emit('sceneEdit')
            projectStore.updateSpaceCardList()
            wx.navigateBack()
          } else {
            Toast({ message: '删除失败', zIndex: 9999 })
          }
        })
        this.data._isSaving = false
        return
      }

      // 准备好数据内存
      const data = {
        sceneId: this.data._sceneInfo.sceneId,
        updateType: '0',
        conditionType: this.data.conditionMultiple === 'all' ? '1' : '0',
        spaceId: this.data.spaceId,
      } as Scene.UpdateSceneDto
      // 检查场景名字是否变更
      if (this.data.sceneName !== this.data._sceneInfo.sceneName) {
        data.sceneName = this.data.sceneName
      }
      // 检查场景icon是否变更
      if (this.data.sceneIcon !== this.data._sceneInfo.sceneIcon) {
        data.sceneIcon = this.data.sceneIcon
      }

      if (this.data._isEditAction) {
        data.deviceActions = []
        data.updateType = data.updateType === '0' ? '1' : data.updateType === '2' ? '4' : '5'

        // 场景动作数据统一在scene-request-list页面处理
        storage.set('scene_data', data)
        storage.set('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)

        // 需要更新结果的情况，需要跳转页面等待上报结果
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-automation/scene-request-list-yijian/index', {
            sceneId: data.sceneId,
          }),
        })
        this.data._isSaving = false
        return
      }
      // TODO: 修改update接口新增参数
      const res = await updateScene(data)
      if (res.success) {
        emitter.emit('sceneEdit')
        projectStore.updateSpaceCardList()
        Toast({ message: '修改成功', zIndex: 9999 })
        wx.navigateBack()
      } else {
        Toast({ message: '修改失败', zIndex: 9999 })
        this.data._isSaving = false
      }
    },

    canonical(object: { [x: string]: any }) {
      const ordered: { [x: string]: any } = {}
      Object.keys(object)
        .sort()
        .forEach(function (key) {
          ordered[key] = object[key]
        })
      return ordered
    },

    async handleSave() {
      if (this.data._isSaving) return
      this.data._isSaving = true

      if (this.data.opearationType === 'yijian' && this.data.yijianSceneId) {
        this.updateYijianScene()
        return
      }
      if (this.data.opearationType === 'yijian') {
        this.go2dispatch()
        return
      }
      // 判断是否有非法重复的动作
      // 在自动化的时候，找到队列中最后一个相同的设备，看他后面有没有延时，有就不return，没有就依旧return
      const condition = (element: AutoScene.AutoSceneFlattenAction) => element.type === 6
      // 按延时分段
      const segmentedArray = this.data.sceneDeviceActionsFlatten.reduce(
        (result: Array<Array<AutoScene.AutoSceneFlattenAction>>, obj) => {
          const lastSegment = result[result.length - 1]
          if (condition(obj)) {
            result.push([])
          } else {
            lastSegment.push(obj)
          }
          return result
        },
        [[]],
      )
      console.log('分段结果', segmentedArray)
      let isToast = false
      // 检查分段中是否存在相同的设备
      segmentedArray.forEach((item) => {
        const actionIds = item.map((item) => item.uniId)
        const quchongSet = new Set(actionIds)
        const quchongIds = Array.from(quchongSet)
        console.log(actionIds, quchongIds)
        if (quchongIds.length !== actionIds.length) {
          console.log('弹出警告')
          isToast = true
        }
      })

      if (isToast) {
        this.setData(
          {
            dialogConfirmBtnColor: '#7cd06a',
          },
          () => {
            Dialog.confirm({
              title: '创建失败',
              message: '同一时间段内，同一设备或场景不能重复选择。请增加延时或删除设备/场景。',
              showCancelButton: false,
              confirmButtonText: '我知道了',
              zIndex: 9999,
            }).then(() => {
              this.setData({
                dialogConfirmBtnColor: '#27282A',
              })
            })
          },
        )
        this.data._isSaving = false

        return
      }

      if (
        this.data.autoSceneId &&
        (this.data.sceneDeviceActionsLength === 0 || this.data.sceneDeviceConditionsFlatten.length === 0)
      ) {
        // 删完actions或conditions按照删除场景处理

        const res = await Dialog.confirm({
          title: '清空条件或动作将会删除场景，是否确定？',
          confirmButtonText: '确定',
          zIndex: 9999,
        }).catch(() => 'cancel')

        console.log('delAutoScene', res)

        if (res === 'cancel') {
          this.data._isSaving = false
          return
        }

        const delRes = await deleteScene(this.data.autoSceneId)
        if (delRes.success) {
          await autosceneStore.updateAllRoomAutoSceneList()
          wx.navigateBack()
        } else {
          Toast({ message: '删除失败', zIndex: 9999 })
        }
        this.data._isSaving = false
        return
      }
      if (!this.data.sceneName) {
        Toast({
          message: '场景名不能为空',
          zIndex: 99999,
        })
        this.data._isSaving = false

        return
      }
      if (checkInputNameIllegal(this.data.sceneName)) {
        Toast({
          message: '场景名称不能用特殊符号或表情',
          zIndex: 99999,
        })
        this.data._isSaving = false

        return
      }
      if (this.data.sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        this.data._isSaving = false

        return
      }

      const newSceneData = {
        conditionType: this.data.conditionMultiple === 'all' ? '1' : '0',
        deviceActions: [],
        deviceConditions: [],
        timeConditions: [],
        effectiveTime: {
          startTime: this.data.effectiveTime.startTime + ':00',
          endTime: this.data.effectiveTime.endTime + ':59',
          timeType: this.data.effectiveTime.timeType === '4' ? '1' : this.data.effectiveTime.timeType, //前端用4表示自定义 1表示每天，云端全用1
          timePeriod: this.data.effectiveTime.timePeriod,
        },
        projectId: projectStore.currentProjectDetail.projectId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneCategory: '1',
        sceneType: '1',
      } as AutoScene.AddAutoSceneDto
      if (this.data.timeConditions.length) {
        newSceneData.timeConditions = this.data.timeConditions.map((item) => {
          return {
            time: item.time,
            timeType: item.timeType === '4' ? '1' : item.timeType,
            timePeriod: item.timePeriod,
          }
        })
      }

      if (this.data.autoSceneId) {
        //是要准备更新场景
        let _isEditIconOrName = false
        if (
          this.data.sceneIcon !== this.data._autosceneInfo.sceneIcon ||
          this.data.sceneName !== this.data._autosceneInfo.sceneName
        ) {
          _isEditIconOrName = true
        }

        if (!_isEditIconOrName && !this.data._isEditAction && !this.data._isEditCondition) {
          //全都没更改过则直接返回
          this.data._isSaving = false
          wx.navigateBack()
          return
        }
        //更新场景
        newSceneData.updateType = '0' //0-只更新名称，icon 1-更新结果  6-更新条件 7-更新条件与更新结果
        newSceneData.sceneId = this.data.autoSceneId
        if (this.data._isEditAction && !this.data._isEditCondition) {
          newSceneData.updateType = '1'
        } else if (!this.data._isEditAction && this.data._isEditCondition) {
          newSceneData.updateType = '6'
        } else if (this.data._isEditAction && this.data._isEditCondition) {
          newSceneData.updateType = '7'
        }
      }

      console.log('newSceneData保存', newSceneData)
      console.log('sceneDeviceActionsFlatten保存', this.data.sceneDeviceActionsFlatten)
      console.log('sceneDeviceConditionsFlatten保存', this.data.sceneDeviceConditionsFlatten)

      // storage.set('autoscene_data', newSceneData)
      // storage.set('autosceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)
      // storage.set('autosceneDeviceConditionsFlatten', this.data.sceneDeviceConditionsFlatten)

      // wx.navigateTo({
      //   url: '/package-automation/automation-request-list/index',
      // })

      // 处理发送请求的deviceActions字段数据
      const deviceMap = deviceStore.allDeviceMap
      this.data.sceneDeviceActionsFlatten.forEach((action) => {
        if (action.uniId.indexOf('DLY') !== -1) {
          newSceneData.deviceActions.push({
            controlAction: [],
            delayTime: action.value.delayTime,
            deviceId: action.uniId,
            deviceType: action.type,
            orderNum: action.orderNum,
          })
        } else {
          const device = deviceMap[action.uniId] || deviceMap[action.uniId.split(':')[0]]
          if (device) {
            //是设备
            if (action.proType === PRO_TYPE.switch) {
              //是开关面板
              const deviceId = action.uniId.split(':')[0]
              newSceneData?.deviceActions?.push({
                controlAction: [{ modelName: action.value.modelName, power: action.value.power }],
                deviceId,
                deviceType: action.type,
                proType: action.proType,
                orderNum: action.orderNum,
              })
            } else {
              const property = action.value
              const ctrlAction = {} as IAnyObject

              if (device.deviceType === 2) {
                ctrlAction.modelName = getModelName(device.proType)
              }

              if (device.proType === PRO_TYPE.light) {
                ctrlAction.power = property.power

                if (property.power === 1) {
                  ctrlAction.colorTemperature = property.colorTemperature
                  ctrlAction.brightness = property.brightness
                }

                // if (device.deviceType === 3) {
                //   ctrlAction = toWifiProperty(device.proType, ctrlAction)
                // }
              } else if (device.proType === PRO_TYPE.curtain) {
                const posAttrName = device.deviceType === 2 ? 'level' : 'curtain_position'
                ctrlAction[posAttrName] = property[posAttrName]
              } else if (device.proType === PRO_TYPE.bathHeat) {
                ctrlAction.light_mode = property.light_mode
                ctrlAction.heating_temperature = property.heating_temperature
                ctrlAction.mode = property.mode
              } else if (device.proType === PRO_TYPE.clothesDryingRack) {
                ctrlAction.updown = property.updown
                ctrlAction.laundry = property.laundry
                ctrlAction.light = property.light
              }
              newSceneData.deviceActions.push({
                controlAction: [ctrlAction],
                deviceId: action.uniId,
                deviceType: device.deviceType,
                proType: device.proType,
                orderNum: action.orderNum,
              })
            }
          } else {
            //场景
            newSceneData.deviceActions.push({
              controlAction: [],
              deviceId: action.uniId,
              deviceType: action.type,
              orderNum: action.orderNum,
            })
          }
        }
      })

      // 去重需要: 准备可对比list
      const canCompareList: AutoScene.DeviceCondition[] = []

      //处理发送请求的deviceConditions字段数据
      this.data.sceneDeviceConditionsFlatten.forEach((action) => {
        const device = deviceMap[action.uniId.slice(0, -13)]
        if (device) {
          canCompareList.push({
            controlEvent: [{ ...(action.property as { modelName: string }) }],
            deviceId: action.uniId,
          })
          newSceneData?.deviceConditions?.push({
            controlEvent: [{ ...(action.property as { modelName: string }) }],
            deviceId: action.uniId.slice(0, -13),
          })
        }
      })

      // 校验：条件去重

      console.log('条件去重', newSceneData.timeConditions, canCompareList)
      const timeConditionsStrList = newSceneData.timeConditions.map((item) => JSON.stringify(item))
      const deviceConditionsStrList = canCompareList.map((item) => {
        return JSON.stringify({
          controlEvent: [this.canonical(item.controlEvent[0])],
          deviceId: item.deviceId.slice(0, -13),
        })
      })
      // 用于存储已经遇到的元素
      const timeConditionsSeen = new Set()
      // 用于存储重复的元素
      const timeConditionsDuplicates = new Set()
      // 用于存储已经遇到的元素
      const deviceConditionsSeen = new Set()
      // 用于存储重复的元素
      const deviceConditionsDuplicates = new Set()

      timeConditionsStrList.forEach((item) => {
        if (timeConditionsSeen.has(item)) {
          timeConditionsDuplicates.add(item)
        } else {
          timeConditionsSeen.add(item)
        }
      })

      deviceConditionsStrList.forEach((item) => {
        if (deviceConditionsSeen.has(item)) {
          deviceConditionsDuplicates.add(item)
        } else {
          deviceConditionsSeen.add(item)
        }
      })
      const iqueTimeStrings = Array.from(timeConditionsDuplicates) as string[]
      const iqueDeviceStrings = Array.from(deviceConditionsDuplicates) as string[]
      console.log('去重鉴定', iqueDeviceStrings.length, iqueTimeStrings.length)
      if (iqueTimeStrings.length || iqueDeviceStrings.length) {
        const res = await Dialog.confirm({
          title: '发现有相同的场景触发条件',
          cancelButtonText: '手动处理',
          confirmButtonText: '自动删除',
          zIndex: 9999,
        }).catch(() => 'cancel')
        if (res === 'cancel') {
          this.data._isSaving = false
          return
        }
        iqueTimeStrings.forEach((item) => {
          // 转回对象
          const obj = JSON.parse(item)
          const sameCount = this.data.timeConditions.filter(
            (item) => item.time === obj.time && item.timePeriod === obj.timePeriod && item.timeType === obj.timeType,
          )
          for (let k = 0; k < sameCount.length - 1; k++) {
            const back = this.data.timeConditions.find(
              (item) => item.time === obj.time && item.timePeriod === obj.timePeriod && item.timeType === obj.timeType,
            )
            const index = this.data.timeConditions.findIndex(
              (item) => item.time === obj.time && item.timePeriod === obj.timePeriod && item.timeType === obj.timeType,
            )
            if (index !== -1) this.data.timeConditions.splice(index, 1)
            const flattenIndex = this.data.sceneDeviceConditionsFlatten.findIndex(
              (item) => `${item.uniId}` === back?.timeId,
            )
            if (flattenIndex !== -1) {
              this.data.sceneDeviceConditionsFlatten.splice(flattenIndex, 1)
            }
            this.setData({
              sceneDeviceConditionsFlatten: this.data.sceneDeviceConditionsFlatten,
            })
          }
        })

        iqueDeviceStrings.forEach((item) => {
          // 转回对象
          const obj = JSON.parse(item)
          const sameCount = this.data.timeConditions.filter(
            (item) => item.time === obj.time && item.timePeriod === obj.timePeriod && item.timeType === obj.timeType,
          )
          for (let k = 0; k < sameCount.length - 1; k++) {
            const back = canCompareList.find(
              (item) =>
                `${item.deviceId.slice(0, -13)}` === obj.deviceId &&
                JSON.stringify(this.canonical(item.controlEvent[0])) ===
                  JSON.stringify(this.canonical(obj.controlEvent[0])),
            )
            console.log('已选传感器删除', this.data.sensorlinkSelectList, back)
            const index = this.data.sensorlinkSelectList.findIndex(
              (item) => `${item.deviceId}${item.datetime}` === back?.deviceId,
            )
            if (index !== -1) {
              this.data.sensorlinkSelectList.splice(index, 1)
            }
            const flattenIndex = this.data.sceneDeviceConditionsFlatten.findIndex(
              (item) => `${item.uniId}` === back?.deviceId,
            )
            if (flattenIndex !== -1) {
              this.data.sceneDeviceConditionsFlatten.splice(flattenIndex, 1)
            }
            this.setData({
              sceneDeviceConditionsFlatten: this.data.sceneDeviceConditionsFlatten,
            })
          }
        })

        this.updateSceneDeviceConditionsFlatten()
        this.data._isSaving = false
        return
      }

      console.log('创建更新自动化', newSceneData)
      // return
      // TODO: 修改update和add接口新增参数
      const promise = this.data.autoSceneId
        ? updateScene(newSceneData as AutoScene.AddAutoSceneDto)
        : addScene(newSceneData as AutoScene.AddAutoSceneDto)

      const res = await promise
      if (!res.success) {
        this.data._isSaving = false
        Toast({
          message: this.data.autoSceneId ? '更新失败' : '创建失败',
        })
      } else {
        autosceneStore.updateAllRoomAutoSceneList()
        Toast({
          message: this.data.autoSceneId ? '更新成功' : '创建成功',
          onClose: () => {
            wx.navigateBack()
          },
        })
      }
    },
    async go2dispatch() {
      // 检查场景名是否合法
      if (!this.data.sceneName) {
        Toast({
          message: '场景名不能为空',
          zIndex: 99999,
        })
        this.data._isSaving = false
        return
      }
      if (checkInputNameIllegal(this.data.sceneName)) {
        Toast({
          message: '场景名称不能用特殊符号或表情',
          zIndex: 99999,
        })
        this.data._isSaving = false
        return
      }
      if (this.data.sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        this.data._isSaving = false
        return
      }
      // 场景动作数据统一在scene-request-list页面处理

      const newSceneData = {
        conditionType: this.data.conditionMultiple === 'all' ? '1' : '0',
        deviceActions: [],
        deviceConditions: [],
        projectId: projectStore.currentProjectDetail.projectId,
        spaceId: this.data.spaceId === '' ? spaceStore.currentSpace.spaceId : this.data.spaceId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneType: '0',
        orderNum: 0,
      } as Scene.AddSceneDto

      const currentSpaceId = this.data.selectedSpaceInfo.reduce((acc, cur) => {
        if (cur.spaceLevel > acc.spaceLevel) {
          return cur
        } else {
          return acc
        }
      }).spaceId

      // 将新场景排到最后,orderNum可能存在跳号的情况
      sceneStore.allRoomSceneList
        .filter((item) => item.spaceId === currentSpaceId && item.sceneCategory === '0')
        .forEach((scene) => {
          if (scene.orderNum && scene.orderNum >= newSceneData.orderNum) {
            newSceneData.orderNum = scene.orderNum + 1
          }
        })

      storage.set('scene_data', newSceneData)
      storage.set('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)

      wx.navigateTo({
        url: '/package-automation/scene-request-list-yijian/index',
      })
      this.data._isSaving = false
    },
    async handleAutoSceneDelete() {
      if (this.data.autoSceneId) {
        const res = await Dialog.confirm({
          title: '确定删除该自动化？',
          zIndex: 9999,
        }).catch(() => 'cancel')

        console.log('delAutoScene', res)

        if (res === 'cancel') return

        const delRes = await deleteScene(this.data.autoSceneId)
        if (delRes.success) {
          await autosceneStore.updateAllRoomAutoSceneList()
          wx.navigateBack()
        } else {
          Toast({ message: '删除失败', zIndex: 9999 })
        }
      }
      if (this.data.yijianSceneId) {
        const res = await Dialog.confirm({
          title: this.data.isDefaultYijianScene ? '默认场景删除后不可恢复，确定删除该默认场景？' : '确定删除该场景？',
          zIndex: 9999,
        }).catch(() => 'cancel')

        console.log('delAutoScene', res)

        if (res === 'cancel') return

        const delRes = await deleteScene(this.data._sceneInfo.sceneId)
        if (delRes.success) {
          emitter.emit('sceneEdit')
          projectStore.updateSpaceCardList()
          wx.navigateBack()
        } else {
          Toast({ message: '删除失败', zIndex: 9999 })
        }
      }
    },
    /* 执行结果拖拽相关方法 start */
    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },
    // handleScroll(e) {
    //   wx.pageScrollTo({
    //     scrollTop: e.detail.scrollTop,
    //     duration: 300,
    //   })
    // },
    async handleSortEnd(e: { detail: { listData: AutoScene.AutoSceneFlattenAction[] } }) {
      e.detail.listData.forEach((item, index) => {
        if (item.orderNum != index) {
          item.orderNum = index
        }
      })
      this.setData({
        _isEditAction: true,
        sceneDeviceActionsFlatten: e.detail.listData,
      })
      // 防止场景为空，drag为null·
      if (e.detail.listData.length) {
        const drag = this.selectComponent('#drag')
        drag.init()
      }
    },

    // 试一试
    haveATry() {
      let flag = true // forEach中await不会堵塞控制，设置专门的标识

      this.data.sceneDeviceActionsFlatten?.forEach(async (d) => {
        // 设备
        if (d.proType) {
          const deviceId = d.uniId.split(':')[0]
          const device = deviceStore.allDeviceFlattenMap[d.uniId]
          const property = JSON.parse(JSON.stringify(d.value))

          // 去掉多余的属性
          delete property.OnOff
          delete property.colorTempRange
          if (device.proType === PRO_TYPE.curtain) {
            delete property.power
          }

          const res = await sendDevice({
            deviceId,
            gatewayId: device.gatewayId,
            deviceType: device.deviceType,
            proType: d.proType ?? '',
            modelName: d.value.modelName,
            property,
          })

          if (!res.success) {
            flag = false
          }
        }
        // 场景
        else {
          const res = await execScene(d.uniId)
          if (!res.success) {
            flag = false
          }
        }
      })

      if (!flag) {
        Toast(this.data.sceneDeviceActionsFlatten.length > 1 ? '部分项目控制失败' : '控制失败')
      }
    },
  },
})
