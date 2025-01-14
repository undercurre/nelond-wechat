import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceStore, projectBinding, spaceBinding, spaceStore } from '../../store/index'
import { emitter, checkInputNameIllegal, storage } from '../../utils/index'
import { StatusType } from './typings'
import { addGroup, renameGroup, delGroup, updateGroup, retryGroup } from '../../apis/device'
import Toast from '@vant/weapp/toast/toast'

let timeoutId: number | null

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding] }), pageBehaviors],
  data: {
    isEdit: false, // 是否编辑
    deviceList: [] as Device.DeviceItem[],
    status: 'processing' as StatusType,
    defaultGroupName: '灯组', // 默认分组名称
    groupName: '',
    groupId: '',
    presetNames: ['筒灯', '射灯', '吊灯', '灯组'],
    showGroupFailTips: false,
    scrollHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      (storage.get('navigationBarHeight') as number),
  },
  computed: {
    pageTitle(data) {
      return data.isEdit ? '编辑分组' : '创建分组'
    },
    successList(data) {
      return data.deviceList.filter((device) => device.status === 'success')
    },
    failedList(data) {
      return data.deviceList.filter((device) => device.status === 'failed')
    },
    tips(data) {
      return `正在将分组数据下发至灯具（${data.successList.length}/${data.deviceList.length}）…`
    },
  },
  observers: {
    status(status) {
      const max =
        (storage.get('windowHeight') as number) -
        (storage.get('statusBarHeight') as number) -
        (storage.get('bottomBarHeight') as number) - // IPX
        (storage.get('navigationBarHeight') as number)
      let scrollHeight
      if (status === 'processing') {
        scrollHeight = max
      } else if (status === 'hasFailure') {
        scrollHeight = max - 140 // 有两个按钮减少
      } else {
        scrollHeight = max - 90 // 有按钮减少
      }

      this.setData({ scrollHeight })
    },
  },

  methods: {
    onLoad() {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.on('createGroup', async (data) => {
        const deviceList = data.lightList.map((deviceId: string) => {
          const device = deviceStore.allDeviceMap[deviceId]
          return {
            ...device,
            spaceClearName: spaceStore.getSpaceClearNameById(device.spaceId),
            status: 'processing',
          }
        })

        console.log(data.lightList, deviceList, deviceStore.allDeviceMap)

        this.setData({
          deviceList,
          groupId: data.groupId,
          isEdit: !!data.groupId,
          groupName: data.groupName || this.data.defaultGroupName,
        })

        // 开始创建\更新分组
        if (!this.data.groupId) {
          await this.addGroup()
        } else {
          await updateGroup({
            applianceGroupDtoList: this.data.deviceList.map((device) => ({
              deviceId: device.deviceId,
              deviceType: device.deviceType,
              proType: device.proType,
            })),
            groupId: this.data.groupId,
          })
        }

        // 超时控制
        const TIME_OUT = Math.min(Math.max(15000, this.data.deviceList.length * 1000), 120000)
        timeoutId = setTimeout(() => {
          timeoutId = null
          if (this.data.deviceList.length !== this.data.successList.length) {
            this.setData({
              showGroupFailTips: true,
              status: 'hasFailure',
            })
          }
          // 如果全部失败，则清空分组
          else if (this.data.failedList.length === this.data.deviceList.length) {
            delGroup({ groupId: this.data.groupId })
            this.setData({
              groupId: '',
            })
          }
        }, TIME_OUT)
      })

      // 监听分组结果
      emitter.on('group_device_result_status', (result) => {
        const diffData = {} as IAnyObject
        const index = this.data.deviceList.findIndex((device) => device.deviceId === result.devId)
        const isSuccess = result.errCode === 0

        console.log('emitter====', result.devId, index)

        diffData[`deviceList[${index}].status`] = isSuccess ? 'success' : 'failed'

        // 若这是最后一个上报，则变更页面状态
        if (this.data.failedList.length + this.data.successList.length === this.data.deviceList.length - 1) {
          diffData.status = this.data.failedList.length || !isSuccess ? 'hasFailure' : 'allSuccess'

          if (diffData.status === 'hasFailure') {
            this.setData({
              showGroupFailTips: true,
            })
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
          } else if (this.data.showGroupFailTips) {
            this.setData({
              showGroupFailTips: false,
            })
          }
        }

        this.setData(diffData)

        // 如果全部失败，则清空分组
        if (this.data.failedList.length === this.data.deviceList.length) {
          delGroup({ groupId: this.data.groupId })
          this.setData({
            groupId: '',
          })
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      })
    },
    onUnload() {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
    handleCloseDialog() {
      this.setData({
        showGroupFailTips: false,
      })
    },
    async addGroup() {
      const res = await addGroup({
        applianceGroupDtoList: this.data.deviceList.map((device) => ({
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          proType: device.proType,
        })),
        groupName: this.data.groupName, // 不经用户选择，自动命名
        projectId: this.data.currentProjectId,
        spaceId: this.data.currentSpace.spaceId,
      })
      if (res.success) {
        this.data.groupId = res.result.groupId
      }
    },

    async retryGroup() {
      if (!this.data.groupId) {
        this.addGroup()
      } else {
        await retryGroup({
          applianceGroupDtoList: this.data.deviceList
            .filter((device) => device.status === 'failed')
            .map((device) => ({
              deviceId: device.deviceId,
              deviceType: device.deviceType,
              proType: device.proType,
            })),
          groupId: this.data.groupId,
        })
      }

      // 重新生成列表，未成功转为进行中，并设置状态为进行中
      const deviceList = this.data.deviceList.map((device) => ({
        ...device,
        status: device.status === 'failed' ? 'processing' : device.status,
      }))
      this.setData({
        deviceList,
        status: 'processing',
      })
    },

    toRename() {
      this.setData({
        status: 'naming',
      })
    },

    handlePreset(e: { currentTarget: { dataset: { value: string } } }) {
      this.setData({
        groupName: e.currentTarget.dataset.value,
      })
    },

    changeGroupName(e: { detail: string }) {
      this.setData({
        groupName: e.detail,
      })
    },

    /**
     * 跳过失败的设备
     */
    jumpFail() {
      // 编辑灯组的情况
      if (this.data.isEdit) {
        this.endGroup()
      } else {
        this.nextStep()
      }
    },

    /**
     * 分组指令下发成功后，进入下一步
     */
    nextStep() {
      // 编辑灯组的情况
      if (this.data.isEdit) {
        this.endGroup()
      } else {
        this.toRename()
      }
    },

    endGroup() {
      emitter.off('group_device_result_status')
      wx.navigateBack()
    },

    finishBtn() {
      // 校验名字合法性
      if (checkInputNameIllegal(this.data.groupName)) {
        Toast('设备名称不能用特殊符号或表情')
        return
      }

      if (this.data.groupName.length > 10) {
        Toast('设备名称不能超过10个字符')
        return
      }

      if (this.data.defaultGroupName !== this.data.groupName) {
        renameGroup({
          groupId: this.data.groupId,
          groupName: this.data.groupName,
        })
      }
      this.endGroup()
    },
  },
})
