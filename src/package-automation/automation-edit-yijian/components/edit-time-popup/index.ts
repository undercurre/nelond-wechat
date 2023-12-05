import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
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
    type: {
      type: String,
      value: 'start',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    title(data) {
      return data.type === 'start' ? '开始时间' : '结束时间'
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm(e: { detail: number[] }) {
      this.triggerEvent('confirm', e.detail)
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    timeChange(e: { detail: number[] }) {
      this.triggerEvent('change', e.detail)
    },
    blank() {},
  },
})
