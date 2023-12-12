import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { homeBinding, homeStore, roomBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { delGroup, queryGroup, renameGroup, updateGroup } from '../../../apis/index'
import { proName } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { emitter } from '../../../utils/index'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, homeBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    spaceId: '',
    spaceName: '',
    groupId: '',
    deviceName: '',
    showEditNamePopup: false,
    showAddLightPopup: false,
    deviceInfo: {} as Device.DeviceItem,
  },

  computed: {
    prodType(data) {
      if (data.deviceInfo.proType) {
        return proName[data.deviceInfo.proType]
      }
      return ''
    },
    canEditDevice(data) {
      return data.isCreator || data.isAdmin
    },
    /**
     * @description 可被添加到灯组的单灯列表
     * 不能已在灯组中
     */
    lightListToAdd() {
      return true
      // const { deviceFlattenList, lightsInGroup } = deviceStore
      // return deviceFlattenList.filter(
      //   (device) =>
      //     device.proType === PRO_TYPE.light && device.deviceType !== 4 && !lightsInGroup.includes(device.deviceId),
      // )
    },
    canAddDevice(data) {
      return data.canEditDevice && data.lightListToAdd?.length
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ deviceId }: { deviceId: string }) {
      this.setData({
        groupId: deviceId,
      })
    },

    onShow() {
      this.queryGroupInfo()
    },

    handleDeviceNameEditPopup() {
      if (!this.data.canEditDevice) return
      this.setData({
        showEditNamePopup: true,
      })
    },
    handleDeviceNameEditCancel() {
      this.setData({
        showEditNamePopup: false,
      })
    },
    handleAddLightPopup() {
      if (!this.data.canEditDevice) return
      this.setData({
        showAddLightPopup: true,
      })
    },
    handleAddLightCancel() {
      this.setData({
        showAddLightPopup: false,
      })
    },
    async handleDeviceNameEditConfirm(e: { detail: string }) {
      if (!e.detail) {
        Toast('灯组名称不能为空')
        return
      }

      this.setData({
        showEditNamePopup: false,
        deviceName: e.detail,
      })
      const res = await renameGroup({
        groupId: this.data.groupId,
        groupName: this.data.deviceName,
      })
      if (res.success) {
        this.queryGroupInfo()
        emitter.emit('deviceEdit')
      }
    },
    handleGroupDelete() {
      if (!this.data.canEditDevice) return
      Dialog.confirm({
        title: '确定解散该灯组？',
      })
        .then(async () => {
          const res = await delGroup({
            groupId: this.data.groupId,
          })
          if (res.success) {
            Toast('删除成功')
            homeStore.updateRoomCardList()
            emitter.emit('deviceEdit')
            emitter.emit('homeInfoEdit')
            wx.navigateBack()
          } else {
            Toast('删除失败')
          }
        })
        .catch(() => {})
    },
    toDeleteLight(e: { currentTarget: { dataset: { deviceId: string } } }) {
      const { groupDeviceList = [] } = this.data.deviceInfo

      // 如果只剩下一个灯，刚直接解散灯组
      if (groupDeviceList.length < 2) {
        this.handleGroupDelete()
        return
      }

      Dialog.confirm({
        title: '确定将该灯从当前灯组移除？',
      })
        .then(async () => {
          const index = groupDeviceList.findIndex((device) => device.deviceId === e.currentTarget.dataset.deviceId)
          groupDeviceList.splice(index, 1)
          const res = await updateGroup({
            applianceGroupDtoList: groupDeviceList,
            groupId: this.data.groupId,
          })

          if (res.success) {
            Toast('删除成功')
            homeStore.updateRoomCardList()
            this.queryGroupInfo()
            emitter.emit('deviceEdit')
            emitter.emit('homeInfoEdit')
          } else {
            Toast('删除失败')
          }
        })
        .catch(() => {})
    },
    // 查询分组详情
    async queryGroupInfo() {
      const res = await queryGroup({ groupId: this.data.groupId })
      if (res.success) {
        this.setData({
          deviceInfo: res.result,
          deviceName: res.result.groupName,
          spaceId: res.result.spaceId,
          spaceName: res.result.spaceName,
        })
      }
    },
    // 更新分组（增加灯）
    addLightToGroup(e: { detail: Device.DeviceItem[] }) {
      const { groupDeviceList = [] } = this.data.deviceInfo

      wx.navigateTo({
        url: '/package-room-control/group/index',
        success: (res) => {
          res.eventChannel.emit('createGroup', {
            lightList: [...groupDeviceList, ...e.detail].map((device) => device.deviceId),
            groupId: this.data.groupId,
            groupName: this.data.deviceName,
          })
        },
      })

      this.setData({
        showAddLightPopup: false,
      })
    },
  },
})
