import { api } from '../../../common/js/api'
import { hexCharCodeToStr, CryptoJS } from 'm-utilsdk/index'
let MAS_KEY = {
  dev: '143320d6c73144d083baf9f5b1a7acc9',
  sit: '143320d6c73144d083baf9f5b1a7acc9',
  prod: 'ad0ee21d48a64bf49f4fb583ab76e799',
}
//获得连接方式
function getLinkType(mode) {
  let linkType = ''
  if (mode == 0) {
    linkType = 'ap'
  }
  if (mode == 3 || mode == 5) {
    linkType = 'bluetooth'
  }
  if (mode == 9 || mode == 10) {
    linkType = '本地蓝牙直连'
  }
  return linkType
}

//获取蓝牙版本
function getBlueVersion(advertisData) {
  //advertisData:蓝牙广播包
  let blueVersion = 2
  if (advertisData.substr(4, 2) == '00') {
    //1代蓝牙
    blueVersion = 1
  }
  if (advertisData.substr(4, 2) == '01') {
    blueVersion = 2
  }

  return blueVersion
}

//加密wifi
function encyptWifi(wifiInfo) {
  wifiInfo = JSON.stringify(wifiInfo)
  var iv = CryptoJS.enc.Utf8.parse(iv)
  var key = CryptoJS.enc.Utf8.parse(MAS_KEY[api.environment])
  var encrypted = CryptoJS.AES.encrypt(wifiInfo, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  //返回的是base64格式的密文
  console.log('yyyyy====', encrypted)
  return encrypted.toString()
}
//解密wifi
function decodeWifi(wifiInfo) {
  var iv = CryptoJS.enc.Utf8.parse(iv)
  var key = CryptoJS.enc.Utf8.parse(MAS_KEY[api.environment])
  var decrypted = CryptoJS.AES.decrypt(wifiInfo, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
}

//扫码
function scanCode() {
  return new Promise((resolve, reject) => {
    wx.scanCode({
      success(res) {
        console.log('扫码=====', res)
        // resolve(res.result)
        resolve(res)
      },
      fail(error) {
        console.log('扫码失败返回', error)
        reject(error)
      },
      complete() {},
    })
  })
}

//解密动态二维码是呢
function deCodeDynamicCodeSn(enCodeSn, key) {
  let wordArray = CryptoJS.enc.Utf8.parse(key)
  key = CryptoJS.MD5(wordArray).toString().substring(0, 16)

  var cipherTextHexStr = CryptoJS.enc.Hex.parse(enCodeSn)
  var baseData = CryptoJS.enc.Base64.stringify(cipherTextHexStr)
  key = CryptoJS.enc.Utf8.parse(key)

  var decodeData = CryptoJS.AES.decrypt(baseData, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  console.log('解密的sn===', decodeData.toString())
  return hexCharCodeToStr(decodeData.toString())
}

//获取大屏二维码原文中的 信息
function getTouchScreenScanCodeInfo(scanCodeRes) {
  let keyVulueArr = scanCodeRes.split('?')[1].split('&')
  let resObject = {}
  keyVulueArr.forEach((item, index) => {
    resObject[item.split('=')[0]] = item.split('=')[1]
  })
  console.log('keyVulueArr===', resObject)
  resObject.verificationCodeKey = resObject.ck ? resObject.ck : ''
  resObject.verificationCode = resObject.cd ? resObject.cd : ''
  resObject.type = resObject.appliance ? resObject.appliance.substring(0, 2) : ''

  let enCodeSn = resObject.appliance ? resObject.appliance.substring(2) : ''
  let key = '0x' + resObject.type + '_msmart'

  resObject.sn = deCodeDynamicCodeSn(enCodeSn, key)

  return resObject
}

const addDeviceTime = (date, connect = '/') => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].join(connect) + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = (n) => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  getLinkType,
  getBlueVersion,
  encyptWifi,
  decodeWifi,
  scanCode,
  getTouchScreenScanCodeInfo,
  addDeviceTime,
}
