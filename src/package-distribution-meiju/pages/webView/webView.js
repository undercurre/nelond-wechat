import { hasKey } from 'm-utilsdk/index'
import { aesEncryptUrl, getFullPageUrl } from '../../utils/util.js'
import app from '../../common/app'
import { getWxSystemInfo } from '../../utils/wx/index.js'

Page({
  behaviors: [],
  /**
   * 页面的初始数据
   */
  data: {
    pageUrl: '',
    options: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.setData({
      options: options,
    })
    const webViewUrl = decodeURIComponent(this.getWebViewUrl())
    console.log(webViewUrl, 'webViewUrl')
    if (webViewUrl.indexOf('loginState') > -1 || options.loginState) {
      aesEncryptUrl('Y', webViewUrl).then((data) => {
        if (data) {
          console.log('webViewUrl', data)
          this.setData({
            pageUrl: data,
          })
          console.log('新webViewUrl-last-pageUrl', this.data.pageUrl)
        }
      })
    } else {
      this.setData({
        pageUrl: webViewUrl,
      })
      console.log('新webViewUrl-else-pageUrl', this.data.pageUrl, typeof this.data.pageUrl)
    }
    const pageTitle = options && options.pageTitle
    const res = await this.checkSystem()
    if (res) {
      pageTitle && this.setNavBarTitle(pageTitle)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('新webViewUrl---onshow---webViewFlag', app.globalData.webViewFlag)
    if (app.globalData.webViewFlag) {
      let page = getCurrentPages()
      app.globalData.webViewFlag = false
      if (page.length > 1) {
        let lastPath = '/' + getFullPageUrl('prev')
        wx.reLaunch({
          url: lastPath,
        })
      } else {
        wx.reLaunch({
          url: '/pages/index/index',
        })
      }
    }
  },

  getWebViewUrl() {
    const { options } = this.data
    return hasKey(options, 'webViewUrl') ? options.webViewUrl : ''
  },
  setNavBarTitle(title) {
    wx.setNavigationBarTitle({
      title,
    })
  },
  async checkSystem() {
    const systemInfo = await getWxSystemInfo()
    const platform = systemInfo && systemInfo.platform
    return platform.indexOf('ios') > -1
  },
})
