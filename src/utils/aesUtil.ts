import CryptoJS from 'crypto-js'

// 2、Crypto加密方法封装
export const aesUtil = {
  /**
   * 加密函數
   * @param data
   * @param keyStr
   * @param enc 明文数据格式： Hex：16进制数据，Utf8：文本数据
   */
  encrypt: (data: string, keyStr: string, enc: 'Hex' | 'Utf8' = 'Utf8') => {
    const key = CryptoJS.enc.Utf8.parse(keyStr)
    const source = CryptoJS.enc[enc].parse(data)

    const encryptedObj = CryptoJS.AES.encrypt(source, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })

    const res = encryptedObj.ciphertext.toString()

    return res
  },
  // 解密函數
  decrypt: (data: string, keyStr: string, enc: 'Hex' | 'Utf8' = 'Utf8') => {
    const key = CryptoJS.enc.Utf8.parse(keyStr)

    const hexStr = CryptoJS.enc.Hex.parse(data)
    const base64Str = CryptoJS.enc.Base64.stringify(hexStr)

    const decrypt = CryptoJS.AES.decrypt(base64Str, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })

    const decString = decrypt.toString(CryptoJS.enc[enc])

    return decString.toString()
  },
}
