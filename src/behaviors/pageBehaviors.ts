import Toast from '@vant/weapp/toast/toast'
import { BehaviorWithComputed } from 'miniprogram-computed'
import { ossDomain } from '../config/index'

export default BehaviorWithComputed({
  methods: {
    /**
     * 返回方法
     */
    goBack: function () {
      const pages = getCurrentPages()

      if (pages.length <= 1) {
        this.goBackHome()
      } else {
        wx.navigateBack()
      }
    },
    /**
     * 返回首页
     */
    goBackHome: function () {
      wx.switchTab({
        url: `/pages/index/index`,
      })
    },
    /**
     * 跳转到
     */
    goTo(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({ url: e.currentTarget.dataset.url })
    },
    /**
     * 跳转到，需要广域网连接使用
     */
    async goToWhenConnected(e: WechatMiniprogram.TouchEvent) {
      const res = await wx.getNetworkType()
      if (res.networkType === 'none') {
        Toast('当前无法连接网络\n请检查网络设置')
        return
      }

      wx.navigateTo({ url: e.currentTarget.dataset.url })
    },
    /**
     * 全局分享小程序
     */
    onShareAppMessage() {
      return {
        title: '欢迎使用美的商照',
        path: '/pages/index/index',
        imageUrl: `${ossDomain}/homlux/welcome.png`,
      }
    },
    // onShareTimeline() {
    //   return {
    //     title: '欢迎使用美的商照',
    //     path: '/pages/index/index',
    //   }
    // },
  },
  computed: {},
})
