import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { deleteScene, findDevice, updateScene } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore, sceneStore, homeStore, roomStore } from '../../store/index'
import { PRO_TYPE, SENSOR_TYPE, getModelName, sceneImgDir } from '../../config/index'
import {
  toPropertyDesc,
  storage,
  getCurrentPageParams,
  strUtil,
  checkInputNameIllegal,
  emitter,
} from '../../utils/index'
import { adviceSceneNameList } from '../../config/scene'
import { roomBinding } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior, BehaviorWithStore({ storeBindings: [roomBinding] })],

  /**
   * 组件的初始数据
   */
  data: {
    sceneImgDir,
    roomId: '',
    showEditRoomPopup: false,
    adviceSceneNameList: adviceSceneNameList,
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    _sceneInfo: {} as Scene.SceneItem,
    yijianSceneId: '',
    sceneIcon: 'icon-1',
    sceneName: '',
    //场景的生效时间段
    effectiveTime: {
      timePeriod: '1,2,3,4,5,6,7', //周日-周六
      timeType: '1', //时间类型，0-仅一次，1-自定义，2-法定工作日，3-法定节假日
      startTime: '00:00',
      endTime: '23:59',
    },
    isDefault: false,
    // contentHeight: 0,
    showEditIconPopup: false, //展示编辑场景图标popup
    showEditConditionPopup: false, //展示添加条件popup
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
    sensorlinkSelectList: [] as string[],
    selectCardType: 'device', //设备卡片：'device'  场景卡片： 'scene'  传感器卡片：'sensor'
    showSelectCardPopup: false,
    /** 将当前场景里多路的action拍扁 */
    sceneDeviceActionsFlatten: [] as Device.ActionItem[],
    /** 将当前场景里多路的Condition拍扁 */
    sceneDeviceConditionsFlatten: [] as AutoScene.AutoSceneFlattenCondition[],
    //延时
    delay: [0, 0],
    //时间条件
    timeCondition: {
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
    cardType(data) {
      return data.selectCardType === 'device' || data.selectCardType === 'sensor' ? 'device' : 'scene'
    },

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
    // linkSelectList(data) {
    //   // if (data.selectCardType === 'sensor') {
    //   //   return data.sensorlinkSelectList
    //   // } else {
    //   //   return data.sceneDevicelinkSelectList
    //   // }
    //   console.log(data.sceneDevicelinkSelectList)
    //   return data.sceneDevicelinkSelectList
    // },
    //只包含场景和设备的动作列表长度
    sceneDeviceActionsLength(data) {
      return data.sceneDeviceActionsFlatten.filter((item) => item.uniId.indexOf('DLY') === -1).length
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
    handleRoomReturn() {
      this.setData({
        showEditRoomPopup: false,
      })
      // this.handleConditionShow()
    },
    async onLoad() {
      const { yijianSceneId } = getCurrentPageParams()

      this.setData({ yijianSceneId: yijianSceneId })

      //处理三个传感器、场景和设备列表
      await Promise.all([
        sceneStore.updateAllRoomSceneList(),
        deviceStore.updateAllRoomDeviceList(), //deviceStore.updateSubDeviceList(), //
      ])
      const sensorList = deviceStore.allRoomDeviceFlattenList.filter((item) => item.proType === PRO_TYPE.sensor)
      sensorList.forEach((item) => {
        if (item.productId === SENSOR_TYPE.humanSensor) {
          item.property = { occupancy: 1, modelName: 'irDetector' }
        } else if (item.productId === SENSOR_TYPE.doorsensor) {
          item.property = { doorStatus: 1, modelName: 'magnet' }
        } else {
          item.property = { buttonClicked: 1, modelName: 'freepad' }
        }
      })
      this.setData({
        sceneList: [...sceneStore.allRoomSceneList],
        deviceList: deviceStore.allRoomDeviceFlattenList.filter(
          (item) => item.proType !== PRO_TYPE.gateway && item.proType !== PRO_TYPE.sensor,
        ),
        sensorList,
      })

      if (yijianSceneId) {
        const sensorlinkSelectList = [] as string[]

        // 获取当前scene
        const sceneInfo = sceneStore.allRoomSceneList.find((item) => item.sceneId === yijianSceneId) as Scene.SceneItem
        console.log('当前场景', sceneInfo)
        this.data._sceneInfo = sceneInfo
        this.setData({
          sceneIcon: sceneInfo.sceneIcon,
          sceneName: sceneInfo.sceneName,
          roomId: sceneInfo.roomId,
          isDefault: sceneInfo.isDefault === '1',
        })

        this.updateSceneDeviceConditionsFlatten()

        //处理执行结果
        const tempSceneDeviceActionsFlatten = [] as Device.ActionItem[]
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
                  const desc = toPropertyDesc(device.proType, action.controlAction[switchIndex])
                  tempSceneDevicelinkSelectList.push(device.uniId)
                  tempSceneDeviceActionsFlatten.push({
                    uniId: device.uniId,
                    name: `${device.switchInfoDTOList[0].switchName} | ${device.deviceName}`,
                    deviceType: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                    desc,
                    pic: device.switchInfoDTOList[0].pic,
                    proType: PRO_TYPE.switch,
                    value: {
                      modelName: action.controlAction[switchIndex].modelName,
                      power,
                    },
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
              // const modelName = getModelName(device.proType, device.productId)
              const property = {
                // ...device.mzgdPropertyDTOList[modelName],
                ...action.controlAction[0],
              }
              const desc = toPropertyDesc(device.proType, property)
              tempSceneDevicelinkSelectList.push(device.uniId)
              tempSceneDeviceActionsFlatten.push({
                uniId: device.uniId,
                name: device.deviceName,
                deviceType: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                desc,
                pic: device.pic as string,
                proType: device.proType,
                value: {
                  ...property,
                  modelName: getModelName(device.proType, device.productId),
                },
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
            sensorlinkSelectList,
            sceneDevicelinkSelectList: tempSceneDevicelinkSelectList,
            sceneDeviceActionsFlatten: tempSceneDeviceActionsFlatten,
          },
          () => {
            console.log('初始化已选择列表', this.data.sceneDevicelinkSelectList, this.data.sceneDeviceActionsFlatten)
            this.updateSceneDeviceActionsFlatten()
            this.updateSceneDeviceConditionsFlatten()
          },
        )
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
    handleConditionClose() {
      this.setData({
        showEditConditionPopup: false,
      })
    },
    onConditionClicked(e: { detail: string }) {
      if (e.detail === 'time') {
        this.setData({
          showTimeConditionPopup: true,
        })
      } else if (e.detail === 'touch') {
        this.setData({
          showEditRoomPopup: true,
        })
      } else {
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
    handleTimeConditionConfirm(e: { detail: { time: string; periodType: string; week: string } }) {
      const { time, periodType, week } = e.detail
      this.setData({
        showTimeConditionPopup: false,
        _isEditCondition: true,
        'timeCondition.time': time,
        'timeCondition.timeType': periodType,
        'timeCondition.timePeriod': week,
        'effectiveTime.startTime': '00:00',
        'effectiveTime.endTime': '23:59',
        'effectiveTime.timeType': '1',
        'effectiveTime.timePeriod': '1,2,3,4,5,6,7',
      })
      this.updateSceneDeviceConditionsFlatten()
    },
    /* 时间条件 end */
    handleActionShow() {
      // this.setData({
      //   showEditActionPopup: true,
      // })
      this.onActionClicked()
    },
    handleActionClose() {
      this.setData({
        showEditActionPopup: false,
      })
    },
    onActionClicked() {
      console.log('点击加号')
      if (this.data.deviceList.length) {
        this.setData({
          selectCardType: 'device',
        })
        this.handleSelectCardShow()
      } else {
        Toast({ message: '暂无可执行设备', zIndex: 9999 })
        return
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
        // const delaySec = e.detail[0] * 60 + e.detail[1]
        //   if (this.data.editingDelayId) {
        //     //更新原来的延时Id
        //     const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.uniId === this.data.editingDelayId)
        //     this.setData({
        //       [`sceneDeviceActionsFlatten[${index}].desc`]: [strUtil.formatTime(delaySec)],
        //       [`sceneDeviceActionsFlatten[${index}].value`]: { delayTime: delaySec },
        //     })
        //   } else {
        //     //新增一个Id并push到列表后
        //     this.data.sceneDeviceActionsFlatten.push({
        //       uniId: new Date().getTime() + 'DLY',
        //       name: '延时',
        //       desc: [strUtil.formatTime(delaySec)],
        //       deviceType: 6,
        //       pic: '/package-automation/assets/imgs/automation/stopwatch-materialized.png',
        //       value: { delayTime: delaySec },
        //       orderNum: 0,
        //       dragId: new Date().getTime() + 'DLY',
        //     })
        //   }
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
      if (this.data.isDefault) {
        return
      }
      if (
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
      let tempSceneDevicelinkSelectList: string[] = [...this.data.tempSceneDevicelinkSelectedList]
      // const sceneInfo = sceneStore.allRoomSceneList.find(
      //   (item) => item.sceneId === this.data.yijianSceneId,
      // ) as Scene.SceneItem
      // console.log('当前场景', sceneInfo)
      // // 添加操作设备
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[e.detail]
      const modelName = 'light'
      findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })

      const index = tempSceneDevicelinkSelectList.findIndex((item) => item === e.detail)
      if (index === -1) {
        tempSceneDevicelinkSelectList.push(e.detail)
        // 添加该动作
        // const device = this.data.deviceList.find((item) => item.uniId === e.detail)
        // if (device) {
        // const property = deviceStore.allRoomDeviceFlattenMap[device.uniId].property
        // const desc = toPropertyDesc(device.proType, property!)
        // this.data.sceneDeviceActionsFlatten.push({
        //   uniId: device.uniId,
        //   name: device.deviceName,
        //   deviceType: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
        //   desc,
        //   pic: device.pic as string,
        //   proType: device.proType,
        //   value: {
        //     ...property,
        //     modelName: MODEL_NAME[device.proType],
        //   },
        //   orderNum: 0,
        //   dragId: device.uniId + Math.floor(Math.random() * 1001),
        // })
        // }
      } else {
        tempSceneDevicelinkSelectList = tempSceneDevicelinkSelectList.filter((item) => item !== e.detail)
      }
      // index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.uniId === e.detail)
      // const deviceAction = this.data.sceneDeviceActionsFlatten[index]
      // const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      // const device = allRoomDeviceMap[deviceAction.uniId]
      // let modelName = 'light'

      // if (deviceAction.proType === PRO_TYPE.switch) {
      //   modelName = device.switchInfoDTOList[0].switchId
      // }

      // device.deviceType === 2 && findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })

      this.setData(
        {
          tempSceneDevicelinkSelectedList: tempSceneDevicelinkSelectList,
          // sceneEditTitle: deviceAction.name,
          // sceneEditInfo: {
          //   ...deviceAction.value,
          //   deviceType: device.deviceType,
          //   gatewayId: device.gatewayId,
          //   deviceId: device.deviceId,
          // },
          // editIndex: index,
        },
        () => {
          console.log('选择后', this.data.sceneDevicelinkSelectList, this.data.tempSceneDevicelinkSelectedList)
        },
      )
    },
    handleSelectCardClose() {
      this.setData({
        showSelectCardPopup: false,
      })
    },
    handleSelectCardReturn() {
      this.setData({
        showSelectCardPopup: false,
      })
      if (this.data.selectCardType === 'sensor') {
        this.handleConditionShow()
      } else {
        this.handleActionShow()
      }
    },
    async handleSelectCardConfirm() {
      console.log('handleSelectCardConfirm')
      this.setData({
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
    async handleSortEnd(e: { detail: { listData: Device.ActionItem[] } }) {
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
    handleActionDelete(e: { detail: string }) {
      console.log(e.detail)
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
      const tempSceneDeviceActionsFlatten = this.data.sceneDeviceActionsFlatten as Device.ActionItem[]

      // 删除取消选中的设备和场景 //可选多设备改造后无需删除
      // tempSceneDeviceActionsFlatten = tempSceneDeviceActionsFlatten.filter((item) => {
      //   const index = this.data.linkSelectList.findIndex((id) => id === item.uniId)
      //   return index !== -1 || item.deviceType === 6
      // })

      //从后面插入已选中的设备和场景s
      this.data.sceneDevicelinkSelectList.forEach((id) => {
        //每次选中的都push到最后
        const device = this.data.deviceList.find((item) => item.uniId === id)
        if (device) {
          //是设备
          console.log('是设备', device)
          if (this.data.sceneDeviceActionsFlatten.map((item) => item.uniId).includes(id)) {
            return
          }
          if (device.proType === PRO_TYPE.switch) {
            //是开关面板
            const modelName = device.uniId.split(':')[1]
            const power = device.property!.power
            const desc = toPropertyDesc(device.proType, device.property!)
            tempSceneDeviceActionsFlatten.push({
              uniId: device.uniId,
              name: `${device.switchInfoDTOList[0].switchName} | ${device.deviceName}`,
              deviceType: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
              desc,
              pic: device.switchInfoDTOList[0].pic,
              proType: PRO_TYPE.switch,
              value: {
                modelName,
                power,
              },
              orderNum: 0,
              dragId: device.uniId + Math.floor(Math.random() * 1001),
            })
          } else {
            const desc = toPropertyDesc(device.proType, device.property!)
            tempSceneDeviceActionsFlatten.push({
              uniId: device.uniId,
              name: device.deviceName,
              deviceType: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
              desc,
              pic: device.pic as string,
              proType: device.proType,
              value: {
                modelName: 'light',
                ...device.property,
              },
              orderNum: 0,
              dragId: device.uniId + Math.floor(Math.random() * 1001),
            })
          }
        } else {
          const scene = this.data.sceneList.find((item) => item.sceneId === id)
          if (scene) {
            //是场景
            console.log('是场景', scene)
            // tempSceneDeviceActionsFlatten.push({
            //   uniId: scene.sceneId,
            //   name: scene.sceneName,
            //   deviceType: 5,
            //   desc: [scene.roomName],
            //   pic: `/assets/img/scene/${scene.sceneIcon}.png`,
            //   value: {},
            //   orderNum: 0,
            //   dragId: scene.sceneId + Math.floor(Math.random() * 1001),
            // })
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
        sceneDevicelinkSelectList: this.data.sceneDevicelinkSelectList,
      })

      // 防止场景为空，drag为null·
      if (sceneDeviceActionsFlatten.length) {
        const drag = this.selectComponent('#drag')
        if (drag) {
          drag.init()
        }
      }
    },
    /* 条件方法 start */
    updateSceneDeviceConditionsFlatten() {
      const sceneDeviceConditionsFlatten = [] as AutoScene.AutoSceneFlattenCondition[]

      if (this.data.roomId !== '') {
        sceneDeviceConditionsFlatten.push({
          uniId: 'room',
          name: '手动点击场景',
          desc: [
            roomStore.roomList.find((item) => item.roomId === this.data.roomId)?.roomName ??
              roomStore.roomList[0].roomName,
          ],
          pic: '/package-automation/assets/imgs/automation/touch-materialized.png',
          productId: 'touch',
          property: {},
          type: 5,
        })
      }

      if (this.data.timeCondition.time !== '') {
        sceneDeviceConditionsFlatten.push({
          uniId: 'time',
          name: this.data.timeCondition.time,
          desc: [strUtil.transPeriodDesc(this.data.timeCondition.timeType, this.data.timeCondition.timePeriod)],
          pic: '/package-automation/assets/imgs/automation/time-materialized.png',
          productId: 'time',
          property: {},
          type: 6,
        })
      }

      //已选中的传感器
      const sensorSelected = this.data.sensorlinkSelectList
        .map((id) => {
          return this.data.sensorList.find((item) => item.uniId === id)
        })
        .filter((item) => item !== undefined) as Device.DeviceItem[]

      sensorSelected.forEach((item) => {
        sceneDeviceConditionsFlatten.push({
          uniId: item.uniId,
          name: item.deviceName,
          desc: toPropertyDesc(item.proType, item.property!),
          pic: item.pic,
          productId: item.productId,
          property: item.property!,
          proType: item.proType,
          type: item.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
        })
      })

      this.setData({
        sceneDeviceConditionsFlatten,
      })
    },
    handleConditionDelete(e: WechatMiniprogram.TouchEvent) {
      console.log('删除', e)
      const uniId = e.currentTarget.dataset.info.uniId
      if (this.data.sensorlinkSelectList.includes(uniId)) {
        const index = this.data.sensorlinkSelectList.findIndex((id) => id === uniId)
        this.data.sensorlinkSelectList.splice(index, 1)
        this.setData({
          sensorlinkSelectList: [...this.data.sensorlinkSelectList],
        })
      }
      if (uniId === 'time') {
        this.setData({
          'timeCondition.time': '',
          'timeCondition.timePeriod': '',
          'timeCondition.timeType': '',
        })
      }
      this.data.sceneDeviceConditionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        _isEditCondition: true,
        sceneDeviceConditionsFlatten: [...this.data.sceneDeviceConditionsFlatten],
      })
    },
    /* 条件方法 end */

    /* 传感器条件编辑 start */
    handleEditSensorClose() {
      this.setData({
        showEditSensorPopup: false,
      })
    },
    handleEditSensorConfirm(e: { detail: IAnyObject }) {
      const listEditIndex = this.data.sensorList.findIndex((item) => item.uniId === this.data.editingUniId)
      const flattenEditIndex = this.data.sceneDeviceConditionsFlatten.findIndex(
        (item) => item.uniId === this.data.editingUniId,
      )
      const listItem = this.data.sensorList[listEditIndex]

      const conditionItem = this.data.sceneDeviceConditionsFlatten[flattenEditIndex]

      conditionItem.property = {
        ...e.detail,
      }
      conditionItem.desc = toPropertyDesc(conditionItem.proType!, conditionItem.property)
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

    handleSceneConditionEdit() {
      if (this.data.isDefault) {
        // 默认情景不能换房间
        return
      }
      // const { index } = e.currentTarget.dataset
      // const action = this.data.sceneDeviceConditionsFlatten[index]

      this.setData({
        showEditRoomPopup: true,
      })

      // if (action.productId === 'time') {
      //   this.setData({
      //     showTimeConditionPopup: true,
      //   })
      // } else {
      //   this.setData({
      //     editingSensorType: action.productId,
      //     editingSensorAbility: action.desc,
      //     editingSensorProperty: action.property,
      //     editingUniId: action.uniId,
      //     showEditSensorPopup: true,
      //   })
      // }
    },

    /**
     * 编辑场景延时/设备动作结果
     * @param e
     * @returns
     */
    handleSceneActionEdit(e: { detail: number }) {
      // 默认场景不可编辑场景设备数据
      if (this.data.isDefault) {
        return
      }

      const index = e.detail

      const deviceAction = this.data.sceneDeviceActionsFlatten[index]
      console.log(this.data.sceneDeviceActionsFlatten, index)
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[deviceAction.uniId]
      let modelName = 'light'

      if (deviceAction.proType === PRO_TYPE.switch) {
        modelName = device.switchInfoDTOList[0].switchId
      }

      device.deviceType === 2 && findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })

      this.setData({
        sceneEditTitle: deviceAction.name,
        sceneEditInfo: {
          ...deviceAction.value,
          deviceType: device.deviceType,
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
        },
        showEditPopup: device.proType,
        editIndex: index,
      })
    },
    /* 编辑设备动作弹窗 start */
    handleEditPopupClose() {
      this.setData({
        showEditPopup: '',
      })
    },
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      const { _cacheDeviceMap } = this.data
      const actionItem = this.data.sceneDeviceActionsFlatten[this.data.editIndex]
      const device = deviceStore.allRoomDeviceFlattenMap[actionItem.uniId]

      if (!_cacheDeviceMap[actionItem.uniId]) {
        let oldProperty = {
          ...device.property,
        }

        delete oldProperty.minColorTemp
        delete oldProperty.maxColorTemp

        if (oldProperty.proType === PRO_TYPE.curtain) {
          oldProperty = { curtain_position: oldProperty.curtain_position }
        }

        _cacheDeviceMap[actionItem.uniId] = {
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
          proType: device.proType,
          deviceType: device.deviceType,
          modelName: actionItem.value.modelName,
          property: oldProperty,
        }
      }

      actionItem.value = {
        // ...actionItem.value,
        ...e.detail,
      }

      actionItem.desc = toPropertyDesc(actionItem.proType, actionItem.value)

      this.setData(
        {
          _isEditAction: true,
          sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
          showEditPopup: '',
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
        },
      )
    },

    async go2dispatch() {
      console.log('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)
      // 检查场景名是否合法
      if (!this.data.sceneName) {
        Toast({
          message: '场景名不能为空',
          zIndex: 99999,
        })
        return
      }
      if (checkInputNameIllegal(this.data.sceneName)) {
        Toast({
          message: '场景名称不能用特殊符号或表情',
          zIndex: 99999,
        })
        return
      }
      if (this.data.sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        return
      }
      // 场景动作数据统一在scene-request-list页面处理

      const newSceneData = {
        conditionType: '0',
        deviceActions: [],
        deviceConditions: [],
        houseId: homeStore.currentHomeDetail.houseId,
        roomId: this.data.roomId === '' ? roomStore.roomList[roomStore.currentRoomIndex].roomId : this.data.roomId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneType: '0',
        orderNum: 0,
      } as Scene.AddSceneDto

      // 将新场景排到最后,orderNum可能存在跳号的情况
      sceneStore.sceneList.forEach((scene) => {
        if (scene.orderNum && scene.orderNum >= newSceneData.orderNum) {
          newSceneData.orderNum = scene.orderNum + 1
        }
      })

      storage.set('scene_data', newSceneData)
      storage.set('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)

      wx.navigateTo({
        url: '/package-automation/scene-request-list-yijian/index',
      })
    },

    async handleSave() {
      if (this.data.sceneDeviceActionsFlatten.length === 0) {
        // 删完actions按照删除场景处理
        Dialog.confirm({
          title: '清空操作将会删除场景，确定删除该场景？',
        }).then(async () => {
          const res = await deleteScene(this.data._sceneInfo.sceneId)
          if (res.success) {
            emitter.emit('sceneEdit')
            homeStore.updateRoomCardList()
            wx.navigateBack()
          } else {
            Toast({ message: '删除失败', zIndex: 9999 })
          }
        })
        return
      }

      // 准备好数据内存
      const data = {
        sceneId: this.data._sceneInfo.sceneId,
        updateType: '0',
        conditionType: '0',
        roomId: this.data.roomId,
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

        return
      }

      const res = await updateScene(data)
      if (res.success) {
        emitter.emit('sceneEdit')
        homeStore.updateRoomCardList()
        Toast({ message: '修改成功', zIndex: 9999 })
        wx.navigateBack()
      } else {
        Toast({ message: '修改失败', zIndex: 9999 })
      }
    },
    async handleAutoSceneDelete() {
      const res = await Dialog.confirm({
        title: this.data.isDefault ? '默认场景删除后不可恢复，确定删除该默认场景？' : '确定删除该场景？',
        zIndex: 9999,
      }).catch(() => 'cancel')

      console.log('delAutoScene', res)

      if (res === 'cancel') return

      const delRes = await deleteScene(this.data._sceneInfo.sceneId)
      if (delRes.success) {
        emitter.emit('sceneEdit')
        homeStore.updateRoomCardList()
        wx.navigateBack()
      } else {
        Toast({ message: '删除失败', zIndex: 9999 })
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
    selectAdviceName(e: { currentTarget: { dataset: { text: string } } }) {
      const name = e.currentTarget.dataset.text
      this.setData({
        sceneName: name,
      })
    },
    handleSceneRoomEditCancel() {
      this.setData({
        showEditRoomPopup: false,
      })
    },
    async handleSceneRoomEditConfirm(e: { detail: string }) {
      this.setData({
        roomId: e.detail,
        showEditRoomPopup: false,
        _isEditCondition: true,
      })
      this.updateSceneDeviceConditionsFlatten()
    },
    /* 执行结果拖拽相关方法 end */
  },
})
