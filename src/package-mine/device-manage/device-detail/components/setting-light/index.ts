Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
    canEditDevice: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    lightUpDefaultValue: 0,
    dimmingDefaultValue: 0,
    showPopup: false,
    title: '渐亮时长' as '渐亮时长' | '渐暗时长',
    pickerColumns: Array.from({ length: 10 }).map((_, i) => (i + 1) * 0.5),
    value: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handlePopupShow(e: { currentTarget: { dataset: { title: '渐亮时长' | '渐暗时长' } } }) {
      if (!this.data.canEditDevice) return
      if (!this.data.deviceInfo.onLineStatus) {
        return
      }
      this.setData({
        title: e.currentTarget.dataset.title,
        showPopup: true,
        value:
          e.currentTarget.dataset.title === '渐亮时长' ? this.data.lightUpDefaultValue : this.data.dimmingDefaultValue,
      })
    },
    handleClose() {
      this.setData({
        showPopup: false,
        value: this.data.title === '渐亮时长' ? this.data.lightUpDefaultValue : this.data.dimmingDefaultValue,
      })
    },
    handleConfirm() {
      if (this.data.title === '渐亮时长') {
        this.setData({
          showPopup: false,
          lightUpDefaultValue: this.data.value,
        })
      } else {
        this.setData({
          showPopup: false,
          dimmingDefaultValue: this.data.value,
        })
      }
    },
    handlePickerChange(e: { detail: { index: number } }) {
      this.data.value = e.detail.index
    },
  },
})
