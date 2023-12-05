/*
 * @desc: sdk升级配置文件
 * @author: zhucc22
 * @Date: 2023-07-11 14:03:36
 */
import requestService from 'm-miniBaseSDK/requestService'
import deviceSubscribe from 'm-miniBaseSDK/deviceSubscribe'
import { api } from '../common/js/api'
import config from '../common/js/config'
import { deviceImgMap } from './deviceImgMap'

//初始化接口请求sdk
const requestServiceInit = new requestService({
  api: api,
  config: config,
  deviceImgMap: deviceImgMap,
})
//初始化消息推送sdk
const deviceSubscribeInit = new deviceSubscribe({
  requestService: requestServiceInit.requestService,
})

const globalCommonConfig = {
  requestService: requestServiceInit.requestService,
  uploadFileTask: requestServiceInit.uploadFileTask,
  pluginApiTrack: requestServiceInit.pluginApiTrack,
  getTemplateId: deviceSubscribeInit.getTemplateId,
  getSnTicket: deviceSubscribeInit.getSnTicket,
  openSubscribeModal: deviceSubscribeInit.openSubscribeModal,
  openDisposableSubscribeModal: deviceSubscribeInit.openDisposableSubscribeModal,
}

module.exports = {
  requestServiceInit,
  globalCommonConfig,
}
