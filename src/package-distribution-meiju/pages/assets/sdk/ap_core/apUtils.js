/* eslint-disable no-redeclare */
import {
  CryptoJS,
  md5,
  hexStringToArrayBuffer,
  getRandomString,
  hexString2Uint8Array,
  asiiCode2Str,
  cloudEncrypt,
  hexCharCodeToStr,
} from 'm-utilsdk/index'
import { api } from '../../../../common/js/api'
import { Logger } from '../../../../../utils/index'

let signStr = 'xhdiwjnchekd4d512chdjx5d8e4c394D2D7S'
let signHex = '78686469776a6e6368656b6434643531326368646a783564386534633339344432443753'
let MAS_KEY = {
  dev: '143320d6c73144d083baf9f5b1a7acc9',
  sit: '143320d6c73144d083baf9f5b1a7acc9',
  prod: 'ad0ee21d48a64bf49f4fb583ab76e799',
}

//节序转化
function reverse(hex) {
  // hex = '2c190000'
  let arr = []
  for (var i = 0, len = hex.length; i < len; i += 2) {
    // if(hex.substr(i, 2)!='00'){

    // }
    arr.push(hex.substr(i, 2))
    // parseInt("2c", 16)
  }
  // let string = arr.join(",")
  return arr.reverse()
}

/**
 * 补足字节位
 * hex 01
 * len 2
 * return hex 0100
 */
function padByte(hex, len) {
  var padHex = hex
  if (hex.length / 2 < len) {
    for (let i = 0; i < len - hex.length / 2; i++) {
      padHex = padHex + '00'
    }
  }
  return padHex
}

//解析ip  hex:01 01 a8 c0
function parseIp(hex) {
  if (hex.length != 8) {
    console.log('ip参数有误')
  }
  let hexArr = reverse(hex)
  return `${parseInt(hexArr[0], 16)}.${parseInt(hexArr[1], 16)}.${parseInt(hexArr[2], 16)}.${parseInt(hexArr[3], 16)}`
}

//解析port  hex:2c190000
function parsePort(hex) {
  if (hex.length != 8) {
    console.log('port参数有误')
  }
  let hexArr = reverse(hex)
  let port = hexArr[2] + hexArr[3]
  return parseInt(port, 16)
}

/*
params:hex 
return sign hex
*/
function creatSign(msg) {
  msg = msg + signHex
  let wordArray = CryptoJS.enc.Hex.parse(msg)
  return CryptoJS.MD5(wordArray).toString()
}
/*
params:msg hexstring 响应消息
return boolear
*/
function checkApSign(msg) {
  if (!msg.includes('5a5a')) return //非ap响应
  var stayMsg = msg.slice(0, msg.length - 32)
  var moudelSign = msg.slice(msg.length - 32, msg.length)
  console.log('checlsign===', creatSign(stayMsg), moudelSign)
  return creatSign(stayMsg) == moudelSign
}

