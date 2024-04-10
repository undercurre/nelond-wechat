/**
 * 校验输入的是否非法，合法字符中文、英文、数字
 */
export function checkInputNameIllegal(input: string) {
  return /[^a-zA-Z0-9\u4E00-\u9FA5]/g.test(input)
}

/**
 * 校验输入的用户名是否非法
 * 最多10个字符
 * 首字符必须是中文、英文字母、括号、圆括号、横杠或下划线中的任意一个；
 * 后续字符可以是数字、中文、英文字母、括号、圆括号、横杠或下划线中的任意一个
 */
export function checkUserNameIllegal(input: string) {
  return /^[\u4e00-\u9fa5a-zA-Z（）()\-_]{1}[\u4e00-\u9fa5a-zA-Z（）()0-9\-_]{0,9}$/g.test(input)
}

/**
 * 校验是否美的的设备热点，
 */
export function isDeviceWifi(SSID: string) {
  const deviceWifiReg = /^midea_.{2}_.{4}$/gi

  return deviceWifiReg.test(SSID)
}
