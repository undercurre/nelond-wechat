//	arrayBuffer to 16hex
function _ab2hex(buffer: ArrayBuffer) {
  const hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit: number) {
    return bit.toString(16).padStart(2, '0')
  })
  return hexArr.join('')
}
/**
 * 创建 16字节 环形加密表
 * @param addr 设备广播帧中的addr
 * @param flag
 * @returns number[]
 */
function createEncodeTable(addr: string) {
  const hexArr: number[] = []
  for (let i = 0; i < addr.length; i += 2) {
    hexArr.push(parseInt(addr.slice(i, i + 2), 16))
  }
  const encodeTable: number[] = []
  let left = 0,
    right = left + 1
  do {
    encodeTable.push((hexArr[left] + hexArr[right]) % 256)
    right++
    if (right === 6) {
      left++
      right = left + 1
    }
  } while (left < 5)
  encodeTable.push(hexArr.reduce((pre, cur) => pre + cur) % 256)
  return encodeTable
}
function _createRandomEncodeFlag(): number {
  return Math.round(Math.random() * 15)
}

/**
 * 使用环形加密表 加密payload数据
 * @param data 用户透传payload
 * @param addr 设备addr
 * @param flag 本次通信的加密序列起始索引
 * @returns number[]
 */
function _enCodeData(data: string, addr: string, flag: number) {
  const encryptResult: number[] = []
  const encodeTable = createEncodeTable(addr)
  // console.log(
  //   '本次通信的 循环加密表',
  //   encodeTable.map((b) => b.toString(16)),
  //   'flag',
  //   flag,
  // )
  const source: number[] = []
  let encodeIndex = flag & 0x0f
  for (let i = 0; i < data.length; i += 2) {
    source.push(parseInt(data.slice(i, i + 2), 16))
  }
  // console.log('本次需要加密的数据', data)
  for (let i = 0; i < source.length; i++) {
    encryptResult[i] = source[i] ^ encodeTable[encodeIndex % encodeTable.length]
    encodeIndex++
  }
  return encryptResult
}
export default {
  ab2hex: _ab2hex,
  enCodeData: _enCodeData,
  createRandomEncodeFlag: _createRandomEncodeFlag,
}
