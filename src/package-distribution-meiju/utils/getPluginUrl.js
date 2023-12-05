/*
 * @desc: 插件页跳转页面统一处理
 * @author: zhucc22
 * @Date: 2023-08-01 10:34:47
 */
import { newPluginUrl, PluginUrl } from './paths'
import { newPluginConfig } from './newPluginConfig' //测试数据

function getPluginUrl(type, deviceInfo) {
  type = type.includes('0x') ? type : `0x${type}`
  let url = newPluginConfig.includes(type) ? newPluginUrl : PluginUrl
  if (deviceInfo) {
    return url + `/T${type}/index/index?deviceInfo=` + encodeURIComponent(deviceInfo)
  } else {
    return url + `/T${type}/index/index`
  }
}

module.exports = {
  getPluginUrl,
}
