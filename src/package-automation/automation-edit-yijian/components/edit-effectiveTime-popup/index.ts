import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    startTime: {
      type: String,
      value: '08:00',
    },
    endTime: {
      type: String,
      value: '10:00',
    },
    periodType: {
      type: String,
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
  data: {
    showTimePopup: false, //展示场景生效时间段开始结束时间设置弹窗
    timeType: 'start', //start设置开始时间 end设置结束时间
    _timeValue: [0, 0],
  },
  computed: {
    timeValue(data) {
      if (data.timeType === 'start') {
        const value = data.startTime.split(':').map((item: string) => Number(item))
        return value
      } else {
        const value = data.endTime.split(':').map((item: string) => Number(item))
        return value
      }
    },
    endTimeDesc(data) {
      const startTimeHour = parseInt(data.startTime.substring(0, 2))
      const endTimeHour = parseInt(data.endTime.substring(0, 2))
      const startTimeMin = parseInt(data.startTime.substring(data.startTime.indexOf(':') + 1))
      const endTimeMin = parseInt(data.endTime.substring(data.endTime.indexOf(':') + 1))

      if (endTimeHour < startTimeHour) {
        return `次日${data.endTime}`
      } else if (endTimeHour === startTimeHour) {
        if (endTimeMin <= startTimeMin) {
          return `次日${data.endTime}`
        } else {
          return data.endTime
        }
      } else {
        return data.endTime
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /* 弹窗自身方法 start */
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', {
        startTime: this.data.startTime,
        endTime: this.data.endTime,
        periodType: this.data.periodType,
        week: this.data.week,
      })
    },
    /* 弹窗自身方法 end */
    /* 设置场景生效时间段开始结束时间 start */
    handleTimeShow(e: { currentTarget: { dataset: { type: string } } }) {
      console.log(e)

      this.setData({
        showTimePopup: true,
        timeType: e.currentTarget.dataset.type,
      })
    },
    handleTimeChange(e: { detail: number[] }) {
      this.setData({
        _timeValue: e.detail,
      })
    },
    handleTimeClose() {
      this.setData({
        showTimePopup: false,
      })
    },
    handleTimeConfirm() {
      const value = this.data._timeValue.map((item) => String(item).padStart(2, '0'))
      if (this.data.timeType === 'start') {
        this.setData({
          startTime: value.join(':'),
        })
      } else {
        this.setData({
          endTime: value.join(':'),
        })
      }
      this.setData({
        showTimePopup: false,
      })
    },
    /* 设置场景生效时间段开始结束时间 end */
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
