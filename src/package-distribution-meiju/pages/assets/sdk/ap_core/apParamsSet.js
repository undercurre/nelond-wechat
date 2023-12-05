import { dec2hex } from 'm-utilsdk/index'
import { environment } from '../../../../common/js/api'

import { constantFun } from './constantFun'

/**
 * 设置ap配网指令相关参数
 */
const apParamsSet = {
  reverse(hex) {
    let arr = []
    for (var i = 0, len = hex.length; i < len; i += 2) {
      arr.push(hex.substr(i, 2))
    }
    return arr.reverse().join('').toLocaleLowerCase()
  },

  //参数格式拼接
  setParamsFormat(tag, len, content) {
    tag = dec2hex(tag, 2)
    len = dec2hex(len, 2)
    return tag + len + content
  },
  //需要回复密码错误
  setReplyPswError(isReply = true) {
    let tag = 1 //01
    let len = 1 //01
    let content = isReply ? '01' : '00'
    return this.setParamsFormat(tag, len, content)
  },

  //国家码、时区、信道 N:信道数
  setCountryTimezoneChannelList(N) {
    let tag = 2 //02
    let len = 4 + 4 * (N || 4) //14
    let countryCode = constantFun.getCountryCode()
    let timeZone = constantFun.getTimeZone()
    let channelNum = constantFun.getChannelNum()
    let channels = constantFun.getChannels()
    let content = countryCode + timeZone + channelNum + channels
    return this.setParamsFormat(tag, len, content)
  },

  //地区ID
  setRegionId() {
    let tag = 3 //03
    let len = 4 //04
    let content = this.reverse(dec2hex(constantFun.getRegionId(), 8))
    return this.setParamsFormat(tag, len, content)
  },

  //接入层服务器域名
  setModuleServerDomain() {
    let tag = 4 //04
    let domainHex = constantFun.getDefaultDomain()
    let len = domainHex.length / 2
    let content = domainHex
    return this.setParamsFormat(tag, len, content)
  },

  //接入层服务器端口
  setModuleServerPort() {
    let tag = 5 //05
    let port = constantFun.getDefaultPort()
    let len = port.length / 2 //02
    let content = port
    return this.setParamsFormat(tag, len, content)
  },

  //附加功能集
  setfeature() {
    let tag = 6 //06
    let len = 1 //01
    let content = '01' //01  国内：01 国外：02
    return this.setParamsFormat(tag, len, content)
  },

  //集群
  setAdsId(adId) {
    let tag = 7 //07
    let len = 3 //03
    let platformId = '01' //01  国内美居：01 国际美居：02  国际东芝：03
    let id = adId || '01'
    let env = environment == 'prod' ? '01' : '02'
    let content = platformId + id + env
    return this.setParamsFormat(tag, len, content)
  },
}

export { apParamsSet }
