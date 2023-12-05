import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  properties: {
    icon: {
      type: String,
      value: '',
    },
    iconActive: {
      type: String,
      value: '',
    },
    text: {
      type: String,
      value: '',
    },
    textColor: {
      type: String,
      value: '',
    },
    textWidth: {
      type: String,
      value: '80rpx',
    },
    // icon-wrapper 的长宽，rpx 为单位
    size: {
      type: Number,
      value: 48,
    },
    btnStyle: {
      type: String,
      value: '',
    },
    isOn: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    wrapperStyle(data) {
      const { size } = data
      return `width: ${size}rpx; height: ${size}rpx;`
    },
  },

  methods: {
    handleTouchStart() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
    },
    handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchend', e.detail)
    },
  },
})
