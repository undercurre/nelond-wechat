import { dec2hex } from 'm-utilsdk/index'
import { constantFun } from './constantFun'
import app from '../../../../../common/app'

/**
 * author : lisin
 * date   : 2021/10/28 9:30 AM
 * desc   : 设置blue配网指令相关参数
 */

const blueParamsSet = {
  reverse(hex) {
    let arr = []
    for (var i = 0, len = hex.length; i < len; i += 2) {
      arr.push(hex.substr(i, 2))
    }
    return arr.reverse().join('').toLocaleLowerCase()
  },

  setRegionId() {
    return this.reverse(dec2hex(constantFun.getRegionId(), 8))
  },

  //附加功能集
  setfeature() {
    return '01' //01  国内：01 国外：02
  },

  //国家码、时区
  setCountryTimezone(N) {
    let countryCode = constantFun.getCountryCode()
    let timeZone = constantFun.getTimeZone()
    return countryCode + timeZone
  },

  setModuleServerDomain() {
    let domainHex = constantFun.getDefaultDomain()
    let len = dec2hex(domainHex.length / 2, 2)
    return len + domainHex
  },

  setModuleServerPort() {
    return constantFun.getDefaultPort()
  },

  setChannels() {
    let channelNum = constantFun.getChannelNum()
    let channels = constantFun.getChannels()
    return channelNum + channels
  },
  /**
   * 根据clusterId解析平台、集群、环境参数
   * @return {string} 平台+集群+环境
   */
  setAdsId() {
    let clusterId = app.globalData.userData?.clusterId // 登录接口返回的clusterid（十进制）
    if (!clusterId) return ''
    clusterId = dec2hex(clusterId, 6) // 十进制转换为十六进制
    let platformId = clusterId.substring(0, 2) // 平台，01：国内美居，02：国际美居，03：国际东芝
    let id = clusterId.substring(2, 4) // 集群，由各平台约定，默认(至少一个)：01（阿里云）04:（华为云）
    let env = clusterId.substring(4, 6) // 环境，01：生产，02：sit，03：uat，04：dev
    let content = platformId + id + env
    return content
  },
}

export { blueParamsSet }
