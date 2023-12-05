/**
 * 校验输入的是否非法，合法字符中文、英文、数字
 */
export function checkInputNameIllegal(input: string) {
  return /[^a-zA-Z0-9\u4E00-\u9FA5]/g.test(input)
}

/**
 * 校验是否美的的设备热点，
 */
export function isDeviceWifi(SSID: string) {
  const deviceWifiReg = /^midea_.{2}_.{4}$/gi

  return deviceWifiReg.test(SSID)
}
