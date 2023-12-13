import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceStore, projectBinding, roomBinding } from '../../store/index'
import { emitter } from '../../utils/index'
import { StatusType } from './typings'
import { addGroup, renameGroup, delGroup, updateGroup } from '../../apis/device'

let timeoutId: number | null

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, roomBinding] }), pageBehaviors],
  data: {
    deviceList: [] as Device.DeviceItem[],
    status: 'processing' as StatusType,
    groupName: '',
    groupId: '',
    presetNames: ['筒灯', '射灯', '吊灯', '灯组'],
    showGroupFailTips: false,
  },
  computed: {
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

  methods: {
    onLoad() {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.on('createGroup', async (data) => {
        const deviceList = data.lightList.map((deviceId: string) => ({
          ...deviceStore.deviceMap[deviceId],
          status: 'processing',
        }))
        console.log(data.lightList, deviceList, deviceStore.deviceMap)

        this.setData({
          deviceList,
          groupId: data.groupId,
          groupName: data.groupName ?? '灯组',
        })

        // 开始创建\更新分组
        if (!this.data.groupId) {
          await this.addGroup()
        } else {
          await this.updateGroup()
        }

        // 超时控制
        const TIME_OUT = Math.min(Math.max(8000, this.data.deviceList.length * 1000), 120000)
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
        groupName: '灯组',
        projectId: this.data.currentProjectId,
        spaceId: this.data.currentSpace.spaceId,
      })
      if (res.success) {
        this.data.groupId = res.result.groupId
      }
    },

    async updateGroup() {
      await updateGroup({
        applianceGroupDtoList: this.data.deviceList.map((device) => ({
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          proType: device.proType,
        })),
        groupId: this.data.groupId,
      })
    },

    retryGroup() {
      // 重新生成列表并设置状态为进行中
      const deviceList = this.data.deviceList.map((device) => ({
        ...device,
        status: 'processing',
      }))
      this.setData({
        deviceList,
        status: 'processing',
      })

      if (!this.data.groupId) {
        this.addGroup()
      } else {
        this.updateGroup()
      }
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

    endGroup() {
      emitter.off('group_device_result_status')
      wx.navigateBack()
    },

    finishBtn() {
      renameGroup({
        groupId: this.data.groupId,
        groupName: this.data.groupName,
      })
      this.endGroup()
    },
  },
})
