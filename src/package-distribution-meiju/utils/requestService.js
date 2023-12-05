import { getStamp, hasKey } from 'm-utilsdk/index'
import { api } from '../common/js/api'

import qs from './qs/index'

var requestService = {
  request: (apiName, params, method, headerObj, timeout) => {},
  getErrorMessage: (code) => {
    return errorList[code] || '未知系统错误'
  },
  //colmo获取设备列表
  getColmoProductList: (data = {}, context, headerOpt = {}) => {
    let params = {
      codeType: 'colmo',
      code: 2647911997,
    }
    let url = api.getColmoProductList.url + `&${qs.stringify(params)}`
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        data,
        method: 'POST',
        timeout: 12000,
        header: {
          'Content-Type': 'application/json;charset=utf-8',
          ...headerOpt,
        },
        success(res) {
          const { statusCode, data } = res
          if (statusCode === 200 && data.code === 0 && data.data) {
            resolve(data.data)
          } else {
            reject()
          }
        },
        fail(e) {
          reject(e)
        },
      })
    })
  },
}

//上传文件接口通用封装
var uploadFileTask = function (params) {
  return new Promise((resolve, reject) => {
    let timestamp = getStamp()
    wx.uploadFile({
      url: params.url,
      filePath: params.filePath,
      name: 'file',
      header: {
        'Content-Type': 'multipart/form-data',
        timestamp,
        accessToken: getApp()?.globalData?.userData?.mdata.accessToken,
        iotAppId: api.iotAppId,
      },
      formData: {
        file: params.contentStr,
      },
      success(res) {
        if (res.statusCode == '200') {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail(err) {
        console.log(err)
        reject(err)
      },
    })
  })
}

var errorList = {
  1000: '未知系统错误',
  1002: '参数为空',
  1110: '第三方账户没有绑定手机账户',
  1217: '该邀请无效',
  1102: '没有进行手机认证或者手机认证已过期',
  1103: '手机认证随机码不匹配',
  1109: '第三方账户token认证失败',
  1105: '手机账户不存在',
  1200: '用户不在家庭里面（没有权限的错误之一）',
  1202: '用户没有邀请加入家庭的权限',
  1219: '该邀请已被其他用户使用，请联系邀请者重新邀请',
  1220: '该邀请已过期，请联系邀请者重新邀请',
}
const getHeaderContentType = (header) => {
  if (!header) return 'application/json'
  if (hasKey(header, 'content-type')) {
    return header['content-type']
  } else {
    return 'application/json'
  }
}

//如果该设备卡片缓存的是不支持确权或已确权，但mjl/v1/device/status/lua/get接口报1321错误码，则进入后确权页面进行确权
function deviceCardToPlugin(applianceCode) {
  let pages = getCurrentPages()
  let currentPage = pages[pages.length - 1]
  //只有当前进入插件页，才跳后确权页
  if (!currentPage.route.includes('plugin')) {
    console.log('aaaaa从页面跳进来', currentPage.route)
    return
  }
  if (currentPage.route.includes('afterCheck')) return //进入插件页lua/get接口会重复请求，避免多次进入后确权页
  if (getApp().globalData.noAuthApplianceCodeList.includes(applianceCode)) {
    wx.reLaunch({
      url: '/package-distribution-meiju/pages/addDevice/pages/afterCheck/afterCheck?backTo=/pages/index/index',
    })
  }
}

export { requestService, uploadFileTask }
