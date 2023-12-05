// @ts-nocheck
const minutes = []
const seconds = []

for (let i = 0; i <= 10; i++) {
  minutes.push(String(i).padStart(2, '0'))
}

for (let i = 0; i <= 59; i++) {
  seconds.push(String(i).padStart(2, '0'))
}

Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({
            icon: this.data.value,
          })
        }
      },
    },
    value: {
      type: Array,
      value: [0, 0],
    },
    showCancel: {
      type: Boolean,
      value: true,
    },
    cancelText: {
      type: String,
      value: '上一步',
    },
    showConfirm: {
      type: Boolean,
      value: true,
    },
    confirmText: {
      type: String,
      value: '确定',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    minutes,
    seconds,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.value)
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    timeChange(e: { detail: number[] }) {
      this.setData({
        value: e.detail,
      })
    },
    blank() {},
  },
})
