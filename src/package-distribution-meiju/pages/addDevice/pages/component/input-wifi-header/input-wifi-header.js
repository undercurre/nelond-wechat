/* eslint-disable @typescript-eslint/no-this-alias */
import { baseImgApi } from '../../../../../common/js/api'
Component({
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    // isNavCancel:{

    // },
    isNavCancel: {
      type: Boolean,
      value: false,
    },
    buttonColor: {
      type: String,
      value: 'black',
    },
  },
  data: {
    // 这里是一些组件内部数据
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    baseImgUrl: baseImgApi.url,
  },
  methods: {
    clickCancel() {
      this.triggerEvent('clickCancel')
    },
    back() {
      const this_ = this
      if (this.clickFLag) return
      this.clickFLag = true
      if (getCurrentPages().length < 2) {
        wx.reLaunch({
          url: '/pages/index/index',
          complete() {
            this_.clickFLag = false
          },
        })
      } else {
        wx.navigateBack({
          delta: 1,
          complete() {
            this_.clickFLag = false
          },
        })
      }
    },
  },
})
