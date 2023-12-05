/* eslint-disable @typescript-eslint/no-this-alias,@typescript-eslint/no-var-requires */
const addDeviceMixin = require('../../assets/js/addDeviceMixin')
import computedBehavior from '../../../../../utils/miniprogram-computed'
import { addDeviceSDK } from '../../../../../utils/addDeviceSDK.js'
import { imgesList } from '../../../../assets/js/shareImg.js'
import { imgBaseUrl } from '../../../../../common/js/api'
const imgUrl = imgBaseUrl.url + '/shareImg/meiju'
import app from '../../../../../common/app'

Component({
  externalClasses: ['frame', 'wifi-list-title', 'blue', 'wifi-item', 'left'],
  behaviors: [addDeviceMixin, computedBehavior],
  properties: {
    wifiList: {
      type: Array,
      value: [],
    },
    title: {
      type: String,
      value: '',
    },
    isGetDeviceWifi: {
      type: Boolean,
      value: false,
    },
    isSupport5G: {
      type: Boolean,
      value: true,
    },
    type: {
      type: String,
      value: 'ca',
    },
    brandName: {
      type: String,
      value: 'midea',
    },
    brand: {
      type: String,
      value: 'meiju',
    },
  },
  data: {
    flag: false,
    isShowWifiList: false,
    wrapAnimate: 'wrapAnimate',
    bgOpacity: 0,
    frameAnimate: 'frameAnimate',
    isIphoneX: app.globalData.isIphoneX,
    isRefresh: false, //是否在刷新
    isCanUse: {
      meiju: '#488FFF',
      colmo: '#AF6437',
      toshiba: '#E61E1E',
    },
    isNotCanUse: {
      meiju: '#333',
      colmo: 'rgba(255,255,255,0.25)',
      toshiba: '#8A8A8F',
    },
  },

  computed: {
    fomatWifiList() {
      let { wifiList, isGetDeviceWifi, isSupport5G } = this.properties
      let wifiName
      let signalStrength
      let frequency
      if (!wifiList.length) {
        return []
      }
      if (isGetDeviceWifi) {
        //只显示设备ap
        wifiList = wifiList.filter((item) => {
          wifiName = item.SSID.toLocaleLowerCase()
          return addDeviceSDK.isDeviceAp(wifiName)
        })
        wifiList.forEach((item, index) => {
          wifiName = item.SSID
          signalStrength = item.signalStrength
          item.desc = '使用此Wi-Fi'
          item.isCan = 1
          //wiif 强度分级
          if (signalStrength >= 99) {
            item.class = imgUrl + imgesList['wifiSignalStrength4']
          } else if (99 > signalStrength && signalStrength >= 74) {
            //强度3
            item.class = imgUrl + imgesList['wifiSignalStrength3']
          } else if (74 >= signalStrength && signalStrength > 50) {
            item.class = imgUrl + imgesList['wifiSignalStrength3']
          } else if (50 >= signalStrength && signalStrength > 26) {
            item.class = imgUrl + imgesList['wifiSignalStrength2']
          } else if (26 >= signalStrength && signalStrength > 0) {
            item.class = imgUrl + imgesList['wifiSignalStrength1']
          } else if (0 >= signalStrength) {
            item.class = imgUrl + imgesList['wifiSignalStrength1']
          }
        })

        wifiList.sort(function (a, b) {
          if (a.isCan === b.isCan) {
            //是否可用分类
            return b.signalStrength - a.signalStrength //强度强的排前
          } else {
            return b.isCan - a.isCan //可用的排前
          }
        })
        return wifiList
      }
      wifiList.forEach((item, index) => {
        item.SSID = item.SSID.trim()
        wifiName = item.SSID.toLocaleLowerCase()
        signalStrength = item.signalStrength
        frequency = item.frequency

        if (!isSupport5G && (wifiName.includes('5G') || wifiName.includes('5g'))) {
          item.desc = '不支持5GHz Wi-Fi'
          item.isCan = 0 //是否可用
        } else if (!isSupport5G && frequency >= 5000) {
          item.desc = '不支持5GHz Wi-Fi'
          item.isCan = 0 //是否可用
        } else if (addDeviceSDK.isDeviceAp(wifiName)) {
          item.desc = '暂不支持智能设备网络'
          item.isCan = 0
        } else {
          item.desc = '使用此WiFi'
          item.isCan = 1
        }
        //wiif 强度分级
        if (signalStrength >= 99) {
          item.class = imgUrl + imgesList['wifiSignalStrength4']
        } else if (99 > signalStrength && signalStrength >= 74) {
          //强度3
          item.class = imgUrl + imgesList['wifiSignalStrength3']
        } else if (74 >= signalStrength && signalStrength > 50) {
          item.class = imgUrl + imgesList['wifiSignalStrength3']
        } else if (50 >= signalStrength && signalStrength > 26) {
          item.class = imgUrl + imgesList['wifiSignalStrength2']
        } else if (26 >= signalStrength && signalStrength > 0) {
          item.class = imgUrl + imgesList['wifiSignalStrength1']
        } else if (0 >= signalStrength) {
          item.class = imgUrl + imgesList['wifiSignalStrength1']
        }
      })

      wifiList.sort(function (a, b) {
        if (a.isCan === b.isCan) {
          //是否可用分类
          return b.signalStrength - a.signalStrength //强度强的排前
        } else {
          return b.isCan - a.isCan //可用的排前
        }
      })
      return wifiList
    },
  },

  attached() {
    console.log('wifi list show-----------', this.properties)
  },
  methods: {
    selectWifi(e) {
      console.log('e', e.currentTarget.dataset)
      const data = e.currentTarget.dataset
      if (!data.wifiInfo.isCan) {
        console.log('不可用wifi')
        return
      } //不可用
      this.triggerEvent('selectWifi', data.wifiInfo)
      this.hideFrame()
    },

    //去设置页
    goToSetPage() {
      this.hideFrame()
      setTimeout(() => {
        this.triggerEvent('goToSetPage')
      }, 400)
    },
    refreshWifi() {
      this.setData({
        isRefresh: true,
      })
      setTimeout(() => {
        this.setData({
          isRefresh: false,
        })
      }, 300)
      this.triggerEvent('refreshWifiList')
    },

    onClose() {
      this.setData({
        isShowWifiList: false,
      })
    },

    showFrame() {
      // this.getWifiList()
      this.setData({
        isShowWifiList: true,
        wrapAnimate: 'wrapAnimate',
        frameAnimate: 'frameAnimate',
      })
    },
    hideFrame() {
      const that = this
      wx.offGetWifiList() //停止监听wifi列表
      that.setData({
        wrapAnimate: 'wrapAnimateOut',
        frameAnimate: 'frameAnimateOut',
      })
      setTimeout(() => {
        that.setData({
          isShowWifiList: false,
        })
      }, 400)
      this.triggerEvent('hideWifiListSheet')
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
  },
})
