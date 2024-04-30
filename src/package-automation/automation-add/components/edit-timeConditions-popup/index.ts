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
    },
    timeId: {
      type: String,
      value: `time${new Date().getTime().toString()}`
    },
    time: {
      type: String,
      value: '10:00',
    },
    periodType: {
      type: String,
      value: '1',
      observer(value) {
        if (value === '1' && this.data.week.split(',').length < 7) {
          this.setData({
            periodType: '4',
          })
        }
      },
    },
    week: {
      type: String,
      observer(value) {
        if (this.data.periodType === '1' && value.split(',').length < 7) {
          this.setData({
            periodType: '4',
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},
  computed: {
    timeValue(data) {
      const value = data.time.split(':').map((item: string) => Number(item))
      return value
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleConfirm() {
      this.triggerEvent('confirm', { timeId: this.data.timeId, time: this.data.time, periodType: this.data.periodType, week: this.data.week })
    },
    timeChange(e: { detail: number[] }) {
      const value = e.detail.map((item) => String(item).padStart(2, '0'))
      this.setData({
        time: value.join(':'),
      })

      this.triggerEvent('change', this.data.time)
    },
    /* 周期设置 start */
    periodChange(e: { detail: string }) {
      this.setData({
        periodType: e.detail,
      })
    },
    weekChange(e: { detail: string }) {
      this.setData({
        week: e.detail,
      })
    },
    /* 周期设置 end */
    blank() {},
  },
})
