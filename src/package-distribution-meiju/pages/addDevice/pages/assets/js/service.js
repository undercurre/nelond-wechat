import { getTimeStamp, getReqId, getStamp } from 'm-utilsdk/index'
import { requestService } from '../../../../../utils/requestService'
import { mockData } from './mockData'
const isMock = false

const service = {
  getApplianceService(homegroupId) {
    //获取用户家庭设备列表
    return new Promise((resolve, reject) => {
      if (isMock) {
        let resp = {
          data: mockData.applianceList,
        }
        if (resp.data.code == 0) {
          resolve(resp.data.data.homeList[0] || {})
        } else {
          reject(resp)
        }
        return
      }

      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        homegroupId: homegroupId,
      }
      requestService.request('applianceList', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data.homeList[0] || {})
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
  //遥控器设备绑定 {applianceName,sn,applianceType,mac,modelNumber,homegroupId}
  bindRemoteDevice(bindInfo) {
    //获取用户家庭设备列表
    return new Promise((resolve, reject) => {
      if (isMock) {
        let resp = {
          data: mockData.bindRemoteDeviceResp,
        }
        if (resp.data.code == 0) {
          resolve(resp.data.data || {})
        } else {
          reject(resp)
        }
        return
      }
      let defaultData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      let reqData = Object.assign(defaultData, bindInfo)
      console.log('遥控设备绑定参数', reqData)
      requestService.request('bindRemoteDevice', reqData).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data || {})
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
}
export { service }
