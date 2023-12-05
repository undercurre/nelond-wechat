/* eslint-disable @typescript-eslint/no-var-requires */
import app from '../../../../common/app'
const addDeviceMixin = require('../assets/js/addDeviceMixin')
import { creatDeviceSessionId } from '../../../../utils/util'
import paths from '../../../../utils/paths'
Page({
  behaviors: [addDeviceMixin],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '空调',
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    let { deviceName } = app.addDeviceInfo
    this.setData({
      deviceName: deviceName,
    })
  },
  //跳转反馈
  feedback() {
    wx.navigateTo({
      url: paths.feedback,
    })
  },
  getAddDeviceInfo() {
    if (!wx.getStorageSync('addDeviceInfo')) return
    return wx.getStorageSync('addDeviceInfo')
  },
  retry() {
    app.globalData.deviceSessionId = creatDeviceSessionId(app.globalData.userData.uid)
    wx.navigateTo({
      url: '/package-distribution-meiju/pages/addDevice/pages/addGuide/addGuide',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
