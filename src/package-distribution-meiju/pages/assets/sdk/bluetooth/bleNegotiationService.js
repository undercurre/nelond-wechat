/**
 * 蓝牙相关服务接口
 */
import { getReqId, getStamp } from 'm-utilsdk/index'
import { requestService } from '../../../../utils/requestService'
const bleNegotiationService = {
  /**
   * 开启蓝牙适配器
   */
  openAdapter() {
    return new Promise((resolve, rejcet) => {
      wx.openBluetoothAdapter({
        success(res) {
          resolve(res)
        },
        fail(error) {
          console.log('[open blue Adapter error]', error)
          rejcet(error)
        },
      })
    })
  },
  /**
   * 获取0101指令
   */
  acquirePublicKey() {
    return new Promise((resolve, reject) => {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('acquirePublicKey', reqData, 'POST', '', 3000)
        .then((resp) => {
          // console.log("01指令", resp.data.data.order01)
          resolve(resp.data.data.order01.replace(/,/g, ''))
        })
        .catch((error) => {
          console.log('[acquire PublicKey error]', error)
          reject(error)
        })
    })
  },
  /**
   * 上报云端返回公钥
   * @param {*} publicKey
   */
  generateSecretKey(publicKey) {
    return new Promise((resolve, reject) => {
      //   let publicKey = formatStr(respTempData)
      let reqData = {
        publicKey: publicKey,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      console.log('[上报云端返回公钥 reqData]', reqData)
      requestService
        .request('generateSecretKey', reqData)
        .then((resp) => {
          console.log('获得会话密钥为======0', resp.data)
          resolve(resp.data.data)
        })
        .catch((error) => {
          console.log('[generate SecretKey error]', error)
          reject(error)
        })
    })
  },
  /**
   * 密钥协商结果
   * @param {*} order
   */
  verifySecretKey(order) {
    return new Promise((resolve, reject) => {
      let reqData = {
        order: order, //formatStr(respTempData),
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('verifySecretKey', reqData)
        .then((resp) => {
          console.log('密钥协商结果=============1', resp.data)
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  /**
   * 获取绑定码指令
   * @param {*} sn
   * @param {*} modelType
   * @param {*} actionType
   */
  queryBindCode(sn, modelType, actionType) {
    return new Promise((resolve, reject) => {
      let reqData = {
        sn: sn, //formatStr(respTempData),
        reqId: getReqId(),
        stamp: getStamp(),
        modelType: modelType, //1代表ble, 2代表 bleWifi
        actionType: actionType, //1:确权后绑定  2：强制下发绑定码 3：校验绑定码
      }
      // console.log(`${(this.data.negType == 2) ? '下发绑定码请求参数' : '校验绑定码参数'}`, reqData)
      console.log('校验绑定码参数', reqData)
      requestService
        .request('queryBindCode', reqData)
        .then((resp) => {
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  /**
   * 云端校验绑定码结果
   * @param {*} order
   */
  bindCodeResult(order) {
    return new Promise((resolve, reject) => {
      let reqData = {
        order: order, //formatStr(respTempData.slice(0, 44)),
        reqId: getReqId(),
        stamp: getStamp(),
      }
      console.log('绑定码校验参数--------3', reqData)
      requestService
        .request('bindCodeResult', reqData)
        .then((resp) => {
          console.log('云端校验绑定码结果==========3', resp.data.data.result)
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  /**
   * 获取设备信息指令
   */
  getBluetoothApplianceInfo() {
    return new Promise((resolve, reject) => {
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('getBluetoothApplianceInfo', reqData)
        .then((resp) => {
          console.log('获取sn指令', resp.data.data.order63)
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
}

module.exports = {
  bleNegotiationService,
}
