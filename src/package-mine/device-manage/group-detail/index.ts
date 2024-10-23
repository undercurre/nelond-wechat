import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { deviceStore, projectBinding, projectStore, spaceBinding, spaceStore, userBinding } from '../../../store/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { delGroup, queryGroup, renameGroup, updateGroup } from '../../../apis/index'
import { PRO_TYPE, proName } from '../../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { emitter, Logger, storage } from '../../../utils/index'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [spaceBinding, projectBinding, userBinding] }), pageBehavior],
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
    scrollHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      (storage.get('navigationBarHeight') as number) -
      250, // 滚动列表前内容
  },

  computed: {
    prodType(data) {
      if (data.deviceInfo.proType) {
        return proName[data.deviceInfo.proType]
      }
      return ''
    },
    canEditDevice(data) {
      return data.isManager
    },
    /**
     * @description 可被添加到灯组的单灯列表
     * 不能已在灯组中
     */
    lightListToAdd(data) {
      const { groupDeviceList } = data.deviceInfo
      const { deviceFlattenList } = deviceStore
      return deviceFlattenList.filter(
        (device) =>
          device.proType === PRO_TYPE.light &&
          device.deviceType !== 4 &&
          !groupDeviceList?.map((d) => d.deviceId).includes(device.deviceId),
      )
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
            projectStore.updateSpaceCardList()
            emitter.emit('deviceEdit')
            emitter.emit('projectInfoEdit')
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
            projectStore.updateSpaceCardList()
            this.queryGroupInfo()
            emitter.emit('deviceEdit')
            emitter.emit('projectInfoEdit')
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
        Logger.log('deviceStore.allDeviceMap', deviceStore.allDeviceMap)
        res.result.groupDeviceList = res.result.groupDeviceList?.map((item) => ({
          ...item,
          spaceName: spaceStore.getSpaceClearNameById(deviceStore.allDeviceMap[item.deviceId].spaceId),
        }))
        this.setData({
          deviceInfo: res.result,
          deviceName: res.result.groupName,
          spaceId: res.result.spaceId,
          spaceName: spaceStore.getSpaceClearNameById(res.result.spaceId),
        })
      }
    },
    // 更新分组（增加灯）
    addLightToGroup(e: { detail: Device.DeviceItem[] }) {
      const { groupDeviceList = [] } = this.data.deviceInfo

      wx.navigateTo({
        url: '/package-space-control/group/index',
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
