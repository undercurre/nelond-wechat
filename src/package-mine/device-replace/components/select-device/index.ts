import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding } from '../../../../store/index'
import { SCREEN_PID } from '../../../../config/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
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
    allDeviceList: Array<Device.DeviceItem>(),
    checkedDevice: {},
    roomSelect: '0',
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
    allDeviceList(data) {
      const list = data.choosingNew ? data.list : data.allDeviceList
      return list.filter((d) => d.deviceType === 2)
    },

    /**
     * @description 显示待选设备列表
     * 如正在选择新设备，则传入 deviceList，即使用指定列表；否则显示所有设备
     * isCurrentRoom 按空间筛选
     */
    showDeviceList(data) {
      const list = data.choosingNew ? data.list : data.allDeviceList

      return list.filter((device) => {
        const isScreen = SCREEN_PID.includes(device.productId)
        const isSubdevice = device.deviceType === 2
        const isCurrentRoom = data.roomSelect === '0' ? true : device.spaceId === data.roomSelect
        return isSubdevice && isCurrentRoom && !isScreen
      })
    },
  },

  lifetimes: {
    async ready() {
      await roomBinding.store.updateSpaceList()

      deviceBinding.store.updateallDeviceList()
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

    handleRoomSelect(event: { detail: string }) {
      this.setData({ roomSelect: event.detail })
    },

    handleClose() {
      this.triggerEvent('close')
    },

    handleConfirm() {
      this.triggerEvent('confirm', this.data.checkedDevice)
    },
  },
})
