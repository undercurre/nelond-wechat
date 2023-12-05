/*
 * @desc: datarangers SDK升级
 * @author: zhucc22
 * @Date: 2023-04-26 09:37:08
 */
import { environment } from '../common/js/api'

import $$Rangers from '@datarangers/sdk-mp'
const rangersInit = () => {
  $$Rangers.init({
    app_id: environment === 'dev' || environment === 'sit' ? 10000080 : 10000030, // APP_ID区分环境
    channel_domain: 'https://iotsdk.midea.com', //自定义上报域名
    auto_report: true,
    report_channel: 'cn',
    log: false, // 是否打印 log，默认打印
    enable_ab_test: true, //开启ab实验能力
    enable_storage: true, //开启异常储存
  })
  $$Rangers.config({
    evtParams: {
      user_name: 'ranger', // 每个事件上报时都会带上这个参数
    },
    _staging_flag: 0,
    app_name: '美的美居Lite微信小程序',
    version: 'v2.33.1',
    user_id: '',
    user_type: '',
    nick_name: '',
    gender: '',
    avatar_url: '',
    mp_platform: 0,
    // city: '',
    // province: '',
    // region: '',
  })
  $$Rangers.send() // 设置完毕，可以发送事件了
  return $$Rangers
}

module.exports = {
  rangersInit,
}
