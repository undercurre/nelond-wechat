import pageBehavior from '../../../behaviors/pageBehaviors'
import { strUtil } from '../../../utils/index'
import { helpList } from '../help-doc'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的初始数据
   */
  data: {
    helpList,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const item = e.currentTarget.dataset.value
      const helpPage = '/package-mine/help/webview/index'
      const url = strUtil.getUrlWithParams(helpPage, item)
      wx.navigateTo({
        url,
      })
    },
  },
})
