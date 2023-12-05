// 设备能力开关、授权相关

import { isAndroid, Logger } from './index'
import Dialog from '@vant/weapp/dialog/dialog'

/**
 * @description
 * @param mode 'peripheral' 从机模式, 'central' 主机模式
 * 前置条件：用户授权：需要 scope.bluetooth；小程序发布时选择“引用用户隐私”
 */
export const checkWxBlePermission = async () => {
  // 初始化蓝牙模块
  const openBleRes = (await wx
    .openBluetoothAdapter({ mode: 'peripheral' })
    .catch((err: WechatMiniprogram.BluetoothError) => err)) as WechatMiniprogram.BluetoothError & { errno?: number }
  // IOS
  const openCenterBleRes = (await wx
    .openBluetoothAdapter({ mode: 'central' })
    .catch((err: WechatMiniprogram.BluetoothError) => err)) as WechatMiniprogram.BluetoothError & { errno?: number }

  Logger.console('[openBluetoothAdapter]', openBleRes)
  Logger.console('[openCenterBleAdapterForIOS]', openCenterBleRes)

  // 判断是否授权蓝牙 安卓、iOS返回错误格式不一致
  if (openBleRes.errno === 103 || openBleRes.errMsg.includes('auth deny')) {
    return false
  }
  return true
}

/**
 * 检查小程序蓝牙权限
 */
export const consultWxBlePermission = async () => {
  const isWxBlePermit = await checkWxBlePermission()
  if (isWxBlePermit) {
    return true
  }

  Dialog.confirm({
    title: '请授权小程序使用蓝牙',
    cancelButtonText: '知道了',
    confirmButtonText: '去设置',
    confirmButtonOpenType: 'openSetting', // 确认按钮的微信开放能力
  }).catch(() => Logger.error('WxBlePermission Refused'))

  return false
}

/**
 * 检查系统蓝牙开关、对微信的授权
 */
export const consultSystemBlePermission = async () => {
  const systemSetting = wx.getSystemSetting()
  Logger.log('[getSystemSetting]', systemSetting)
  let isSystemBlePermit = systemSetting.bluetoothEnabled

  if (isSystemBlePermit) {
    return true
  }

  Dialog.confirm({
    title: '请打开手机蓝牙开关并授权微信使用',
    cancelButtonText: '知道了',
    confirmButtonText: '查看指引',
    zIndex: 999999,
  })
    .then(() => {
      wx.navigateTo({
        url: '/package-mine/guideline/index?type=bleEnable',
      })
    })
    .catch(() => Logger.error('未查看指引'))

  // 监听蓝牙状态的变化
  const listen = (res: WechatMiniprogram.OnBluetoothAdapterStateChangeCallbackResult) => {
    isSystemBlePermit = res.available

    if (res.available) {
      Logger.log('System Ble Adapter Ready')
      wx.offBluetoothAdapterStateChange(listen)
    }
  }
  wx.onBluetoothAdapterStateChange(listen)

  return false
}

/**
 * 检查系统位置信息开关、对微信的授权
 */
let _listenLocationTimeId = 0 // 监听系统位置信息是否打开的计时器， 0为不存在监听
export const consultSystemLocation = async () => {
  if (_listenLocationTimeId) {
    return
  }

  const systemSetting = wx.getSystemSetting()

  if (systemSetting.locationEnabled) {
    return true
  }

  Dialog.confirm({
    title: '请打开手机系统的位置信息开关',
    cancelButtonText: '知道了',
    confirmButtonText: '查看指引',
  })
    .then(() => {
      wx.navigateTo({
        url: '/package-mine/guideline/index?type=bleEnable',
      })
    })
    .catch(() => Logger.error('未查看指引'))

  // 轮询设备
  _listenLocationTimeId = setInterval(() => {
    const systemSetting = wx.getSystemSetting()

    if (systemSetting.locationEnabled) {
      clearInterval(_listenLocationTimeId)
      _listenLocationTimeId = 0
      initBleCapacity()
    }
  }, 3000)

  return false
}

/**
 * @description 初始化蓝牙模块，只检查权限，未实质打开服务
 */
export const initBleCapacity = async () => {
  Logger.log('initBleCapacity triggered')
  // 微信蓝牙权限是否开启
  const isWxBlePermit = await consultWxBlePermission()
  if (!isWxBlePermit) {
    return false
  }
  Logger.log({ isWxBlePermit })

  // 系统蓝牙权限是否开启
  const isSystemBlePermit = await consultSystemBlePermission()
  if (!isSystemBlePermit) {
    return false
  }
  Logger.log({ isSystemBlePermit })

  // 安卓需要同时打开位置开关及权限
  if (isAndroid()) {
    consultSystemLocation()
  }

  return true
}
