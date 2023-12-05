import { Logger, emitter } from './index'
import { peekNetwork } from '../apis/index'

let isConnectStatus = true
let networkType = 'unknown'
let weakNet = false

/**
 * @description 访问云端服务根地址，以快速判断网络是否畅通
 * !! 如果处于非WIFI状态，直接根据监听结果判断即可，不必使用此方法
 */
export async function verifyNetwork() {
  const res = await peekNetwork()

  // HACK 安卓和IOS返回不一致
  const newStatus =
    res.msg.indexOf('timeout') === -1 && res.msg.indexOf('time out') === -1 && res.msg.indexOf('UNREACHABLE') === -1
  Logger.log('连网状态验证:', res, isConnectStatus, newStatus)

  if (newStatus !== isConnectStatus) {
    isConnectStatus = newStatus
    emitter.emit('networkStatusChange', {
      networkType,
      isConnectStatus,
    })
    emitter.emit('deviceListRetrieve')
  }
}

export function isConnect() {
  return isConnectStatus
}

export function getNetworkType() {
  return networkType
}

export function isWeakNet() {
  return weakNet
}

const networkListener = (res: WechatMiniprogram.OnNetworkStatusChangeListenerResult) => {
  Logger.debug('网络状态变化:', res)

  networkType = res.networkType

  // WIFI 状态下 networkStatusListen 监听不到连接状态，需要手动调用 verifyNetwork()
  if (networkType === 'wifi' || networkType === 'unknown') {
    verifyNetwork()
  } else {
    const newStatus = res.isConnected
    if (newStatus !== isConnectStatus) {
      isConnectStatus = newStatus
      emitter.emit('networkStatusChange', {
        networkType,
        isConnectStatus,
      })
      emitter.emit('deviceListRetrieve')
    }
  }
}

const networkWeakListener = (res: WechatMiniprogram.OnNetworkWeakChangeListenerResult) => {
  Logger.debug('弱网状态变化:', res)
  weakNet = res.weakNet
  networkType = res.networkType
}

// 监听网络状态，但无法判断WIFI是否可以访问外网
export function networkStatusListen() {
  wx.onNetworkStatusChange(networkListener)
  wx.onNetworkWeakChange(networkWeakListener)
}

export function removeNetworkStatusListen() {
  wx.offNetworkStatusChange(networkListener)
  wx.offNetworkWeakChange(networkWeakListener)
}
