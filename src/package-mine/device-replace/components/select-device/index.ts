import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { spaceBinding, deviceBinding, spaceStore } from '../../../../store/index'
import { PRODUCT_ID, SCREEN_PID } from '../../../../config/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [spaceBinding, deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(show) {
        if (show) {
          this.setData({
            spaceId: spaceStore.currentSpace.spaceId,
            spaceName: spaceStore.currentSpaceNameFull ?? '全部',
          })
        }
      },
    },
    choosingNew: {
      type: Boolean,
      value: false,
    },
    list: {
      type: Array,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // allDeviceList: Array<Device.DeviceItem>(),
    checkedDevice: {},
    spaceId: '0',
    spaceName: '',
    showSpaceSelectPopup: false,
  },

  computed: {
    popupTitle(data) {
      const { choosingNew } = data
      return choosingNew ? '选择新设备' : '选择被替换设备'
    },

    /**
     * @description 所有待选设备列表
     * 如正在选择新设备，则传入 deviceList，即使用指定列表；否则显示所有设备
     * ! 不按空间筛选
     */
    // allDeviceList(data) {
    //   const list = data.choosingNew ? data.list : data.allDeviceList
    //   return list.filter((d: Device.DeviceItem) => d.deviceType === 2 || d.deviceType === 1)
    // },

    /**
     * @description 显示待选设备列表
     * 如正在选择新设备，则传入 deviceList，即使用指定列表；否则显示所有设备
     * isCurrentSpace 按空间筛选
     */
    showDeviceList(data) {
      const list = data.choosingNew ? data.list : data.allDeviceList

      return list?.filter((device: Device.DeviceItem) => {
        const isScreen = SCREEN_PID.includes(device.productId)
        const canDevice = device.deviceType === 2 || (device.deviceType === 1 && device.productId !== PRODUCT_ID.host)
        const isCurrentSpace = data.spaceId === '0' ? true : device.spaceId === data.spaceId
        return canDevice && isCurrentSpace && !isScreen
      })
    },
  },

  lifetimes: {
    async ready() {
      await spaceBinding.store.updateSpaceList()

      deviceBinding.store.updateAllDeviceList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(event: WechatMiniprogram.CustomEvent) {
      console.log('handleCardTap', event.detail)
      this.setData({ checkedDevice: event.detail })
    },

    handleSpaceSelectConfirm(e: { detail: Space.allSpace[] }) {
      if (!e.detail?.length) {
        return
      }
      const spaceInfo = e.detail[e.detail.length - 1]
      this.setData({
        spaceId: spaceInfo.spaceId,
        spaceName: spaceStore.getSpaceFullName(spaceInfo),
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },

    handleConfirm() {
      this.triggerEvent('confirm', this.data.checkedDevice)
    },

    handleSpaceSelect() {
      this.setData({ showSpaceSelectPopup: true })
    },
  },
})
