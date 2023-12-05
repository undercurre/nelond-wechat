/* eslint-disable @typescript-eslint/no-this-alias */
/**
 * 从云端获取协商密钥，用于加解密蓝牙，ap等信息
 */
import { requestService } from './requestService'
import { getReqId, getStamp, cloudDecrypt } from 'm-utilsdk/index'
import { api } from '../common/js/api'
const getPrivateKeys = {
  getPrivateKey() {
    return new Promise((resolve, reject) => {
      let reqData = {
        bizGroup: 'msmart',
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('privateKey', reqData)
        .then((resp) => {
          console.log('获取密钥成功')
          const key = getApp().globalData.isLogon ? getApp().globalData.userData.key : ''
          var privateKeyValue = resp.data.data.msmart.filter(function (item) {
            return item.privateKeyName == 'msmartAP'
          })
          const privateKey = cloudDecrypt(privateKeyValue[0].privateKeyValue, key, api.appKey)
          getApp().globalData.privateKey = privateKey
          // reject(resp)
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  // 本地测试方法
  getPrivateKey1() {
    return new Promise((resolve, reject) => {
      let reqData = {
        bizGroup: 'msmart',
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('privateKey', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  /**
   * 时机一，登录后请求该方法，包括失败后重试机制
   */
  getPrivateKeyAfterLogin() {
    const self = this
    if (getApp().globalData.privateKeyIntervalNum) {
      clearInterval(getApp().globalData.privateKeyIntervalNum)
    }
    if (getApp().globalData.testFlag) return //辅助测试
    if (getApp().globalData.privateKey) return
    this.requestWithTry(this.getPrivateKey, 3)
      .then((resp) => {
        console.log(resp)
      })
      .catch((error) => {
        const currentIntervel = setInterval(() => {
          self
            .getPrivateKey()
            .then((resp) => {
              clearInterval(currentIntervel)
              console.log('定时获取密钥成功')
            })
            .catch((error) => {
              console.log('定时获取密钥失败：', error)
            })
        }, 30 * 1000)
        getApp().globalData.privateKeyIntervalNum = currentIntervel
        console.log('currentIntervel:', currentIntervel)
      })
  },
  /**
   * @function 延迟函数
   * @param second {number} 延迟间隔
   * @returns {Promise<any>}
   * @private
   */
  delay(second = 1000) {
    // 延迟second
    return new Promise((resolve) => {
      setTimeout(function () {
        resolve()
      }, second)
    })
  },

  /**
   * @function 递归函数
   * @param promise {Promise<any>}
   * @param resolve
   * @param reject
   * @param count {number} 第几次请求
   * @param totalCount {number} 请求次数
   * @private
   */
  recursion(promise, resolve, reject, count, totalCount) {
    let delayTime = (count * 2 - 1) * 1000
    this.delay(delayTime).then(() => {
      promise()
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          console.log('定时' + count, err)
          if (count >= totalCount) {
            reject(err)
            return
          }
          this.recursion(promise, resolve, reject, count + 1, totalCount)
        })
    })
  },

  /**
   * @function 请求重试函数
   * @param promise {Promise<any>}
   * @param totalCount {number} 请求次数
   * @returns {Promise<any>}
   */
  requestWithTry(promise, totalCount) {
    return new Promise((resolve, reject) => {
      let count = 0
      promise()
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          if (count >= totalCount) {
            reject(err)
            return
          }
          this.recursion(promise, resolve, reject, count + 1, totalCount)
        })
    })
  },
}

module.exports = {
  getPrivateKeys,
}
