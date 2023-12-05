import { getRect } from '../../utils/index'

Component({
  externalClasses: ['custom-class'],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    // disabled: Boolean,

    max: {
      type: Number,
      value: 100,
    },
    min: {
      type: Number,
      value: 0,
    },
    step: {
      type: Number,
      value: 1,
    },
    value: {
      type: Number,
      value: 0,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    windowWidth: 0,
    _isWxsHandle: false,
    leftCurtainStyle: '',
    rightCurtainStyle: '',
  },

  lifetimes: {
    attached() {},
    ready() {
      const { windowWidth } = wx.getSystemInfoSync()
      this.setData({
        windowWidth,
      })
    },
    detached() {},
  },
  observers: {
    value: function (newValue) {
      setTimeout(async () => {
        const { width } = await getRect(this, '.curtain-container')

        this.setData({
          leftCurtainStyle: `transform:translateX(-${((newValue / 100) * (width - width / 10)) / 2}px)${
            this.data._isWxsHandle ? '' : ' !important'
          };`,
          rightCurtainStyle: `transform:translateX(${((newValue / 100) * (width - width / 10)) / 2}px)${
            this.data._isWxsHandle ? '' : ' !important'
          };`,
        })
      }, 100)
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    valueChange(e: { value: number }) {
      this.triggerEvent('change', e.value)
      this.setData({
        value: e.value,
      })
    },
    handleEnd(e: { value: number }) {
      this.setData({
        value: e.value,
      })
      this.triggerEvent('slideEnd', e.value)
      //释放标志，允许通过外部value重新计算slider-bar宽度
      setTimeout(() => {
        this.setData({ _isWxsHandle: false })
      }, 200)
    },
    touchstart(e: { value: number }) {
      this.setData({
        value: e.value,
        leftCurtainStyle: '',
        rightCurtainStyle: '',
        _isWxsHandle: true,
      })
      this.triggerEvent('slideStart', e.value)
    },
  },
})
