import pageBehavior from '../../../behaviors/pageBehaviors'
import meta from '../../../meta'
import { DOC_List } from '../../../config/index'
import { showRemoteDoc, getVersion, getEnvVersion } from '../../../utils/index'

let debugTimeId = 0

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
    list: DOC_List,
    envVersion: getEnvVersion(), // 当前小程序版本，体验版or 正式环境
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

      const version = getVersion()

      this.setData({
        version: version,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const { url } = e.currentTarget.dataset

      showRemoteDoc(url)
    },

    titlePress() {
      console.log('titlePress triggered, ver: ', this.data.version || this.data.releaseTime)
      this.setData({
        showVersion: !this.data.showVersion,
      })
    },

    touchVersionStart() {
      // 长按5s进入工程模式功能
      debugTimeId = setTimeout(() => {
        wx.navigateTo({
          url: '/package-about/pages/engineering-mode/index',
        })
      }, 5000)
    },

    touchVersionEnd() {
      clearTimeout(debugTimeId)
    },
  },
})
