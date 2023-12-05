import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
      observer(value) {
        this.setData({
          device: value?.data ?? value, // 写入设备数据，兼容独立使用和在drag组件中引用
        })
      },
    },
  },

  computed: {
    desc(data) {
      const { actionStatus, DISCOVERED, actions, defaultAction, saved } = data.device
      const action = actions[defaultAction]
      if (saved === true) {
        const connectText = DISCOVERED === 1 ? '已连接' : '未连接'
        const statusText = actionStatus ? '开启' : '关闭'
        return typeof actionStatus === 'boolean' ? `${action.name}${statusText}` : connectText
      }
      return '未连接'
    },
    bleIcon(data) {
      const iconName = data.device.DISCOVERED === 1 ? 'bleOn' : 'bleOff'
      return `/assets/img/base/${iconName}.png`
    },
    action(data) {
      return data.device.actions[data.device.defaultAction]
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    device: {} as Remoter.DeviceDetail,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      this.triggerEvent('cardTap', this.data.device)
    },
    handleControlTap() {
      this.triggerEvent('controlTap', this.data.device)
    },
    handlePicTap() {
      this.triggerEvent('exec', this.data.device)
    },
  },
})
