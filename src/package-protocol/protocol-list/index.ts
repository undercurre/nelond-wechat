import pageBehavior from '../../behaviors/pageBehaviors'
import meta from '../../meta'

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
    list: [
      {
        title: '美的商照隐私协议',
        value: 'privacyPolicy',
      },
      {
        title: '美的商照权限列表',
        value: 'authList',
      },
      {
        title: '软件许可及用户服务协议',
        value: 'userService',
      },
      {
        title: '已收集个人信息清单',
        value: 'userInfoList',
      },
    ],

    envVersion: 'release', // 当前小程序版本，体验版or 正式环境
    version: '', // 生产环境版本号
    releaseTime: '', // 版本上传时间
    showVersion: false, // 是否显示版本号
  },

  lifetimes: {
    ready() {
      if (meta?.datetime) {
        this.setData({
          releaseTime: meta.datetime,
        })
      }
      const info = wx.getAccountInfoSync()

      this.setData({
        envVersion: info.miniProgram.envVersion,
        version: info.miniProgram.version,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-protocol/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },

    titlePress() {
      console.log('titlePress triggered, ver: ', this.data.version || this.data.releaseTime)
      this.setData({
        showVersion: !this.data.showVersion,
      })
    },
  },
})
