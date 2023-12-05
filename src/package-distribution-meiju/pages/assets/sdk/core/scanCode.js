/* eslint-disable @typescript-eslint/no-this-alias */
/**
 * 扫码底层接口
 */
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'

const scanCode = {
  scanCode() {
    return new Promise((resolve, reject) => {
      wx.scanCode({
        success(res) {
          console.log('扫码结果', res)
          resolve(res)
        },
        fail(error) {
          console.log('扫码失败返回', error)
          reject(error)
        },
        complete() {},
      })
    })
  },
  /**
   * 密文二维码扫码解析
   * @param {*} qrCode
   * @param {*} timeout
   */
  scanCodeDecode(qrCode, timeout = 3000) {
    return new Promise((resolve, reject) => {
      let resq = {
        qrCode: qrCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('scancodeDecode', resq, 'POST', '', timeout)
        .then((resp) => {
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
}

module.exports = {
  scanCode,
}
