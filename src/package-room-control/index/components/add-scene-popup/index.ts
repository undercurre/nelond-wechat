import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import {
  updateScene,
  getRelLampInfo,
  getRelDeviceInfo,
  delLampAndSwitchAssociated,
  delSwitchAndSwitchAssociated,
} from '../../../../apis/index'
import { sceneList, SCREEN_PID } from '../../../../config/index'
import { deviceStore, homeStore, roomStore, sceneStore } from '../../../../store/index'
import { storage, checkInputNameIllegal } from '../../../../utils/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
        this.setData({
          sceneIcon: 'general',
          sceneName: '',
          linkSwitch: '',
        })
      },
    },
    actions: {
      type: Array,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneIcon: '',
    sceneName: '',
    contentHeight: 0,
    sceneList: sceneList.filter((scene) => !scene[1].isDefault),
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    linkSelectList: [] as string[],
    linkSwitch: '', // 上一个确认的结果保存在这里
    /** 关联选中的开关的已有关联绑定信息 */
    _linkSwitchRefInfo: {
      lampRelList: Array<Device.IMzgdLampRelGetDTO>(), // 当前面板的灯关联数据
      switchRelList: Array<Device.IMzgdRelGetDTO>(), // 当前面板的关联面板数据
    },
    showLinkPopup: false,
    isAddingScene: false,
  },

  computed: {
    disabled(data) {
      return !data.sceneName
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
    handleReturn() {
      this.triggerEvent('return')
    },
    handleClose() {
      this.triggerEvent('close')
    },
    async handleConfirm() {
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

      this.setData({
        isAddingScene: true,
      })

      const newSceneData = {
        conditionType: '0',
        deviceActions: [],
        deviceConditions: [],
        projectId: homeStore.currentProjectDetail.projectId,
        spaceId: roomStore.roomList[roomStore.currentSpaceIndex].spaceId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneType: this.data.linkSwitch ? '1' : '0',
        orderNum: 0,
      } as Scene.AddSceneDto

      if (this.data.linkSwitch) {
        // 绑定了开关
        newSceneData.deviceConditions = [
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

        const switchSceneConditionMap = deviceStore.switchSceneConditionMap
        if (switchSceneConditionMap[this.data.linkSwitch]) {
          // 如果这个开关已经绑定场景，先取消绑定原来的场景
          const res = await updateScene({
            conditionType: '0',
            sceneId: switchSceneConditionMap[this.data.linkSwitch],
            updateType: '2',
          })

          if (!res.success) {
            Toast({
              message: '取消绑定原有场景失败',
              zIndex: 99999,
            })
            this.setData({
              isAddingScene: false,
            })
            return
          }
        }

        await sceneStore.updateAllRoomSceneList()

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
      }

      // 将新场景排到最后,orderNum可能存在跳号的情况
      sceneStore.sceneList.forEach((scene) => {
        if (scene.orderNum && scene.orderNum >= newSceneData.orderNum) {
          newSceneData.orderNum = scene.orderNum + 1
        }
      })

      storage.set('scene_data', newSceneData)
      storage.set('sceneDeviceActionsFlatten', this.data.actions)

      this.setData({
        isAddingScene: false,
      })

      this.triggerEvent('close')
      this.triggerEvent('confirm')
    },

    handleClear() {
      this.setData({
        sceneName: '',
      })
    },
    handleSceneNameInput(e: { detail: { value: string } }) {
      this.setData({
        sceneName: e.detail.value,
      })
    },
    handleSceneIconTap(e: { currentTarget: { dataset: { scene: string } } }) {
      this.setData({
        sceneIcon: e.currentTarget.dataset.scene,
      })
    },
    handleLinkSwitchPopup() {
      const list = deviceStore.allRoomDeviceFlattenList.filter((item) => {
        if (!item.uniId.includes(':') || SCREEN_PID.includes(item.productId)) {
          return false
        }
        // 排除掉已在待创建场景执行动作中的开关
        return !sceneStore.addSceneActions.some((action) => action.uniId === item.uniId)
      })

      if (list.length <= 0) {
        Toast('没有可关联的智能开关')
        return
      }

      this.setData({
        showLinkPopup: true,
        list,
        linkSelectList: this.data.linkSwitch ? [this.data.linkSwitch] : [],
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
        linkSwitch: this.data.linkSelectList[0] ? this.data.linkSelectList[0] : '',
      })
    },
    async handleLinkSelect(e: { detail: string }) {
      const switchUnid = e.detail
      const actions = this.data.actions as Device.ActionItem[]

      if (actions.find((item) => item.uniId === switchUnid)) {
        Toast({ message: '无法选择，此开关已是当前场景的执行设备', zIndex: 9999 })
        return
      }

      if (this.data.linkSelectList[0] === switchUnid) {
        this.setData({
          linkSelectList: [],
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
          title: `此开关已关联${linkDesc}，确定变更？`,
          cancelButtonText: '取消',
          confirmButtonText: '变更',
          zIndex: 2000,
          context: this,
        })
          .then(() => true)
          .catch(() => false)

        if (!dialigRes) return
      }

      this.data._linkSwitchRefInfo.lampRelList = lampRelList
      this.data._linkSwitchRefInfo.switchRelList = switchRelList

      this.setData({
        linkSelectList: [switchUnid],
      })
    },
  },
})
