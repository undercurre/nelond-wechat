/**
 * 生成字符串的哈希值
 * @param {String} str 字符串
 */
function stringToHashCode(str) {
  var hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}
/**
 * int转byte数组（小端模式）
 * @param {Number} number int数值
 * @param {Number} length byte数组长度
 * 如uint16，则lenght=2表示两个字节，转成的byte数组长度是length=2
 * 如uint32，则lenght=2表示两个字节，转成的byte数组长度是length=4
 */
function IntToBytes(number, length) {
  var bytes = []
  var i = 0
  do {
    bytes[i++] = number & 255
    number = number >> 8
  } while (i < length)
  return bytes
}
/**
 * byte数组转十六进制字符串
 * @param {Array} bytes byte数组
 */
function bytesToHexString(bytes) {
  let hex = '',
    len = bytes.length
  for (let i = 0; i < len; i++) {
    let tmp,
      num = bytes[i]
    if (num < 0) {
      tmp = (255 + num + 1).toString(16)
    } else {
      tmp = num.toString(16)
    }
    if (tmp.length == 1) {
      return '0' + tmp
    }
    hex += tmp
  }
  return hex
}

export { stringToHashCode, IntToBytes, bytesToHexString }
