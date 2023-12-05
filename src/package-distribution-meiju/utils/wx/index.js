import { isEmptyObject } from 'm-utilsdk/index'
import app from '../../common/app'
/**
 * 获取系统信息 同 wx.getSystemInfo
 * @param {Object} params 非必填
 * @return Promise
 */
const getWxSystemInfo = (params = {}) => {
  const defaultOptions = {
    success: null,
    fail: null,
    complete: null,
  }
  const options = Object.assign(
    {
      forceUpdate: false,
    },
    defaultOptions,
    params,
  )
  // forceUpdate 是否强制更新  success, fail, complete 与微信wx.getSystemInfo传参一致
  const { forceUpdate, success, fail, complete } = options
  return new Promise((resolve, reject) => {
    let systemInfo = app && app.globalData.systemInfo
    if (forceUpdate) {
      wx.getSystemInfo({
        success: (res) => {
          wx.nextTick(() => {
            app.globalData.systemInfo = res
          })
          console.log('getWxSystemInfo, success, forceUpdate', res)
          success && success(res)
          resolve(res)
        },
        fail: (e) => {
          console.log('getWxSystemInfo, fail, forceUpdate', e)
          fail && fail(e)
          reject(e)
        },
        complete: (e) => {
          complete && complete(e)
        },
      })
    } else {
      if (systemInfo && !isEmptyObject(systemInfo)) {
        console.log('getWxSystemInfo, 缓存数据', systemInfo)
        resolve(systemInfo)
        try {
          wx.getSystemInfoAsync({
            success(res) {
              console.log('getWxSystemInfo, getSystemInfoAsync,更新缓存数据', res)
              wx.nextTick(() => {
                app.globalData.systemInfo = res
              })
            },
          })
        } catch (error) {
          console.log(error, 'getSystemInfoAsync error')
        }
      } else {
        wx.getSystemInfo({
          success: (res) => {
            wx.nextTick(() => {
              app.globalData.systemInfo = res
            })
            console.log('getWxSystemInfo, 请求微信接口获取SystemInfo success', res)
            success && success(res)
            resolve(res)
          },
          fail: (e) => {
            console.log('getWxSystemInfo, 请求微信接口获取SystemInfo fail', e)
            fail && fail(e)
            reject(null)
          },
          complete: (e) => {
            complete && complete(e)
          },
        })
      }
    }
  })
}

/**
 * 获取wx.getSetting
 * @param {Object} params 非必填
 * @returns Promise
 */
const getWxGetSetting = (params = {}) => {
  const defaultOptions = {
    withSubscriptions: false,
    success: null,
    fail: null,
    complete: null,
  }
  const options = Object.assign(
    {
      forceUpdate: false,
    },
    defaultOptions,
    params,
  )
  // forceUpdate 是否强制更新  success, fail, complete 与微信wx.getSetting传参一致
  const { forceUpdate, withSubscriptions, success, fail, complete } = options
  return new Promise((resolve, reject) => {
    let wxSettingInfo = app && app.globalData.wxSettingInfo
    if (forceUpdate) {
      wx.getSetting({
        withSubscriptions,
        success: (res) => {
          wx.nextTick(() => {
            app.globalData.wxSettingInfo = res
          })
          console.log('getWxGetSetting, success, forceUpdate', res)
          success && success(res)
          resolve(res)
        },
        fail: (e) => {
          console.log('getWxGetSetting, fail, forceUpdate', e)
          fail && fail(e)
          reject(e)
        },
        complete: (e) => {
          complete && complete(e)
        },
      })
    } else {
      if (wxSettingInfo && !isEmptyObject(wxSettingInfo)) {
        console.log('getSetting, 缓存数据', wxSettingInfo)
        success && success(wxSettingInfo)
        resolve(wxSettingInfo)
      } else {
        wx.getSetting({
          withSubscriptions,
          success: (res) => {
            wx.nextTick(() => {
              app.globalData.wxSettingInfo = res
            })
            console.log('getSetting, 请求微信接口获取setting success', res)
            success && success(res)
            resolve(res)
          },
          fail: (e) => {
            console.log('getSetting, 请求微信接口获取setting e', e)
            fail && fail(e)
            reject(e)
          },
          complete: (e) => {
            complete && complete(e)
          },
        })
      }
    }
  })
}

module.exports = {
  getWxSystemInfo,
  getWxGetSetting,
}
