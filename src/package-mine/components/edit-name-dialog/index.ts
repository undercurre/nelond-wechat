Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 输入框默认值
    value: {
      type: String,
      value: '',
      observer(v) {
        this.setData({
          innerValue: v,
        })
      },
    },
    // 对话框标题
    title: {
      type: String,
      value: '',
    },
    // 是否显示
    show: {
      type: Boolean,
      value: false,
      observer(s) {
        if (s) {
          this.setData({
            innerValue: this.data.value,
          })
        }
      },
    },
    // 输入框占位文本
    placeholder: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    innerValue: '',
    // 拦截确认关闭操作
    beforeClose() {
      return
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    changeName(e: { detail: string }) {
      this.setData({
        innerValue: e.detail,
      })
    },
    onClose() {
      this.setData({
        show: false,
      })
    },

    onConfirm() {
      this.triggerEvent('confirm', this.data.innerValue)
    },
  },
})