function dec2hex(dec, len) {
  //10进制转16进制补0
  var hex = ''
  while (dec) {
    var last = dec & 15
    hex = String.fromCharCode((last > 9 ? 55 : 48) + last) + hex
    dec >>= 4
  }
  if (len) {
    while (hex.length < len) hex = '0' + hex
  }
  return hex
}
//加密wifi
function encyptWifi(wifiInfo) {
  let wifiStr = JSON.stringify(wifiInfo)
  let key = MAS_KEY[api.environment]
  return encode(wifiStr, key, 'utf8', 'hex')
}
//解密wifi
function decodeWifi(wifiInfo) {
  let key = MAS_KEY[api.environment]
  let wifiHex = decode(wifiInfo, key, 'hex', 'hex')
  let wifiString = hexCharCodeToStr(wifiHex)
  console.log('pppppp====', wifiString)
  return JSON.parse(wifiString)
}
//AES加密
function encode(order, key, orderType, keyType) {
  console.time('encrypto spend time')
  // var hexString = 'aa24ac0000000000000240434e147f7fff3000000000000000000000008000000000e9cce7'
  var hexString = order
  if (orderType == 'utf8') {
    var wordArray = CryptoJS.enc.Utf8.parse(hexString)
    // var wordArray = CryptoJS.enc.Hex.parse(hexString)
  } else {
    var wordArray = CryptoJS.enc.Hex.parse(hexString)
  }
  if (keyType == 'utf8') {
    var key = CryptoJS.enc.Utf8.parse(key)
  } else {
    var key = CryptoJS.enc.Hex.parse(key)
  }
  var encryptedData = CryptoJS.AES.encrypt(wordArray, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  encryptedData = encryptedData.ciphertext.toString()
  console.timeEnd('encrypto spend time')
  return encryptedData
}

function decode(order, key, orderType, keyType) {
  console.log('decode========order', order)
  console.log('key=====', key)
  console.time('decrypto spend time')
  var hexString = order
  if (orderType == 'utf8') {
    var cipherTextHexStr = CryptoJS.enc.Utf8.parse(hexString)
  } else {
    var cipherTextHexStr = CryptoJS.enc.Hex.parse(hexString)
  }
  var cipherTextHexStr = CryptoJS.enc.Hex.parse(hexString)
  var baseData = CryptoJS.enc.Base64.stringify(cipherTextHexStr)
  if (keyType == 'utf8') {
    var key = CryptoJS.enc.Utf8.parse(key)
  } else {
    var key = CryptoJS.enc.Hex.parse(key)
  }
  var decodeData = CryptoJS.AES.decrypt(baseData, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  // console.log("decodeData===", decodeData.toString(), decodeData.toString().length)
  console.timeEnd('decrypto spend time')
  return decodeData.toString()
}

//解密模组ap消息
function decode2body(msg) {
  Logger.console('ap_core----decode2body')
  let type = msg.slice(12, 16)
  type = reverse(type).join('') //转节序
  let tag = msg.slice(16, 18)
  if (msg.substr(7, 1) == 1) {
    //有签名
    console.log('有签名', msg.substr(7, 1))
    if (!checkApSign(msg)) {
      console.log('消息校验签名错误')
      return
    }
  }
  let body = msg.slice(80, msg.length - 32)
  console.log('msg body', body)
  if (msg.substr(6, 1) == 1) {
    //有加密
    console.log('有加密')
    let EncKey = md5(signStr)
    body = decode(body, EncKey, 'hex', 'hex')
  }
  return {
    type: type,
    tag: tag,
    body: body,
  }
}
//解析udp消息体
function parseUdpBody(deBody) {
  let adData = {}
  adData.tcpIp = parseIp(deBody.slice(0, 8))
  adData.tcpPort = parsePort(deBody.slice(8, 16))
  adData.sn = deBody.slice(16, 80)
  adData.sn8 = hexCharCodeToStr(adData.sn).substr(9, 8) //截取sn8
  adData.ssidLen = parseInt(deBody.slice(80, 82), 16)
  let n = adData.ssidLen * 2 //13
  adData.ssid = deBody.slice(82, 82 + n)
  adData.checkTag = deBody.substr(82 + n, 2)
  adData.checkRetain = deBody.substr(84 + n, 2)
  adData.add1 = deBody.substr(86 + n, 2)
  adData.add2 = deBody.substr(88 + n, 2)
  adData.udpVersion = deBody.substr(90 + n, 8) //udp版本
  adData.supPro = deBody.substr(98 + n, 2) //支持的协议
  adData.add3 = deBody.substr(100 + n, 6) //保留3
  adData.vendor = deBody.substr(106 + n, 4) //厂家信息
  adData.type = deBody.substr(110 + n, 2) //主类型
  adData.typeRetain = deBody.substr(112 + n, 2) //主类型 保
  adData.sonTypeL = deBody.substr(114 + n, 2) //子类型 低
  adData.sonTypeH = deBody.substr(116 + n, 2) //子类型 高
  adData.sonType = deBody.substr(118 + n, 8) //子类型
  adData.mac = deBody.substr(126 + n, 12) //mac
  adData.moduleVersion = deBody.substr(138 + n, 12) //模块version
  adData.isLinkNet = deBody.substr(150 + n, 2) //是否连上服务器
  adData.allowTcpNum = deBody.substr(152 + n, 2) //允许tcp的数量
  adData.yetLinkNum = deBody.substr(154 + n, 2) //已经连接的数量
  return adData
}

// message = '5a5a 01(协议版本) 11(加密标示) b800(消息总长度 184) 7a00(消息类型) 06 00 00 00(消息标示)34 0a 00 00 00 00 00 00（时间戳） 00 00 00 00 00 00（设备id） 00 00(超时时间)  00 00 00 00 00 00（子设备id） 01（通信类型）80 （设备信息）00 00 00 00
/*
*params{
    type //消息类型
    body //消息体
    isEncode //是否加密 默认加密
    isSign   //是否签名 默认签名
    devicId  //设备id
    sonDeviceId //子设备id
    timeOut    //超时时长
}
*
*/
function construOrder(params) {
  //5A5A01117800 7000 02000000AF1D0214080615140000000000000000000000000000000000000000
  let proHead = '5a5a'
  let proVersion = '01'
  // let enCodeTag = '11'
  let encryptTag = Number(params.isEncode || true)
  let signTag = Number(params.isSign || true)
  let len = calcMsgLen(params.body) //120
  let type = reverse(params.type).join('') //小端 0092->9200
  let tag = padByte(getRandomString(2).toLocaleLowerCase(), 4)
  let time = getHexStamp()
  let deviceId = params.deviceId || padByte('', 6)
  let timeOut = params.timeOut || padByte('', 2)
  let sonDeviceId = params.sonDeviceId || padByte('', 6)
  let msgType = '00' //通信类型
  let deviceInfo = '00' //设备信息
  let keep = padByte('', 4) //保留
  let header =
    proHead +
    proVersion +
    encryptTag +
    signTag +
    len +
    type +
    tag +
    time +
    deviceId +
    timeOut +
    sonDeviceId +
    msgType +
    deviceInfo +
    keep
  header = header.toLocaleLowerCase()
  let EncKey = md5(signStr)
  let enCodeBody = encode(params.body, EncKey, 'hex', 'hex')
  //签名
  let signAll = header + enCodeBody + signHex
  let sign = md5(hexStringToArrayBuffer(signAll))
  return header + enCodeBody + sign
}
//16進制時間戳
function getHexStamp() {
  var date = new Date()
  var year02 = Number((date.getFullYear() + '').slice(0, 2)).toString(16) //14
  var year24 = Number((date.getFullYear() + '').slice(2, 4)).toString(16) //15
  var mouth = (date.getMonth() + 1).toString(16) //07
  mouth = padHex0(mouth, 2)
  var day = date.getUTCDate().toString(16) //10
  day = padHex0(day, 2)
  var hours = date.getHours().toString(16) //0E
  hours = padHex0(hours, 2)
  var min = date.getMinutes().toString(16)
  min = padHex0(min, 2)
  var m = date.getSeconds().toString(16)
  m = padHex0(m, 2)
  var ms = date.getMilliseconds().toString(16).slice(0, 2)
  ms = padHex0(ms, 2)
  // console.log(`${year02+year24}-${mouth}-${day}-${hours}-${min}-${m}-${ms}`)
  return reverse(`${year02 + year24}${mouth}${day}${hours}${min}${m}${ms}`).join('')
}
//16進制
function padHex0(hex, len) {
  if (hex.length < len) {
    for (var i = 0; i < len - hex.length; i++) {
      hex = '0' + hex
    }
  }
  return hex
}

//计算指令 // 小于32->32  32-64:64 64-96:96
function calcMsgLen(body) {
  var encodeBodylen = Math.floor(body.length / 32 + 1) * 32
  // console.log('encode body----', encodeBodylen)
  var msgLen = 40 + encodeBodylen / 2 + 16
  var hexLen = msgLen.toString(16)
  hexLen = padHex0(hexLen, 2)
  if (hexLen.length <= 2) {
    //补足2位
    return hexLen + '00'
  }
  return hexLen
}

//sn加密 sn:hexString
function enCodeSn(sn, key, appKey) {
  let snAsiiArr = hexString2Uint8Array(sn)
  sn = asiiCode2Str(snAsiiArr)
  // console.log('asiiCode2Str====', sn)
  return cloudEncrypt(sn, key, appKey)
}

const linkAPerrorMsg = {
  0: 'OK',
  1: 'SSID 有误',
  2: 'PWD 有误',
  3: 'BSSID 有误',
  4: '路由器连接 PWD 错误（可选实现）',
  24: '国家码错误（非大写字母 A-Z）',
  25: '时区错误（time_zone > 24）',
  26: '信道表错误（信道表数量 < 1 或者 > 10）',
  27: '域名长度错误（域名长度>50）',
}

const apUtils = {
  linkAPerrorMsg,
  reverse,
  padByte,
  parseIp,
  parsePort,
  checkApSign,
  dec2hex,
  creatSign,
  decode2body,
  parseUdpBody,
  construOrder,
  calcMsgLen,
  enCodeSn,
  encyptWifi,
  decodeWifi,
}
module.exports = {
  apUtils,
  linkAPerrorMsg,
  reverse,
  padByte,
  parseIp,
  parsePort,
  checkApSign,
  dec2hex,
  creatSign,
  decode2body,
  parseUdpBody,
  construOrder,
  calcMsgLen,
  enCodeSn,
  encyptWifi,
  decodeWifi,
}
