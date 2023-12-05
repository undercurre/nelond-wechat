import { service } from '../js/getApiPromise.js'
const brand = 'midea'
// eslint-disable-next-line no-undef
module.exports = Behavior({
  behaviors: [],
  properties: {},
  data: {
    deviceApList: [],
  },
  methods: {
    checkWifi() {},
    getWifiList() {
      service.getWxApiPromise(wx.startWifi).then((res1) => {
        console.log('获取WiFi列表1', res1)
        service.getWxApiPromise(wx.getWifiList).then((res2) => {
          console.log('获取WiFi列表2', res2)
          wx.onGetWifiList(function (res3) {
            console.log('获取WiFi列表3', res3)
            res3.wifiList.forEach((device) => {
              if (!this.filterMideaAP(device.SSID)) return
              const deviceData = this.getDeviceData(device)
              this.deviceApList.unshift(deviceData)
            })
          })
        })
      })
    },
    filterMideaAP(SSID) {
      return SSID.slice(0, 5) == brand ? true : false
    },
    getApCategory(SSID) {
      return SSID.slice(6, 8).toUpperCase()
    },
    //构造数据
    getDeviceData(deviceData) {
      const result = new Object()
      const category = this.getApCategory(deviceData.SSID)
      // const typeAndName = this.getDeviceApImgAndName(app.globalData.dcpDeviceImgList, category)
      result.category = category
      result.bssid = deviceData.BSSID
      // obj.deviceImg = typeAndName.deviceImg
      // obj.deviceName = typeAndName.deviceName
      return result
    },
    getDeviceApImgAndName(dcpDeviceImgList, category) {
      let item = new Object()
      console.log('获取图标命名称1', dcpDeviceImgList, category)
      if (dcpDeviceImgList[category]) {
        item.deviceImg = dcpDeviceImgList[category].common
      } else {
        // console.log('没找到', deviceImgMap)
        // if (deviceImgMap[category]) {
        //   item.deviceImg = deviceImgApi.url + 'blue_' + category.toLocaleLowerCase() + '.png'
        // } else {
        //   item.deviceImg = deviceImgApi.url + 'blue_default_type.png'
        // }
      }
      // if (deviceImgMap[category]) {
      //   const filterObj = deviceImgMap[category]
      //   item.deviceName = filterObj.title
      // } else {
      //   item.deviceName = ''
      // }
      console.log('获取图标命名称2', item)
      return item
    },
  },
})
