Component({
  /**
   * 组件的属性列表
   */
  properties: {
    size: {
      type: Number,
      value: 26,
    },
    show: {
      type: Boolean,
      value: true,
    },
    //type value  info, warn, danger
    type: {
      type: String,
      value: 'info',
      observer: function (newVal) {
        let type = newVal,
          icon = '',
          closeIcon = ''
        switch (type) {
          case 'warn':
            icon = '../assets/icon/icon_warn_yellow.svg'
            closeIcon = '../assets/icon/icon_close_yellow.svg'
            break
          case 'danger':
            icon = '../assets/icon/icon_warn_red.svg'
            closeIcon = '../assets/icon/icon_close_red.svg'
            break
          default:
            icon = '../assets/icon/icon_close_black.svg'
            closeIcon = '../assets/icon/icon_close_black.svg'
            break
        }
        this.setData({
          noticeTypeImg: icon,
          closeIcon,
        })
      },
    },
    notice: {
      type: String,
      value: '',
    },
    mode: {
      type: String,
      value: '',
    },
    btnText: {
      type: String,
      value: '',
    },
    //  0.1.14新需求
    // center: {
    //   type: Boolean,
    //   value: false
    // },
    //  0.1.20新需求, 提醒内容两行以上
    // lines: {
    //   type: [Number, String],
    //   value: 2
    // },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 默认数据
    bgColor: '#EEEEEE',
    color: '#333333',
    noticeTypeImg: '../assets/icon/icon_warn_black.svg',
    closeIcon: '../assets/icon/icon_close_black.svg',
  },

  observers: {
    type: function (newVal, oldVal) {
      let type = newVal
      switch (type) {
        case 'warn':
          this.setData({
            bgColor: 'rgba(255,170,16,0.10)',
            color: '#FFAA10',
          })
          break
        case 'danger':
          this.setData({
            bgColor: 'rgba(255,59,48,0.10)',
            color: '#FF3B30',
          })
          break
        default:
          this.setData({
            bgColor: '#EEEEEE',
            color: '#333333',
          })
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    noticeBarClicked(e) {
      console.log('noticeBarClicked clicked...e', e)
      let obj = e.currentTarget.dataset
      this.triggerEvent('onNoticeBarClicked', obj, {})
    },
    btnClicked(e) {
      console.log('btnClicked clicked...e', e)
      let obj = e.currentTarget.dataset
      this.triggerEvent('onBtnClicked', obj, {})
    },

    closeIconClicked(e) {
      console.log('closeIconClicked clicked...e', e)
      let obj = e.currentTarget.dataset
      this.triggerEvent('onCloseIconClicked', obj, {})
    },
  },
})
