Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: Number,
      observer(value) {
        if (value >= 30 && value <= 120) {
          this.setData({
            currentIndex: Math.round((value - 30) / 10),
          })
        }
      },
    },
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentIndex: -1,
    columns: Array.from({ length: 10 }, (_, i) => `${i * 10 + 30}cm`),
    _newIndex: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChange(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.detail
      this.data._newIndex = index
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      if (this.data._newIndex !== this.data.currentIndex) {
        this.triggerEvent('confirm', this.data._newIndex)
      }
    },
  },
})
