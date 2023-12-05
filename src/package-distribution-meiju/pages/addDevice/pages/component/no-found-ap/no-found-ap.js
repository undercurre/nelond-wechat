/* eslint-disable @typescript-eslint/no-this-alias */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addDeviceMixin = require('../../assets/js/addDeviceMixin')
import { baseImgApi, imgBaseUrl } from '../../../../../common/js/api'
import { imgesList } from '../../../../assets/js/shareImg.js'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const brandStyle = require('../../../../assets/js/brand')
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand

Component({
  externalClasses: [
    'no-found-frame',
    'no-found-step',
    'wifiView',
    'no-found-btn',
    'no-found-title-text',
    'wifiImg',
    'searching-text-no-found',
    'searching-img',
    'step-text',
  ],
  behaviors: [addDeviceMixin],
  properties: {
    deviceName: {
      type: String,
      value: '空调',
    },
    wifi: {
      type: String,
      value: '',
    },
    system: String,
    closeImg: {
      type: String,
      value: '',
    },
    noFoundApDiscover: {
      type: String,
      value: imgUrl + imgesList['noFoundApDiscover'],
    },
  },
  data: {
    flag: false,
    wrapAnimate: 'wrapAnimate',
    bgOpacity: 0,
    frameAnimate: 'frameAnimate',
    isIphoneX: getApp().globalData.isIphoneX,
    baseImgUrl: baseImgApi.url,
    isSearching: true, // 是否正在寻找WiFi
    ifFoundWiFi: false, // 是否找到设备WiFi
    searchingCountdown: 5, // 寻找WiFi倒计时
    android_checkwifi: imgUrl + imgesList['android_checkwifi'],
    img_wifi: imgUrl + imgesList['img_wifi'],
    noFoundApSwitch: imgUrl + imgesList['noFoundApSwitch'],
    brand: getApp().globalData.brand,
  },
  lifetimes: {
    attached() {
      // 在组件实例进入页面节点树时执行
      console.log('no-found-ap properties', this.properties)
    },
  },
  methods: {
    showFrame() {
      this.setData({
        flag: true,
        wrapAnimate: 'wrapAnimate',
        frameAnimate: 'frameAnimate',
      })
      // 寻找设备WiFi
      if (this.data.system === 'Android') this.searchWiFi()
    },
    hideFrame() {
      const that = this
      that.setData({
        wrapAnimate: 'wrapAnimateOut',
        frameAnimate: 'frameAnimateOut',
      })
      setTimeout(() => {
        that.setData({
          flag: false,
        })
      }, 400)
      this.triggerEvent('close')
    },
    catchNone() {
      //阻止冒泡
    },
    _showEvent() {
      this.triggerEvent('showEvent')
    },
    _hideEvent() {
      this.triggerEvent('hideEvent')
    },

    cancel() {
      this.hideFrame()
      this.triggerEvent('cancel')
    },
    confirm() {
      this.hideFrame()
      this.triggerEvent('confirm')
    },
    feedback() {
      this.hideFrame()
      this.triggerEvent('feedback')
    },
    goLinkDeviceWifi() {
      this.switchWifi(false)
    },
    /**
     * 寻找设备WiFi
     */
    searchWiFi() {
      const self = this
      // 重置页面数据
      this.setData({
        isSearching: true,
        ifFoundWiFi: false,
        searchingCountdown: 5,
      })
      // 创建定时器
      const searchingInterval = setInterval(() => {
        this.setData({
          searchingCountdown: this.data.searchingCountdown - 1,
        })
        if (this.data.searchingCountdown == 0) {
          clearInterval(searchingInterval)
          setTimeout(() => {
            this.setData({
              isSearching: false,
            })
          }, 200)
        }
      }, 1000)
      // 获取WiFi列表
      wx.startWifi({
        success() {
          // 监听获取到Wi-Fi列表数据事件
          wx.onGetWifiList(function matchAp(list) {
            console.log('@module no-found-ap.js\n@method searchWiFi\n@desc 获取到WiFi列表\n', list.wifiList)
            if (
              list.wifiList.some((el) => {
                if (el.SSID.toLowerCase().includes(self.data.wifi)) {
                  console.log('@module no-found-ap.js\n@method searchWiFi\n@desc 存在设备WiFi\n', el)
                  return true
                } else {
                  return false
                }
              })
            ) {
              self.setData({
                ifFoundWiFi: true,
              })
            } else {
              console.log('@module no-found-ap.js\n@method searchWiFi\n@desc 不存在设备WiFi')
              self.setData({
                isSearching: false,
              })
            }
            clearInterval(searchingInterval)
            wx.offGetWifiList(matchAp)
          })
          // 请求获取Wi-Fi列表
          const getWifiInterval = setInterval(() => {
            if (self.data.isSearching && !self.data.ifFoundWiFi) {
              wx.getWifiList({
                fail(err) {
                  console.error(err)
                },
              })
            } else {
              clearInterval(getWifiInterval)
            }
          }, 500)
        },
        fail(err) {
          console.error(err)
        },
      })
    },
    /**
     * 已找到设备WiFi-点击去连接
     */
    onConfirmFoundWiFi() {
      this.goLinkDeviceWifi()
    },
  },
})
