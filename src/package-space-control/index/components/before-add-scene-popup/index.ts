import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { findDevice, sendDevice } from '../../../../apis/index'
import { PRO_TYPE } from '../../../../config/index'
import { deviceStore, spaceBinding, sceneBinding, sceneStore } from '../../../../store/index'
import { toPropertyDesc } from '../../../../utils/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [BehaviorWithStore({ storeBindings: [sceneBinding, spaceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    editIndex: 0,
    contentHeight: 0,
    actionEditTitle: '',
    popupType: '', // 编辑的设备类型
    sceneEditInfo: {} as IAnyObject,
    _cacheDeviceMap: {} as IAnyObject, // 缓存设备设置预览前的设备状态，用于退出时恢复
  },

  computed: {
    spaceName(data) {
      return data.currentSpace?.spaceName ?? ''
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getHeight() {
      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    handleClose() {
      this.triggerEvent('close')

      const { _cacheDeviceMap } = this.data

      console.log('handleClose', _cacheDeviceMap)

      for (const cacheDevice of Object.values(_cacheDeviceMap)) {
        sendDevice({
          deviceId: cacheDevice.deviceId,
          gatewayId: cacheDevice.gatewayId,
          proType: cacheDevice.proType,
          deviceType: cacheDevice.deviceType,
          modelName: cacheDevice.modelName,
          property: cacheDevice.property,
        })
      }
    },
    handleNext() {
      this.triggerEvent('next')
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      sceneStore.addSceneActions.splice(e.currentTarget.dataset.index, 1)
      runInAction(() => {
        sceneStore.addSceneActions = [...sceneStore.addSceneActions]
      })
    },
    handleSceneActionEdit(e: WechatMiniprogram.TouchEvent) {
      const deviceAction = sceneStore.addSceneActions[e.currentTarget.dataset.index]
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[deviceAction.uniId]

      let modelName = 'light'
      if (device.proType === PRO_TYPE.switch) {
        modelName = device.switchInfoDTOList[0].switchId
      }
      // 目前仅子设备单控支持闪烁指令
      deviceAction.deviceType === 2 && findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, modelName })

      this.setData({
        actionEditTitle: deviceAction.name,
        sceneEditInfo: {
          ...deviceAction.value,
          deviceType: deviceAction.deviceType,
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
        },
        popupType: deviceAction.proType,
        editIndex: e.currentTarget.dataset.index,
      })
    },
    handleEditPopupClose() {
      this.setData({
        popupType: '',
      })
    },

    /**
     * 预览设备状态,需求
     */
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      console.log('previewDeviceStatus', e)
      const { _cacheDeviceMap } = this.data
      const deviceAction = sceneStore.addSceneActions[this.data.editIndex]
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[deviceAction.uniId]
      const previewData = e.detail

      if (!_cacheDeviceMap[deviceAction.uniId]) {
        let property = {
          ...deviceAction.value,
        }

        delete property.minColorTemp
        delete property.maxColorTemp

        if (deviceAction.proType === PRO_TYPE.curtain) {
          property = { curtain_position: deviceAction.value.curtain_position }
        }

        _cacheDeviceMap[deviceAction.uniId] = {
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
          proType: device.proType,
          deviceType: device.deviceType,
          modelName: deviceAction.value.modelName,
          property,
        }
      }

      deviceAction.value = {
        ...deviceAction.value,
        ...previewData,
      }

      deviceAction.desc = toPropertyDesc(deviceAction.proType, deviceAction.value)

      runInAction(() => {
        sceneStore.addSceneActions = [...sceneStore.addSceneActions]
      })
    },
  },
})
