import { baseImgApi } from '../../../../common/js/api'

import app from '../../../../common/app'
const loactionImgUrl = baseImgApi.url
Page({
  /**
   * 页面的初始数据
   */
  data: {
    loactionImgUrl: loactionImgUrl,
    loactionImgList: {
      searchIconImg: '',
    },
    system: '',
    permissionTypeList: {},
    tipTextList: {
      iOS: {
        bluetoothEnabled: {
          title: '打开手机蓝牙',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_01_1.png',
              text: '1.进入快捷设置栏，打开蓝牙',
            },
          ],
        },
        bluetoothAuthorized: {
          title: '允许微信使用蓝牙',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_02_1.png',
              text: '1.点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_02_2.png',
              text: '2.找到并点选【微信】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_02_3.png',
              text: '3.开启【蓝牙】',
            },
          ],
        },

        scopeBluetooth: {
          title: '允许小程序使用蓝牙',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_03_1.png',
              text: '1.点击右上角【…】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_03_2.png',
              text: '2.点击【设置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_03_3.png',
              text: '3.点击【蓝牙】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/blue/ios_lanya_03_4.png',
              text: '4.设为【仅在使用小程序期间】',
            },
          ],
        },
      },
      Android: {
        bluetoothEnabled: {
          title: '进入快捷设置栏，打开蓝牙',
          stepes: [
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_01_1.png',
              text: '1.进入快捷设置栏，打开蓝牙',
            },
          ],
        },
        bluetoothAuthorized: {
          title: '允许微信使用蓝牙',
          stepes: [
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_02_1.png',
              text: '1.点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_02_2.png',
              text: '2.找到并点选【隐私和权限】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/Android_lanya_02_3.png',
              text: '3.点击【权限管理】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_02_4.png',
              text: '4.点击【蓝牙】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_02_5.png',
              text: '5.打开【微信】开关',
            },
          ],
        },

        scopeBluetooth: {
          title: '允许小程序使用蓝牙',
          stepes: [
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_03_1.png',
              text: '1.点击右上角【…】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_03_2.png',
              text: '2.点击【设置】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_03_3.png',
              text: '3.点击【蓝牙】',
            },
            {
              img: loactionImgUrl + '/permission/Android/blue/android_lanya_03_4.png',
              text: '4.设为【仅在使用小程序期间】',
            },
          ],
        },
      },
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('options', options)
    this.setData({
      system: app.globalData.systemInfo.system.includes('Android') ? 'Android' : 'iOS',
    })
    let loactionTextList = []
    if (options.permissionTypeList) {
      // console.log('[permision Type List]', JSON.parse(options.permissionTypeList))
      let permissionTypeList = JSON.parse(options.permissionTypeList || null) || {
        bluetoothEnabled: false,
        bluetoothAuthorized: false,
        scopeBluetooth: false,
      }
      let { system, tipTextList } = this.data
      if (system == 'iOS') {
        if (!permissionTypeList.bluetoothEnabled) {
          //未开蓝牙开关
          loactionTextList.push(tipTextList.iOS.bluetoothEnabled)
        }
        if (!permissionTypeList.bluetoothAuthorized) {
          //手机未授权蓝牙
          loactionTextList.push(tipTextList.iOS.bluetoothAuthorized)
        }
        if (!permissionTypeList.scopeBluetooth) {
          //未授权微信使用蓝牙
          loactionTextList.push(tipTextList.iOS.scopeBluetooth)
        }
      }
      if (system == 'Android') {
        if (!permissionTypeList.bluetoothEnabled) {
          //未开蓝牙开关
          loactionTextList.push(tipTextList.Android.bluetoothEnabled)
        }
        if (!permissionTypeList.bluetoothAuthorized) {
          //手机未授权蓝牙
          loactionTextList.push(tipTextList.Android.bluetoothAuthorized)
        }

        if (!permissionTypeList.scopeBluetooth) {
          //未授权微信定位
          loactionTextList.push(tipTextList.Android.scopeBluetooth)
        }
      }
    }
    this.setData({
      loactionTextList: loactionTextList,
    })
    console.log('[loactionTextList]', loactionTextList)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  // /**
  //  * 用户点击右上角分享
  //  */
  // onShareAppMessage() {

  // }
})
