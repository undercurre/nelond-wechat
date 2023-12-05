import pageBehavior from '../../behaviors/pageBehaviors'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的初始数据
   */
  data: {
    list: [
      {
        icon: 'upgrade.png',
        title: '固件升级',
        url: '/package-mine/ota/index',
      },
      {
        icon: 'homepage.png',
        title: '默认主页',
        url: '/pages/start/index',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const { url } = e.currentTarget.dataset.value
      wx.navigateTo({
        url,
      })
    },
  },
})
