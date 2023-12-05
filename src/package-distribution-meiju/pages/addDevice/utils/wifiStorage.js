import { environment } from '../../../common/js/api'
import { encyptWifi, decodeWifi } from '../../assets/js/utils'

/**
 * 设置wifiStorage
 * @param {Object} wifiInfo WiFi信息
 */
function setWifiStorage(wifiInfo) {
  try {
    console.log('@module wifiStorage.js\n@method setWifiStorage\n@desc 需更新的WiFi信息\n', wifiInfo)
    const wifiStorage = wx.getStorageSync('storageWifiListV1')
    console.log('@module wifiStorage.js\n@method setWifiStorage\n@desc 现有WiFi缓存\n', wifiStorage)
    let storageWifiList = {
      sit: [],
      prod: [],
    }
    if (wifiStorage?.[environment]?.length && decodeWifi(wifiStorage[environment])) {
      storageWifiList[environment] = decodeWifi(wifiStorage[environment])
    }
    console.log('@module wifiStorage.js\n@method setWifiStorage\n@desc 现有WiFi缓存解密\n', storageWifiList)
    let isHasstorage = false
    storageWifiList[environment].forEach((item) => {
      if (item.SSIDContent == wifiInfo.SSIDContent) {
        // SSID作为唯一标示
        isHasstorage = true
        if (item.PswContent != wifiInfo.PswContent) {
          // 密码修改
          item.PswContent = wifiInfo.PswContent
          item.PswLength = wifiInfo.PswLength
          storageWifiList[environment] = encyptWifi(storageWifiList[environment].slice(-3)) // 只保存三个
          wx.setStorageSync('storageWifiListV1', storageWifiList)
          console.log('@module wifiStorage.js\n@method setWifiStorage\n@desc 更新WiFi缓存\n', storageWifiList)
        }
      }
    })
    if (!isHasstorage) {
      // 现有WiFi缓存无对应记录
      storageWifiList[environment].push(wifiInfo)
      storageWifiList[environment] = encyptWifi(storageWifiList[environment].slice(-3)) // 只保存三个
      wx.setStorageSync('storageWifiListV1', storageWifiList)
      console.log('@module wifiStorage.js\n@method setWifiStorage\n@desc 新增WiFi缓存\n', storageWifiList)
    }
  } catch (error) {
    console.error('@module wifiStorage.js\n@method setWifiStorage\n@desc 异常报错\n', error)
  }
}

export { setWifiStorage }
