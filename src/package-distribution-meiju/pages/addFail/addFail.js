/* eslint-disable @typescript-eslint/no-this-alias,@typescript-eslint/no-var-requires */
const addDeviceMixin = require('../addDevice/pages/assets/js/addDeviceMixin')
const netWordMixin = require('../assets/js/netWordMixin')
import pageBehaviors from '../../../behaviors/pageBehaviors'
import app from '../../common/app'
import paths from '../../utils/paths'

Page({
  behaviors: [addDeviceMixin, netWordMixin, pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '',
    deviceImg: '',
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    errorCode: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    let { deviceName, deviceImg, errorCode } = app.addDeviceInfo
    console.log('addDeviceInfo=====', app.addDeviceInfo)
    this.setData({
      deviceName: deviceName,
      deviceImg: deviceImg,
      errorCode: errorCode,
    })
  },
  retry() {
    const this_ = this
    if (this.retryClickFlag) return
    this.retryClickFlag = true
    let { mode, guideInfo } = app.addDeviceInfo
    console.log('触发了addFail重试埋点')
    if (app.addDeviceInfo.errorCode == '9014200') {
      //自启热点无后确权 重试去确权
      wx.reLaunch({
        //洗衣机去扫码页
        url: paths.addGuide,
        complete() {
          this_.retryClickFLag = false
        },
      })
      return
    }
    if (app.addDeviceInfo.errorCode == '9011301') {
      //触屏绑定失败
      wx.reLaunch({
        //洗衣机去扫码页
        url: app.addDeviceInfo.isWashingMachine ? paths.scanDevice + '?openScan=true' : paths.addGuide,
      })
      return
    }
    if (mode == 5) {
      if (guideInfo) {
        wx.reLaunch({
          url: paths.addGuide,
        })
      } else {
        wx.reLaunch({
          url: paths.scanDevice,
        })
      }
      return
    }
    if (mode == 100) {
      if (guideInfo) {
        wx.reLaunch({
          url: paths.addGuide,
        })
      } else {
        wx.reLaunch({
          url: paths.scanDevice + '?openScan=true',
        })
      }
      return
    }
    wx.navigateTo({
      url: '/package-distribution-meiju/pages/addDevice/pages/linkDevice/linkDevice',
    })
  },
  backToIndex() {
    const this_ = this
    if (this.backClickFlag) return
    this.backClickFlag = true
    wx.reLaunch({
      url: paths.index,
      complete() {
        this_.backClickFLag = false
      },
    })
  },
})
