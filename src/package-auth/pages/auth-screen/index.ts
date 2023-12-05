import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { authQrcode } from '../../../apis/index'
import { userStore } from '../../../store/index'
import { getCurrentPageParams } from '../../../utils/index'
import cacheData from '../../../package-distribution/common/cacheData'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    mobile: '',
  },

  lifetimes: {
    ready() {
      this.setData({
        mobile: userStore.userInfo.mobilePhone.substring(0, 3) + '****' + userStore.userInfo.mobilePhone.substr(7),
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async auth() {
      const pageParams = getCurrentPageParams()
      const authRes = await authQrcode(pageParams.code)

      if (authRes.success) {
        Toast({
          message: '授权成功',
          onClose: () => {
            wx.reLaunch({
              url: cacheData.pageEntry,
            })
          },
        })
      } else {
        Toast('授权失败')
      }
    },
  },
})
