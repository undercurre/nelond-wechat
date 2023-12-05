import paths from '../../utils/paths'

import { imgBaseUrl } from '../../common/js/api'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    autoHeight: {
      type: String,
      value: '',
    },
    type: {
      type: String,
      value: '',
    },
    btnConent: {
      type: String,
      value: '添加智能设备',
    },
    isCanAddDevice: {
      type: Boolean,
      // value: false,
    },
    isLogon: {
      type: Boolean,
      // value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    centerImg: imgBaseUrl.url + '/mideaServices/images/img_no_book@1x.png',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    checkFun() {
      console.log('this.data.type', this.data.type)
      this.triggerEvent('checkNoDeviceBtn', this.data.type)
    },
    goToOtherChancel() {
      wx.navigateTo({
        url: paths.download + '?fm=addDevice',
      })
    },
  },
})
