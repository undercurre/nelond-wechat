import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore, homeStore, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { KNOB_PID, PRO_TYPE, SCREEN_PID } from '../../config/index'
import {
  deleteScene,
  findDevice,
  updateScene,
  getRelLampInfo,
  getRelDeviceInfo,
  sendDevice,
  delLampAndSwitchAssociated,
  delSwitchAndSwitchAssociated,
} from '../../apis/index'
import { emitter, getCurrentPageParams, toPropertyDesc, storage, strUtil } from '../../utils/index'

ComponentWithComputed({
  behaviors: [pageBehavior],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 页面的初始数据
   */
  data: {
    _sceneInfo: {} as Scene.SceneItem,
    _cacheDeviceMap: {} as IAnyObject, // 缓存设备设置预览前的设备状态，用于退出时恢复
    sceneName: '',
    sceneIcon: '',
    /** 过滤出全屋开关，提供关联开关选择 */
    switchList: [] as Device.DeviceItem[],
    /** 是否默认场景，默认场景不允许改图标 */
    isDefault: false,
    /** 列表高度 */
    contentHeight: 0,
    showEditNamePopup: false,
    showEditIconPopup: false,
    showLinkPopup: false,
    /** 将当前场景里多路的action拍扁 */
    sceneDeviceActionsFlatten: [] as Device.ActionItem[],
    /** 关联弹窗选中的开关确认后的开关uniId */
    linkSwitch: '',
    /** 关联选中的开关的已有关联绑定信息 */
    _linkSwitchRefInfo: {
      lampRelList: Array<Device.IMzgdLampRelGetDTO>(), // 当前面板的灯关联数据
      switchRelList: Array<Device.IMzgdRelGetDTO>(), // 当前面板的关联面板数据
    },
    /** 关联弹窗展示用的选择列表 */
    linkSwitchSelect: [] as string[],
    /** 是否修改过action */
    _isEditAction: false,
    sceneEditTitle: '',
    showEditPopup: '', // 要展示的编辑弹窗类型
    sceneEditInfo: {} as IAnyObject,
  },

  computed: {
    linkSwitchName(data) {
      if (data.linkSwitch) {
        const deviceMap = deviceStore.allRoomDeviceMap
        const device = deviceMap[data.linkSwitch.split(':')[0]]
        const switchName = device.switchInfoDTOList.find(
          (switchItem) => switchItem.switchId === data.linkSwitch.split(':')[1],
        )?.switchName
        return device.deviceName.slice(0, 5) + switchName?.slice(0, 4)
      }
      return ' '
    },
    showSceneName(data) {
      console.log(data.sceneName)
      if (data.sceneName.length > 12) {
        return data.sceneName.slice(0, 12) + '...'
      }
      return data.sceneName
    },
  },

  lifetimes: {
    ready() {
      const pageParams = getCurrentPageParams()

      const deviceMap = deviceStore.allRoomDeviceMap
      const sceneDeviceActionsFlatten = [] as Device.ActionItem[]

      const sceneInfo = sceneStore.sceneList.find((item) => item.sceneId === pageParams.sceneId) as Scene.SceneItem

      this.data._sceneInfo = sceneInfo

      sceneInfo.deviceActions = sceneInfo.deviceActions || []

      sceneInfo.deviceActions.forEach((actions) => {
        const device = deviceMap[actions.deviceId]

        if (!device) {
          console.log('不存在的设备', actions)
          return
        }

        if (device.proType === PRO_TYPE.switch) {
          // 多路开关
          actions.controlAction.forEach((action) => {
            // 将当前选中编辑的场景，拍扁action加入list
            sceneDeviceActionsFlatten.push({
              uniId: `${actions.deviceId}:${action.modelName}`,
              proType: PRO_TYPE.switch,
              name: `${action.deviceName} | ${actions.deviceName}`,
              desc: toPropertyDesc(actions.proType, action),
              deviceType: actions.deviceType,
              pic: action.devicePic as string,
              value: action,
            })
          })
        } else {
          let property = actions.controlAction[0]

          if (actions.proType === PRO_TYPE.light) {
            property = {
              ...device.mzgdPropertyDTOList['light'],
              ...property,
            }
          }

          // property = transferDeviceProperty(actions.proType, property)
          // 灯光设备
          const action = {
            uniId: `${actions.deviceId}`,
            name: `${device.deviceName}`,
            desc: toPropertyDesc(actions.proType, property),
            pic: actions.devicePic as string,
            proType: actions.proType,
            deviceType: actions.deviceType,
            value: property,
          }

          sceneDeviceActionsFlatten.push(action)
        }
      })

      const linkSwitch = sceneStore.sceneSwitchMap[sceneInfo.sceneId] || ''
      const switchList = deviceStore.allRoomDeviceFlattenList.filter(
        (device) =>
          device.proType === PRO_TYPE.switch &&
          !SCREEN_PID.includes(device.productId) &&
          !KNOB_PID.includes(device.productId),
      )

      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
              sceneName: sceneInfo.sceneName,
              sceneIcon: sceneInfo.sceneIcon,
              switchList,
              sceneDeviceActionsFlatten,
              isDefault: sceneInfo.isDefault === '1',
              linkSwitch,
              linkSwitchSelect: linkSwitch ? [linkSwitch] : [],
            })
          }
        })
    },
  },

  methods: {
    handleExit() {
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

      this.goBack()
    },
    handleSceneDelete() {
      Dialog.confirm({
        title: '确定删除该场景？',
        context: this,
      })
        .then(async () => {
          const res = await deleteScene(this.data._sceneInfo.sceneId)
          if (res.success) {
            emitter.emit('sceneEdit')
            homeStore.updateRoomCardList()
            wx.navigateBack()
          } else {
            Toast({ message: '删除失败', zIndex: 9999, context: this })
          }
        })
        .catch((err) => err)
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      this.data.sceneDeviceActionsFlatten.splice(e.currentTarget.dataset.index, 1)

      this.setData({
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
        _isEditAction: true,
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

      const data = {
        sceneId: this.data._sceneInfo.sceneId,
        updateType: '0',
        conditionType: '0',
      } as Scene.UpdateSceneDto

      if (this.data.sceneName !== this.data._sceneInfo.sceneName) {
        data.sceneName = this.data.sceneName
      }
      if (this.data.sceneIcon !== this.data._sceneInfo.sceneIcon) {
        data.sceneIcon = this.data.sceneIcon
      }

      if (this.data.linkSwitch) {
        if (
          deviceStore.switchSceneConditionMap[this.data.linkSwitch] &&
          deviceStore.switchSceneConditionMap[this.data.linkSwitch] !== this.data._sceneInfo.sceneId
        ) {
          // 解绑开关原来的场景
          const res = await updateScene({
            sceneId: deviceStore.switchSceneConditionMap[this.data.linkSwitch],
            updateType: '2',
          })
          if (!res.success) {
            Toast({
              message: '解除绑定失败',
              zIndex: 99999,
            })
            return
          }
        }

        const { lampRelList, switchRelList } = this.data._linkSwitchRefInfo
        const [deviceId, switchId] = this.data.linkSwitch.split(':')

        if (lampRelList.length) {
          // 删除指定面板和灯的关联数据

          const res = await delLampAndSwitchAssociated({
            deviceId: deviceId,
            switchId: switchId,
            relIds: lampRelList.map((item) => item.lampDeviceId).join(','),
          })

          if (!res.success) {
            Toast({ message: '删除面板已有的灯关联失败', zIndex: 9999 })
            return
          }
        }

        if (switchRelList.length) {
          // 删除指定面板和灯的关联数据

          const res = await delSwitchAndSwitchAssociated({
            relIds: switchRelList.map((item) => item.relId).join(','),
          })

          if (!res.success) {
            Toast({ message: '删除面板已有的开关关联失败', zIndex: 9999 })
            return
          }
        }

        data.deviceConditions = [
          {
            deviceId: this.data.linkSwitch.split(':')[0],
            controlEvent: [
              {
                modelName: this.data.linkSwitch.split(':')[1],
                buttonScene: 1,
              },
            ],
          },
        ]
        data.updateType = '3'
      } else if (!this.data.linkSwitch && this.data._sceneInfo.deviceConditions) {
        // 删除绑定
        data.updateType = '2'
      }

      if (this.data._isEditAction) {
        data.deviceActions = []
        data.updateType = data.updateType === '0' ? '1' : data.updateType === '2' ? '4' : '5'

        // 场景动作数据统一在scene-request-list页面处理
        storage.set('scene_data', data)
        storage.set('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)

        // 需要更新结果的情况，需要跳转页面等待上报结果
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-room-control/scene-request-list/index', { sceneId: data.sceneId }),
        })

        return
      }

      const res = await updateScene(data)
      if (res.success) {
        emitter.emit('sceneEdit')
        Toast({ message: '修改成功', zIndex: 9999 })
        wx.navigateBack()
      } else {
        Toast({ message: '修改失败', zIndex: 9999 })
      }
    },
    handleEditNameShow() {
      this.setData({
        showEditNamePopup: true,
      })
    },
    handleEditNameClose() {
      this.setData({
        showEditNamePopup: false,
      })
    },
    handleEditNameConfirm(e: { detail: string }) {
      this.setData({
        showEditNamePopup: false,
        sceneName: e.detail,
      })
    },
    handleEditIconShow() {
      if (this.data.isDefault) {
        return
      }
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
    async handleSwitchSelect(e: { detail: string }) {
      const switchUnid = e.detail
      const { sceneDeviceActionsFlatten } = this.data

      if (sceneDeviceActionsFlatten.find((item) => item.uniId === switchUnid)) {
        Toast({ message: '无法选择，此开关已是当前场景的执行设备', zIndex: 9999 })
        return
      }

      if (this.data.linkSwitchSelect[0] === switchUnid) {
        this.setData({
          linkSwitchSelect: [],
        })
        return
      }

      const [deviceId, switchId] = switchUnid.split(':')

      // 查询所选面板与其他开关和灯的关联关系
      const res = await Promise.all([
        getRelLampInfo({
          primaryDeviceId: deviceId,
          primarySwitchId: switchId,
        }),
        getRelDeviceInfo({
          primaryDeviceId: deviceId,
          primarySwitchId: switchId,
        }),
      ])

      if (!res[0].success || !res[1].success) {
        Toast({ message: '查询设备信息失败', zIndex: 9999 })
        return
      }

      const lampRelList = res[0].result.lampRelList
      const switchRelList = res[1].result.primaryRelDeviceInfo.concat(res[1].result.secondRelDeviceInfo)
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      let linkDesc = ''

      if (lampRelList.length) {
        linkDesc = '灯具'
      } else if (switchRelList.length) {
        linkDesc = '开关'
      } else if (switchSceneConditionMap[switchUnid]) {
        linkDesc = '其他场景'
      }

      if (linkDesc) {
        const dialigRes = await Dialog.confirm({
          message: `此开关已关联${linkDesc}，确定变更？`,
          cancelButtonText: '取消',
          confirmButtonText: '变更',
          zIndex: 2000,
        })
          .then(() => true)
          .catch(() => false)

        if (!dialigRes) return
      }

      this.data._linkSwitchRefInfo.lampRelList = lampRelList
      this.data._linkSwitchRefInfo.switchRelList = switchRelList

      this.setData({
        linkSwitchSelect: [switchUnid],
      })
    },

    handleLinkSwitchPopup() {
      this.setData({
        showLinkPopup: true,
      })
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupConfirm() {
      this.setData({
        showLinkPopup: false,
        linkSwitch: this.data.linkSwitchSelect[0] ? this.data.linkSwitchSelect[0] : '',
      })
    },
    handleSceneActionEdit(e: WechatMiniprogram.TouchEvent) {
      console.log('编辑action')
      // 默认场景不可编辑场景设备数据
      if (this.data.isDefault) {
        return
      }

      const { index } = e.currentTarget.dataset

      const deviceAction = this.data.sceneDeviceActionsFlatten[index]
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
        ...actionItem.value,
        ...e.detail,
      }

      actionItem.desc = toPropertyDesc(actionItem.proType, actionItem.value)

      this.setData({
        _isEditAction: true,
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
      })
    },
  },
})
