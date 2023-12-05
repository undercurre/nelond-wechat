import { getTimeStamp, getReqId, getStamp } from 'm-utilsdk/index'
import { requestService } from '../../../utils/requestService'

const service = {
  //设备确权状态
  getApplianceAuthType(applianceCode) {
    let reqData = {
      applianceCode: applianceCode,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getApplianceAuthType', reqData)
        .then((resp) => {
          console.log('查询确权状态', resp)
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  getIotDeviceV3() {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getIotDeviceV3', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  // 获取非智能设备
  getNonIntelligentIotDeviceV(homegroupId) {
    let reqData = {
      homegroupId: homegroupId,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getNonIntelligentIotDeviceV', reqData)
        .then((resp) => {
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  //校验从nfc过来的数据
  fromNfcAction(options) {
    const query = options.query
    const data = {
      uuid: query.nfcid || '',
      randomCode: query.rc || '',
      reqId: getReqId(),
      stamp: getTimeStamp(new Date()),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('nfcBindGet', data)
        .then((res) => {
          console.log('nfc 获取设备绑定的详情1', res.data.data)
          resolve(res)
        })
        .catch((err) => {
          console.log('nfc 获取设备绑定的详情2', err)
          reject(err)
        })
    })
  },
}

function pad0(org, num) {
  org = org.toString()
  if (org.length >= num) {
    return org
  }
  var zero = ''
  for (var i = 0; i < num - org.length; i++) {
    zero += '0'
  }
  var all = zero + org
  return all
}
export { service, pad0 }
