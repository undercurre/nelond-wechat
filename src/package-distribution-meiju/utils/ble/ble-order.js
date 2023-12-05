/* eslint-disable no-unused-vars */
import { CryptoJS, getRandomInt, hexString2Uint8Array } from 'm-utilsdk/index'
const msgCount = getRandomInt(1, 255) //消息码，防重放攻击
const Commands = Object.freeze({
  c1: 0x01,
  c2: 0x02,
  c3: 0x03,
  c4: 0x04,
})

//aa24ac00->['aa','24','00']
function formatString(order) {
  // let order = 'aa24ac0000000000000240434e147f7fff3000000000000000000000008000000000e9cce7'
  var arr = []
  for (var i = 0; i < order.length; i += 2) {
    arr.push(order.slice(i, i + 2))
  }
  // console.log(arr)
  return arr
}

function constrOrder(type, body) {
  let msg = new Uint8Array(2 + body.length + 4) //2为同步头
  msg[0] = 0xaa
  msg[1] = 0x55
  msg[2] = body.length + 4 //消息长度
  msg[3] = msgCount
  msg[4] = type
  msg.set(body, 5)
  msg[msg.length - 1] = checkSum(msg, 2, msg.length - 2) //校验和
  return msg
}

/**
 * 消息校验码 = ~sum（消息长度+消息标识 +消息类型标识+消息体）+1；
 * 即求和后取补码。求和过程中若发生溢出，直接丢弃溢出的高位
 */
function checkSum(array, start, end) {
  let sum = 0
  for (let i = start; i <= end; i++) {
    sum += array[i]
  }
  sum = (~sum + 1) & 0xff
  return sum
}

//AES加密
function encode(order, key, orderType, keyType) {
  console.time('encrypto spend time')
  // var hexString = 'aa24ac0000000000000240434e147f7fff3000000000000000000000008000000000e9cce7'
  var hexString = order
  var wordArray = ''
  var parseKey = key
  if (orderType == 'utf8') {
    wordArray = CryptoJS.enc.Utf8.parse(hexString)
    // var wordArray = CryptoJS.enc.Hex.parse(hexString)
  } else {
    wordArray = CryptoJS.enc.Hex.parse(hexString)
  }
  if (keyType == 'utf8') {
    parseKey = CryptoJS.enc.Utf8.parse(key)
  } else {
    parseKey = CryptoJS.enc.Hex.parse(key)
  }
  var encryptedData = CryptoJS.AES.encrypt(wordArray, parseKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  encryptedData = encryptedData.ciphertext.toString()
  console.timeEnd('encrypto spend time')
  return encryptedData
}

//AES解密
function decode(order, key, orderType, keyType) {
  console.log('decode========order', order)
  console.log('key=====', key)
  console.time('decrypto spend time')
  var hexString = order
  var cipherTextHexStr = ''
  if (orderType == 'utf8') {
    cipherTextHexStr = CryptoJS.enc.Utf8.parse(hexString)
  } else {
    cipherTextHexStr = CryptoJS.enc.Hex.parse(hexString)
  }
  cipherTextHexStr = CryptoJS.enc.Hex.parse(hexString)
  var baseData = CryptoJS.enc.Base64.stringify(cipherTextHexStr)
  var parseKey = key
  if (keyType == 'utf8') {
    parseKey = CryptoJS.enc.Utf8.parse(key)
  } else {
    parseKey = CryptoJS.enc.Hex.parse(key)
  }
  var decodeData = CryptoJS.AES.decrypt(baseData, parseKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  // console.log("decodeData===", decodeData.toString(), decodeData.toString().length)
  console.timeEnd('decrypto spend time')
  return decodeData.toString()
}

/*构造蓝牙指令
 *type   指令类型 0x01
 *order format:hexSting  example:'aa24ac0000000000000240434e147f7fff3000000000000000000000008000000000e9cce7'
 *key   format:hexSting  example:'87afd2b1bb8cb9e4713a39d4fe15b04b'
 *return format:hexSting
 */
function constructionBleOrder(type, order, key) {
  var body = encode(order, key, 'hex', 'hex')
  return constrOrder(type, hexString2Uint8Array(body))
}

/*构造蓝牙控制指令
 *order format:hexSting  example:'aa24ac0000000000000240434e147f7fff3000000000000000000000008000000000e9cce7'
 *key   format:hexSting  example:'87afd2b1bb8cb9e4713a39d4fe15b04b'
 *return format:hexSting
 */
function constructionBleControlOrder(order, key) {
  var body = encode(order, key, 'hex', 'hex')
  return constrOrder(Commands.c2, hexString2Uint8Array(body)).buffer
}

/*解析蓝牙控制指令响应数据
 *data format:hexSting  example:'aa24ac0000000000000240434e147f7fff3000000000000000000000008000000000e9cce7'
 *key   format:hexSting  example:'87afd2b1bb8cb9e4713a39d4fe15b04b'
 *return format:hexSting
 */
function paesrBleResponData(data, key) {
  var body = data.substr(10, data.length - 12) //截取消息体
  var parseData = decode(body, key, 'hex', 'hex')
  console.log('解析的数据============', parseData)
  return parseData
}

module.exports = {
  constructionBleOrder,
  constructionBleControlOrder,
  paesrBleResponData,
}
