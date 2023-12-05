/**
 * 设备连接页面通用方法
 */
import app from '../../../../common/app'
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'
import { creatErrorCode } from './errorCode'
const linkDeviceService = {
  /**
   * 获取家庭信息
   * @param {*} groupId
   * @param {*} retryNum
   * @param {*} timeout
   */
  getFamilyInfo(groupId, retryNum = 3, timeout = 2000) {
    let reqData = {
      homegroupId: groupId,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('applianceList', reqData, 'POST', '', timeout)
        .then((resp) => {
          app.globalData.isCreateFamily =
            resp.data.data.homeList[0].roleId == '1001' || resp.data.data.homeList[0].roleId == '1002' //是否是当前家庭的创建者
          resolve(resp)
        })
        .catch((error) => {
          if (retryNum > 0) {
            retryNum--
            setTimeout(() => {
              //继续重试
              this.getFamilyInfo(groupId, retryNum, timeout)
            }, 2000)
          } else {
            reject(error)
          }
        })
    })
  },
  /**
   * 查询设备是否连上云
   * @param {*} sn
   * @param {*} randomCode
   * @param {*} callBack
   * @param {*} callFail
   */
  checkApExists(sn, randomCode = '', timeout) {
    return new Promise((resolve, reject) => {
      let reqData = {
        sn: sn,
        forceValidRandomCode: randomCode ? true : false,
        randomCode: randomCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      console.log(`查询设备是否连上云参数 reqData=${JSON.stringify(reqData)},plainSn=${app.addDeviceInfo.plainSn}`)
      requestService
        .request('checkApExists', reqData, 'POST', '', timeout)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          console.log('查询设备是否连上云 error', error)
          if (error.data) {
            app.addDeviceInfo.errorCode = creatErrorCode({
              errorCode: error.data.code,
              isCustom: true,
            })
          }
          if (app.addDeviceInfo && app.addDeviceInfo.mode == 0) {
            //
            if (error.data && error.data.code == 1384) {
              //随机数校验不一致
              app.addDeviceInfo.errorCode = creatErrorCode({
                errorCode: 4169,
                isCustom: true,
              })
            }
          }
          reject(error)
        })
    })
  },
  /**
   * 帐号绑定
   * 
   * 参数格式
   *  let reqData = {
      type,
      sn8,
      plainSn,
      moduleVersion,
      linkType,
      deviceName,
      currentHomeGroupId,
      currentRoomId,
      verificationCodeKey,
      verificationCode,
      btMac,
      bindType
    }
   * @param {*} reqData 
   */
  bindDeviceToHome(reqData) {
    return new Promise((reslove, reject) => {
      requestService
        .request('bindDeviceToHome', reqData, 'POST', '', 3000)
        .then((resp) => {
          if (resp.data.code == 0) {
            reslove(resp)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
}

module.exports = {
  linkDeviceService,
}
