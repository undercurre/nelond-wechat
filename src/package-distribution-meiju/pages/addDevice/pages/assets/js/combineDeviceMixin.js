/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import app from '../../../../../common/app'
import { getReqId, getStamp } from 'm-utilsdk'
import { requestService } from '../../../../../utils/requestService'
// eslint-disable-next-line no-undef
module.exports = Behavior({
  data: {
    isStopGetExists: false, //是否停止查询设备已连上云
  },
  methods: {
    /**
     * 轮询 批量查询设备是否连上路由器
     * @param {*} sn 辅设备/离线设备的sn
     * @param {*} forceValidRandomCode
     * @param {*} randomCode
     * @param {*} timeout
     * @param {*} callBack
     * @param {*} callFail
     */
    againBatchGetAPExists(sn, forceValidRandomCode, randomCode = '', timeout, callBack, callFail) {
      let timeoutID
      const this_ = this
      const timeoutPromise = new Promise((resolve, reject) => {
        timeoutID = setTimeout(reject, 5000, 'WEB TIMEOUT')
      })
      Promise.race([timeoutPromise, this.batchCheckApExists(sn, forceValidRandomCode, randomCode, timeout)])
        .then((resp) => {
          callBack && callBack(resp.data.data)
        })
        .catch((error) => {
          if (this.data.isStopGetExists) return
          if (error.data && error.data.code) {
            setTimeout(() => {
              this_.againBatchGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
            }, 2000)
          } else {
            console.warn('请求超时', error.data)
            let time = 2000
            if (
              (error.errMsg && error.errMsg.includes('ERR_NAME_NOT_RESOLVED')) ||
              (error.errMsg && error.errMsg.includes('ERR_CONNECTION_ABORTED'))
            ) {
              console.log('ERR_NAME_NOT_RESOLVED', error)
              time = 7000
            }
            setTimeout(() => {
              this.againBatchGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
            }, time)
            callFail && callFail(error)
          }
        })
        .finally(() => clearTimeout(timeoutID))
    },

    /**
     * 批量查询设备是否连上路由器
     * @param {Array} sn 辅设备/离线设备的sn
     * @param {*} forceValidRandomCode
     * @param {*} randomCode
     * @param {*} timeout
     */
    batchCheckApExists(sn = [], forceValidRandomCode, randomCode = '', timeout) {
      const this_ = this
      return new Promise((resolve, reject) => {
        let reqData = {
          sns: sn,
          forceValidRandomCode: forceValidRandomCode,
          randomCode: randomCode,
          reqId: getReqId(),
          stamp: getStamp(),
        }
        console.log('batchCheckApExists reqData:', reqData)
        requestService
          .request('batchCheckApExists', reqData, 'POST', '', timeout)
          .then((resp) => {
            console.log(
              '@module combineDeviceMixin.js\n@method batchCheckApExists\n@desc 批量查询设备是否连上路由器\n',
              resp,
            )
            if (resp.data.code == 0) {
              let list = resp.data.data.list
              let arr2 = list.map((value, key) => {
                if (value.sn == sn[0] && value.code == 0) {
                  // 辅设备成功连上云
                  this_.data.isStopGetExists = true
                  return value
                }
              })
              if (this_.data.isStopGetExists) {
                resolve(resp)
              } else {
                reject(resp)
              }
            } else {
              reject(resp)
            }
          })
          .catch((error) => {
            console.warn(
              '@module combineDeviceMixin.js\n@method againBatchGetAPExists\n@desc 批量查询设备是否连上路由器\n',
              error,
            )
            reject(error)
          })
      })
    },
    /**
     * 批量绑定设备到指定的家庭组和房间
     * @param {*} singleHomeBindReqs
     */
    batchBindDeviceToHome(singleHomeBindReqs) {
      const this_ = this
      let reqData = null
      reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        singleHomeBindReqs: singleHomeBindReqs,
      }
      console.log('batch bind reqData===', reqData)
      return new Promise((reslove, reject) => {
        requestService
          .request('batchBindDeviceToHome', reqData, 'POST', '', 3000)
          .then((resp) => {
            console.log('@module combineDeviceMixin.js\n@method batchBindDeviceToHome\n@desc 批量绑定设备结果\n', resp)
            const data_ = resp.data.data
            if (resp.data.code == 0) {
              if (data_.failList.length == 0) {
                console.log('-----批量绑定成功')
                reslove(resp)
              } else {
                console.error('-----批量绑定失败')
                reject(resp)
              }
            }
          })
          .catch((error) => {
            console.error(
              '@module combineDeviceMixin.js\n@method batchBindDeviceToHome\n@desc 批量绑定设备错误\n',
              error,
            )
            reject(error)
          })
      })
    },
    /**
     * 生成组合设备
     * @param {*} activeMap
     */
    generateCombinedDevice(activeMap) {
      let reqData = null
      reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        activeMap: activeMap,
        roomId: app.globalData.currentRoomId,
        homegroupId: app.globalData.currentHomeGroupId,
      }
      console.log('generateCombinedDevice reqData===', reqData)
      return new Promise((reslove, reject) => {
        requestService
          .request('generateCombinedDevice', reqData, 'POST', '', 3000)
          .then((resp) => {
            console.log(
              '@module combineDeviceMixin.js\n@method generateCombinedDevice\n@desc 组合设备结果\n',
              resp.data,
            )
            if (resp.data.code == 0) {
              reslove(resp.data)
            }
          })
          .catch((error) => {
            console.error('@module combineDeviceMixin.js\n@method generateCombinedDevice\n@desc 组合设备结果\n', error)
            reject(error)
          })
      })
    },
  },
})
