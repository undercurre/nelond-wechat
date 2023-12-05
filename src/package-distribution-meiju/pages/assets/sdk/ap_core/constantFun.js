import { toHexString, string2Uint8Array, dec2hex } from 'm-utilsdk/index'
import { api, environment } from '../../../../common/js/api'

let signStr = 'xhdiwjnchekd4d512chdjx5d8e4c394D2D7S'
let signHex = '78686469776a6e6368656b6434643531326368646a783564386534633339344432443753'
let MAS_KEY = {
  dev: '143320d6c73144d083baf9f5b1a7acc9',
  sit: '143320d6c73144d083baf9f5b1a7acc9',
  prod: 'ad0ee21d48a64bf49f4fb583ab76e799',
}

/**
 * 配网功能集默认参数
 */
const constantFun = {
  reverse(hex) {
    let arr = []
    for (var i = 0, len = hex.length; i < len; i += 2) {
      arr.push(hex.substr(i, 2))
    }
    return arr.reverse().join('').toLocaleLowerCase()
  },

  getDefaultPort() {
    let port = 28443
    return this.reverse(dec2hex(port))
  },

  getCountryCode() {
    let countryCode = 'CN'
    let countryCodeHex = toHexString(string2Uint8Array(countryCode))
    return countryCodeHex
  },

  //信道个数
  getChannelNum() {
    return dec2hex(4, 2)
  },

  getChannels() {
    let channel_1 = dec2hex(1, 2) + dec2hex(13, 2) + dec2hex(27, 2) + dec2hex(0, 2)
    let channel_2 = dec2hex(36, 2) + dec2hex(4, 2) + dec2hex(23, 2) + dec2hex(0, 2)
    let channel_3 = dec2hex(52, 2) + dec2hex(4, 2) + dec2hex(23, 2) + dec2hex(1, 2)
    let channel_4 = dec2hex(149, 2) + dec2hex(5, 2) + dec2hex(27, 2) + dec2hex(0, 2)
    return channel_1 + channel_2 + channel_3 + channel_4
  },

  getTimeZone() {
    return dec2hex(8, 2) //东8区
  },

  getRegionId() {
    return dec2hex(1, 2) //01
  },

  getDefaultDomain() {
    if (environment == 'sit') {
      return toHexString(string2Uint8Array('iotlab.midea.com.cn'))
    }
    if (environment == 'sandbox' || environment == 'uat') {
      //小程序无
      return toHexString(string2Uint8Array('iot-module-uat.smartmidea.net'))
    } else {
      //default prod
      return toHexString(string2Uint8Array('iot1.midea.com.cn'))
    }
  },
}

export { constantFun }
