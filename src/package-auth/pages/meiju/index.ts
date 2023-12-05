import { ComponentWithComputed } from 'miniprogram-computed'
import { getEnv, getH5BaseUrl } from '../../../config/index'
import { strUtil } from '../../../utils/index'

// 美居登录页面调整配置
const meijuLoginMap = {
  dev: {
    domain: 'https://api-sit.smartmidea.net',
    client_id: '5324570e51b5048bf74a27b97f0178e2',
  },
  sit: {
    domain: 'https://api-sit.smartmidea.net',
    client_id: '6f54fcabcf63943cd8793d193bb3b139',
  },
  prod: {
    domain: 'https://api-prod.smartmidea.net',
    client_id: 'e7dcf22e23bcc7d574aa7d9b1d45736b',
  },
}

ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    webviewSrc: '',
  },
  computed: {},

  lifetimes: {
    ready() {
      const env = getEnv()
      const config = meijuLoginMap[env]

      this.setData({
        webviewSrc: strUtil.getUrlWithParams(`${config.domain}/v2/open/oauth2/authorize`, {
          client_id: config.client_id,
          state: 1,
          response_type: 'code',
          redirect_uri: strUtil.getUrlWithParams(`${getH5BaseUrl()}/index.html`, {
            miniProgramUrl: '/package-auth/pages/home-list/index',
          }),
        }),
      })
    },
  },

  methods: {
    onWebviewLoad(e: { detail: { src: string } }) {
      const src = e.detail.src
      console.log('bindload', src)
      // 已在美智h5页面范围，并且未带token，则更新webviewSrc
      // if (src.indexOf(MEIJU_DOMAIN) === -1 && src.indexOf('tr=') === -1) {
      //   // token 反转发送，稍提高安全性
      //   const tr = String(storage.get<string>('token')).split('').reverse().join('')
      //   const webviewSrc = `${src}&tr=${tr}`
      //   this.setData({
      //     webviewSrc,
      //   })
      // }
    },
    onMessage(e: { detail: { data: IAnyObject } }) {
      console.log('onMessage', e.detail.data)
    },
  },
})
