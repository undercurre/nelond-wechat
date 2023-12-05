import { getEnv } from '../../../../../../config/index'
import { dec2hex } from 'm-utilsdk/index'
import { constantFun } from './constantFun'

/**
 * author : lisin
 * date   : 2021/10/28 9:30 AM
 * desc   : 设置ap配网指令相关参数
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

  setRegionId() {
    let tag = 3 //03
    let len = 4 //04
    let content = this.reverse(dec2hex(constantFun.getRegionId(), 8))
    return this.setParamsFormat(tag, len, content)
  },

  setModuleServerDomain() {
    let tag = 4 //04
    let domainHex = constantFun.getDefaultDomain()
    let len = domainHex.length / 2
    let content = domainHex
    return this.setParamsFormat(tag, len, content)
  },

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
  /**
   * 根据clusterId解析平台、集群、环境参数
   * @return {string} '0703'+平台+集群+环境
   */
  setAdsId() {
    // let clusterId = app.globalData.userData?.clusterId // 登录接口返回的clusterid（十进制）
    // if (!clusterId) return ''
    let tag = 7 // 07
    let len = 3 // 03
    // clusterId = dec2hex(clusterId, 6) // 十进制转换为十六进制
    // let platformId = clusterId.substring(0, 2) // 平台，01：国内美居，02：国际美居，03：国际东芝
    // let id = clusterId.substring(2, 4) // 集群，由各平台约定，默认(至少一个)：01（阿里云）04:（华为云）
    // let env = clusterId.substring(4, 6) // 环境，01：生产，02：sit，03：uat，04：dev
    // let content = platformId + id + env
    let content = `0101${getEnv() === 'prod' ? '01' : '02'}`
    return this.setParamsFormat(tag, len, content)
  },
}

export { apParamsSet }
