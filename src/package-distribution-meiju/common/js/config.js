import { getEnv } from '../../../config/index'

const config = {
  environment: getEnv() === 'prod' ? 'prod' : 'sit',
  isMasEnv: true, //是否通过
  masPrefix: '/mas/v5/app/proxy?alias=',
  //域名
  domain: {
    dev: 'https://mp-dev.smartmidea.net', //测试
    sit: 'https://mp-sit.smartmidea.net', //测试
    prod: 'https://mp-prod.smartmidea.net', //生产
  },
  //多云接口首次调用
  cloudDomain: {
    dev: 'https://mp-g-dev.smartmidea.net', //测试
    sit: 'https://mp-g-sit.smartmidea.net', //测试
    prod: 'https://mp-g.smartmidea.net', //生产
  },
  //图片接口
  imageDomain: {
    dev: 'https://midea-file-test.oss-cn-hangzhou.aliyuncs.com', //测试环境
    sit: 'https://midea-file-test.oss-cn-hangzhou.aliyuncs.com', //测试环境
    prod: 'https://m-apps.oss-cn-shenzhen.aliyuncs.com', //正式环境
  },
  //协议接口 或 活动接口
  agreementDomain: {
    dev: 'https://www.smartmidea.net', //测试环境
    sit: 'https://www.smartmidea.net', //测试环境
    prod: 'https://www.smartmidea.net', //正式环境
  },
  //it部后台配置系统接口
  actTemplateApi: {
    dev: '10.16.85.47', //测试环境
    sit: '10.16.85.47', //测试环境
    prod: 'http://cmms.midea.com', //正式环境
  },
  apiKey: {
    dev: 'dev_secret123@muc', //测试
    sit: 'sit_secret123@muc',
    prod: 'prod_secret123@muc', //生产
  },
  appKey: {
    dev: '9f5d2a027e5847faa22d8e220ec5bbda',
    sit: '9f5d2a027e5847faa22d8e220ec5bbda',
    prod: 'b78e235c6eb948a480b6a8e26eed16b7',
  },
  iotAppId: {
    dev: '901',
    sit: '901',
    pro: '901',
  },
  marketAppId: {
    dev: 'test_mj',
    sit: 'test_mj',
    prod: '1sic3jya0q0qlg20kl5460hmsd7jxbz8',
  },
  marketKey: {
    dev: 'test_mj',
    sit: 'test_secret',
    prod: 'TUgNo2kpXQ8TUdGOjP88ljF7UX9mvSof',
  },
  //c4a隐私协议域名
  privacyDomain: {
    dev: 'https://secsit.midea.com', //测试环境
    sit: 'https://secsit.midea.com', //测试环境
    prod: 'https://sec.midea.com', //正式环境
  },

  imgPrefix: {
    dev: 'https://www.smartmidea.net/projects/sit/meiju-lite-assets',
    sit: 'https://www.smartmidea.net/projects/sit/meiju-lite-assets/',
    prod: 'https://www.smartmidea.net/projects/meiju-lite-assets/',
  },
  websocketDomain: {
    dev: 'wss://sse-sit.smartmidea.net:9013',
    sit: 'wss://sse-sit.smartmidea.net:9013',
    prod: 'wss://sse.smartmidea.net',
  },
  myxAppkey: {
    dev: 'MaAodHlzRKZ1',
    sit: 'MaAodHlzRKZ1',
    prod: 'bnu9ISeLw50x',
  },
  myxSecret: {
    dev: 'd092d75585618a590c381157bfa69414f86fbfd1',
    sit: 'd092d75585618a590c381157bfa69414f86fbfd1',
    prod: '91d159db689aa756009e0faa4735b33c1ebf45d9',
  },
  qwid: {
    dev: 'fe5ldE',
    sit: 'fe5ldE',
    prod: 'mjZh9A',
  },
  serviceAppid: {
    dev: 'wx74b210b932a1c20f',
    sit: 'wx74b210b932a1c20f',
    prod: 'wx0f400684c55f3cdf',
  },
  //develop,trial,release
  wxBatchAddDevicePanelEnv: {
    dev: 'develop',
    sit: 'develop',
    prod: 'release',
  },
}
export default config
