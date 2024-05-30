import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehavior from '../../behaviors/pageBehaviors'
import { storage, emitter, getCurrentPageParams } from '../../utils/index'
import { addScene, retryScene, updateScene } from '../../apis/index'
import { sceneStore, deviceStore, projectStore, spaceStore } from '../../store/index'
import { PRO_TYPE } from '../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    opearationType: 'add', // add创建edit编辑
    sceneId: '',
    isDefault: false,
    _sceneData: {} as Scene.AddSceneDto | Scene.UpdateSceneDto,
    deviceList: Array<Device.DeviceItem>(),
    linkSwitchPopup: false,
  },

  computed: {
    finishNum(data) {
      return data.deviceList.filter((item) => item.status !== 'waiting').length
    },
    successNum(data) {
      return data.deviceList.filter((item) => item.status === 'success').length
    },
    tipsText(data) {
      let text = '配置完成'

      if (data.successNum < data.deviceList.length && data.finishNum === data.deviceList.length) {
        Dialog.confirm({
          title: '创建失败',
          message: '部分设备配置自动化失败，请确保所有设备在线后重试',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
          .then(() => {
            // on confirm
          })
          .catch(() => {
            // on cancel
          })
      }

      if (data.finishNum !== data.deviceList.length) {
        // text = `正在将场景配置下发至设备（${data.finishNum}/${data.deviceList.length}）…`
        text = '正在将一键场景数据下发至设备，请稍后…'
      }

      return text
    },
  },

  lifetimes: {
    async ready() {
      const pageParams = getCurrentPageParams()

      const sceneData = storage.get('scene_data') as Scene.AddSceneDto | Scene.UpdateSceneDto

      const sceneDeviceActionsFlatten = storage.get('sceneDeviceActionsFlatten') as AutoScene.AutoSceneFlattenAction[]

      console.log('scene-request-flatten', sceneDeviceActionsFlatten)

      const selectIdList = sceneDeviceActionsFlatten.map((item) => item.uniId)

      // 找到这个sceneInfo
      if (pageParams.sceneId) {
        const curSceneInfo = sceneStore.allRoomSceneList.find(
          (item) => item.sceneId === pageParams.sceneId,
        ) as Scene.SceneItem
        this.data.isDefault = curSceneInfo.isDefault === '1'
        this.setData({
          isDefault: curSceneInfo.isDefault === '1',
        })
      }

      const deviceList = deviceStore.allDeviceFlattenList
        .filter((item) => selectIdList.includes(item.uniId))
        .map((item) => {
          const isSwitch = item.proType === PRO_TYPE.switch
          let { deviceName } = item
          let name = deviceName
          if (isSwitch) {
            const { switchName } = item.switchInfoDTOList[0]
            if (switchName.length + deviceName.length > 15) {
              deviceName = deviceName.slice(0, 12 - switchName.length) + '...' + deviceName.slice(-2)
            }
            name = `${switchName}|${deviceName}`
          }
          const space = spaceStore.allSpaceList.find((s) => s.spaceId === item.spaceId) as Space.allSpace

          return {
            ...item,
            pic: isSwitch ? item.switchInfoDTOList[0]?.pic : item.pic,
            deviceName: name,
            spaceName: spaceStore.getSpaceClearName(space),
            status: this.data.isDefault ? 'success' : 'waiting',
          }
        })

      // 处理发送请求的deviceActions字段数据
      const deviceMap = deviceStore.allDeviceMap

      sceneDeviceActionsFlatten.forEach((action) => {
        const device = deviceMap[action.uniId] || deviceMap[action.uniId.split(':')[0]]
        console.log('该设备', device)
        if (action.proType === PRO_TYPE.switch) {
          //是开关面板
          const deviceId = action.uniId.split(':')[0]
          sceneData?.deviceActions?.push({
            controlAction: [action.value],
            deviceId,
            deviceType: action.type,
            proType: action.proType,
          })
        } else {
          const property = action.value
          const ctrlAction = {} as IAnyObject

          if (device.deviceType === 2) {
            ctrlAction.modelName = device.proType === PRO_TYPE.light ? 'light' : 'wallSwitch1'
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
            ctrlAction.curtain_position = property.curtain_position
          } else if (device.proType === PRO_TYPE.bathHeat) {
            ctrlAction.light_mode = property.light_mode
            ctrlAction.heating_temperature = property.heating_temperature
            ctrlAction.mode = property.mode
          } else if (device.proType === PRO_TYPE.clothesDryingRack) {
            ctrlAction.updown = property.updown
            ctrlAction.laundry = property.laundry
            ctrlAction.light = property.light
          }

          sceneData?.deviceActions?.push({
            controlAction: [ctrlAction],
            deviceId: action.uniId,
            deviceType: device.deviceType,
            proType: device.proType,
          })
        }
      })

      this.setData({
        _sceneData: sceneData,
        deviceList,
      })

      emitter.on('scene_device_result_status', (data) => {
        console.log('scene_device_result_status', data)
        const device = this.data.deviceList.find(
          (item) => item.uniId === data.devId || item.uniId === `${data.devId}:${data.modelName}`,
        )

        if (device) {
          device.status = data.errCode === 0 ? 'success' : 'fail'
          this.setData({
            deviceList,
          })
        }
      })
      this.setData({
        opearationType: pageParams.sceneId ? 'edit' : 'add',
      })
      const promise = pageParams.sceneId
        ? updateScene(sceneData as Scene.UpdateSceneDto)
        : addScene(sceneData as Scene.AddSceneDto)

      const res = await promise

      if (res.success) {
        this.setData({
          sceneId: pageParams.sceneId || res.result.sceneId,
        })

        setTimeout(() => {
          this.data.deviceList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData({
            deviceList,
          })
        }, 30000)
      } else {
        // Toast({
        //   message: '创建失败',
        // })
        Dialog.confirm({
          title: '创建失败',
          message: '部分设备配置自动化失败，请确保所有设备在线后重试',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
          .then(() => {
            // on confirm
          })
          .catch(() => {
            // on cancel
          })
      }
    },

    detached() {
      emitter.off('scene_device_result_status')
      sceneStore.updateAllRoomSceneList()
      deviceStore.updateAllDeviceList()
      projectStore.updateSpaceCardList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleAddScenePopupClose() {
      this.setData({
        linkSwitchPopup: false,
      })
    },
    handleShowAddSceneSuccess() {
      if (this.data.opearationType === 'edit') {
        wx.navigateBack()
        emitter.emit('sceneEdit')
      } else {
        wx.navigateTo({ url: '/package-automation/scene-success/index' })
      }
    },
    linkSwitch() {
      this.setData({
        linkSwitchPopup: true,
      })
    },
    async retry() {
      const { _sceneData, sceneId, deviceList } = this.data
      const deviceActions = [] as Scene.DeviceAction[]

      const failList = deviceList.filter((item) => item.status === 'fail')

      // 由于云端场景下发逻辑，仅zigbee灯会存在场景下发失败的情况，暂时只考虑灯的重试处理逻辑
      failList.forEach((device) => {
        device.status = 'waiting'
        const action = (_sceneData.deviceActions as Scene.DeviceAction[]).find(
          (actionItem) => actionItem.deviceId === device.deviceId,
        ) as Scene.DeviceAction

        if (device.proType === PRO_TYPE.light) {
          deviceActions.push(action)
        }
      })

      this.setData({
        deviceList,
      })

      const res = await retryScene({
        deviceActions,
        sceneId,
      })

      if (res.success) {
        setTimeout(() => {
          this.data.deviceList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData({
            deviceList,
          })
        }, 30000)
      } else {
        Toast({
          message: '重试失败',
        })
      }
    },
  },
})
