/**
 * tcp相关服务接口
 */
import { apUtils } from '../ap_core/apUtils'
import { apParamsSet } from '../ap_core/apParamsSet'
import { string2Uint8Array, toHexString } from 'm-utilsdk/index'

const apService = {
  /**
   * 组装tcp消息体，通过tcp发送到设备（ssid,password)
   * @param {*} bindWifiInfo
   */
  constrLinknetorder(bindWifiInfo, randomCode) {
    // let bindWifiInfo = bindWifiInfo
    let order = {}
    order.randomCode = randomCode //getRandomString(32).toLocaleLowerCase() //'241205fca8bb549178cd1e5b7c4f8893'
    // this.data.randomCode = order.randomCode
    order.ssidLen = toHexString([bindWifiInfo.SSIDLength])
    order.ssidcontent = toHexString(string2Uint8Array(bindWifiInfo.SSIDContent))
    order.pswlen = toHexString([bindWifiInfo.PswLength]) || '00'
    order.psw = toHexString(string2Uint8Array(bindWifiInfo.PswContent)) || ''
    order.bssidLen = toHexString([bindWifiInfo.BSSID.split(':').join('').length / 2])
    order.bssid = bindWifiInfo.BSSID.split(':').join('')
    order.gbkssidLen = toHexString([bindWifiInfo.SSIDLength]) //backUp ssid
    order.gbkssid = toHexString(string2Uint8Array(bindWifiInfo.SSIDContent))
    order.chain = '00' //信道  toHexString([bindWifiInfo.chain])`````````````````````
    order.setReplyPswError = apParamsSet.setReplyPswError()
    order.setCountryTimezoneChannelList = apParamsSet.setCountryTimezoneChannelList()
    order.setRegionId = apParamsSet.setRegionId()
    order.setModuleServerDomain = apParamsSet.setModuleServerDomain()
    order.setModuleServerPort = apParamsSet.setModuleServerPort()
    order.setfeature = apParamsSet.setfeature()
    order.setAdsId = apParamsSet.setAdsId()

    console.log(' order============', order)
    order.total = Object.values(order).join('')
    console.log(' order.total==', order.total)
    let params = {
      type: '0070',
      body: order.total,
    }
    let order7000 = apUtils.construOrder(params)
    return order7000
  },
}

module.exports = {
  apService,
}
