import { ab2hex, hex2bin, hexCharCodeToStr } from 'm-utilsdk/index'

/**
 * 解析设备蓝牙版本
 * @param {String} adData 蓝牙广播包
 */
function getBluetoothType(adData) {
  const str = adData.slice(4, 6)
  return str == '00' ? 1 : 2
}
/**
 * 解析设备sn8
 * @param {String} adData 蓝牙广播包
 */
function getSn8(adData) {
  let len = adData.length
  const blueVersion = getBluetoothType(adData)
  const sn8 = blueVersion == 2 ? hexCharCodeToStr(adData.slice(6, 22)) : hexCharCodeToStr(adData.substr(len - 16, len))
  return sn8
}
/**
 * 解析蓝牙功能状态
 * @param {String} adData 蓝牙广播包
 */
function getScanRespPackInfo(adData) {
  if (adData.substr(0, 4) != 'a806') {
    return
  }
  let hex
  let binArray
  if (adData.substr(4, 2) == '00') {
    // 1代蓝牙
    hex = adData.substr(6, 2)
    binArray = hex2bin(hex)
    return {
      moduleType: binArray[0] ? 1 : 0, // 模块类型
      isConfig: binArray[1] ? true : false, // 配置状态
      isCanSet: binArray[2] ? true : false, // 配置服务是否可用
      isCanDigital: binArray[3] ? true : false, // 透传服务是否可用
    }
  }
  if (adData.substr(4, 2) == '01') {
    // 2代蓝牙
    hex = adData.substr(36, 2)
    binArray = hex2bin(hex)
    // 拓展信息字段
    let hex1 = adData.substr(38, 2)
    let binArray1 = hex2bin(hex1)
    return {
      moduleType: binArray[0] ? 1 : 0, // 模块类型
      isLinkWifi: binArray[1] ? true : false, // WiFi配置状态
      isBindble: binArray[2] ? true : false, // BLE绑定状态
      isBleCheck: binArray[3] ? true : false, // BLE确权状态位
      isWifiCheck: binArray[4] ? true : false, // WiFi确权状态位
      isBleCanBind: binArray[5] ? true : false, // 保留
      isSupportBle: binArray[6] ? true : false, // 是否支持BLE数传
      isSupportOTA: binArray[7] ? true : false, // 是否支持BLE OTA
      isFeature: binArray1[7] == 1 ? true : false, // 是否支持扩展功能
    }
  }
}
/**
 * 解析设备品类和sn8
 * @param {Object} device 设备信息
 */
function getDeviceCategoryAndSn8(device) {
  const adData = ab2hex(device.advertisData)
  if (adData.substr(0, 4) != 'a806') {
    return
  }
  if (adData.substr(4, 2) == '00') {
    // 1代蓝牙
    if (device.localName.includes('midea') < -1) return
    let name = device.localName
    let info = name.split('_')
    let len = adData.length
    return {
      type: info[1]?.toUpperCase(),
      sn8: hexCharCodeToStr(adData.substr(len - 16, len)),
    }
  }
  if (adData.substr(4, 2) == '01') {
    // 2代蓝牙
    let sn8 = hexCharCodeToStr(adData.slice(6, 22))
    let type = hexCharCodeToStr(adData.substring(22, 26)).toUpperCase()
    return {
      sn8: sn8,
      type: type,
    }
  }
}

export { getBluetoothType, getSn8, getScanRespPackInfo, getDeviceCategoryAndSn8 }
