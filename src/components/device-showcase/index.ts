import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
      value: {},
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    ripple: false,
  },

  computed: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      console.log(this.data.deviceInfo)
      this.setData({
        ripple: true,
      })
      wx.navigateTo({
        url: this.data.deviceInfo.path,
      })
    },
  },
})
