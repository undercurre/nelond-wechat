import { getWxSystemInfo, getWxGetSetting } from './index.js'
import { hasKey } from 'm-utilsdk/index'

/**
 * 获取systeminfo
 * @param {Object} params 非必填
 * @returns Promise
 */
const checkAndGetWxSystemInfo = async (params = {}) => {
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
  // forceUpdate 是否强制更新  success, fail, complete 与微信wx.getSetting传参一致
  const { forceUpdate, success, fail, complete } = options
  const wxSystemInfo = await getWxSystemInfo()
  const hasLocationAuthorized = wxSystemInfo?.locationEnabled && wxSystemInfo?.locationAuthorized
  let hasBluetoothAuthorized = true
  //部分安卓手机wx.getSystemInfo方法不会返回bluetoothAuthorized 属性值，微信是否授予蓝牙权限
  if (hasKey(wxSystemInfo, 'bluetoothAuthorized')) {
    hasBluetoothAuthorized = wxSystemInfo?.bluetoothEnabled && wxSystemInfo?.bluetoothAuthorized
  } else {
    hasBluetoothAuthorized = wxSystemInfo?.bluetoothEnabled
  }
  if (forceUpdate || !hasLocationAuthorized || !hasBluetoothAuthorized) {
    return getWxSystemInfo({ forceUpdate: true, success, fail, complete })
  } else {
    return getWxSystemInfo(options)
  }
}

/**
 * 获取getSetting
 * @param {Object} params 非必填
 * @returns Promise
 */
const checkAndGetWxGetSetting = async (params = {}) => {
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
  const wxSettingInfo = await getWxGetSetting()
  if (
    forceUpdate ||
    !wxSettingInfo['authSetting']['scope.userLocation'] ||
    !wxSettingInfo['authSetting']['scope.bluetooth']
  ) {
    return getWxGetSetting({ forceUpdate: true, withSubscriptions, success, fail, complete })
  } else {
    return getWxGetSetting(options)
  }
}

/**
 * 校验是否可以使用微信api
 * @param {String} wxApi 例：校验 wx.openBluetoothAdapter()是否可以使用 传入 'openBluetoothAdapter'
 * @param {Boolean} showModal 是否显示更新微信版本提示弹窗
 * @returns {Boolean} true - 可以使用 false - 不可以使用
 */
const checkCanIUserWxApi = (wxApi, showModal) => {
  if (wxApi && wx[wxApi]) {
    return true
  } else {
    // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
    if (showModal) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
      })
    }
    return false
  }
}

module.exports = {
  checkAndGetWxSystemInfo,
  checkAndGetWxGetSetting,
  checkCanIUserWxApi,
}
