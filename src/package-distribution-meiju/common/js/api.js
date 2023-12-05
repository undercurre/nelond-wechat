import config from './config.js' //环境及域名基地址配置

const environment = config.environment
const isMasEnv = config.isMasEnv
const masPrefix = config.masPrefix
const domain = config.domain
const cloudDomain = config.cloudDomain
const agreementDomain = config.agreementDomain
const apiKey = config.apiKey
const appKey = config.appKey
const iotAppId = config.iotAppId
const marketAppId = config.marketAppId
const marketKey = config.marketKey
const websocketDomain = config.websocketDomain
const myxAppkey = config.myxAppkey
const myxSecret = config.myxSecret
const qwid = config.qwid
const serviceAppid = config.serviceAppid
const api = {
  isMasEnv: isMasEnv,
  urlPrefix: `${domain[`${environment}`]}` + (isMasEnv ? masPrefix : ''),
  apiKey: `${apiKey[`${environment}`]}`,
  iotAppId: iotAppId,
  environment: environment,
  appKey: `${appKey[`${environment}`]}`,
  marketAppId: `${marketAppId['prod']}`,
  marketKey: `${marketKey['prod']}`,
  websocketDomain: `${websocketDomain[environment]}`,
  myxAppkey: `${myxAppkey[environment]}`,
  myxSecret: `${myxSecret[environment]}`,
  myqwid: `${qwid[environment]}`,
  serviceAppid: `${serviceAppid[environment]}`,

  bind: {
    url: `${domain[`${environment}`]}/muc/v5/app/mj/user/wx/mobile/bind`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/mj/user/wx/mobile/bind`,
    api: '/muc/v5/app/mj/user/wx/mobile/bind',
  },
  //其他小程序带登录态跳转
  bing: {
    url: `${domain[`${environment}`]}/muc/v5/app/mj/user/applet/wx/mobile/shop/bing`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/wx/mobile/shop/bing`,
    api: '/muc/v5/app/mj/user/applet/wx/mobile/shop/bing',
  },
  gitSmsCode: {
    url: `${domain[`${environment}`]}/muc/v5/app/mj/user/getSmbingsCode`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/mj/user/getSmsCode`,
    api: '/muc/v5/app/mj/user/getSmsCode',
  },
  mobileVerify: {
    url: `${domain[`${environment}`]}/muc/v5/app/mj/user/mobileVerify`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/mj/user/mobileVerify`,
    api: '/muc/v5/app/mj/user/mobileVerify',
  },
  getPhoneNumber: {
    url: `${domain[`${environment}`]}/muc/v5/app/mj/user/wx/mobile/decode`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/mj/user/wx/mobile/decode`,
    api: '/muc/v5/app/mj/user/wx/mobile/decode',
  },
  homeList: {
    url: 'https://iot-dev.smartmidea.net:443/v1/homegroup/list/get',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/list/get`,
    api: '/mjl/v1/homegroup/list/get',
  },
  sendHomeGroupItemIsRead: {
    url: 'https://iot-dev.smartmidea.net:443/v1/homegroup/ext/update',
    // masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/ext/update`,//mas旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/ext/update/new`, //mas新配置
    api: '/mjl/v1/homegroup/ext/update',
  },
  verifyInviteCode: {
    url: 'https://iot-dev.smartmidea.net:443/v1/wx/member/invite/verify',
    // masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/wx/member/invite/verify`, //旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/wx/member/invite/verify/new`, //新配置
    api: '/mjl/v1/wx/member/invite/verify',
  },
  homegroupMemberCheck: {
    url: 'https://iot-dev.smartmidea.net:443//mjl/v1/homegroup/member/check',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/member/check`,
    api: '//mjl/v1/homegroup/member/check',
  },
  homegroupDefaultSet: {
    url: 'https://iot-dev.smartmidea.net:443/v1/homegroup/default/set',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/default/set`,
    api: '/mjl/v1/homegroup/default/set',
  },
  applianceList: {
    url: 'https://iot-dev.smartmidea.net:443/v1/appliance/home/list/get',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/appliance/home/list/get`,
    api: '/mjl/v1/appliance/home/list/get',
  },
  //修改设备名称
  editApplicance: {
    url: 'https://iot-dev.smartmidea.net:443/v1/appliance/info/modify',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/info/modify`,
    api: '/v1/appliance/info/modify',
  },
  //删除设备
  deleteApplicance: {
    url: 'https://iot-dev.smartmidea.net:443/v1/appliance/delete',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/delete`,
    api: '/v1/appliance/delete',
  },
  //更换房间
  changRoom: {
    url: 'https://iot-dev.smartmidea.net:443/v1/appliance/home/modify',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/home/modify`,
    api: '/v1/appliance/home/modify',
  },
  //蓝牙直连未连上云设备编辑接口
  changeBluetoothRoom: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/bluetoothDirect/edit',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetoothDirect/edit`,
    api: '/v1/appliance/bluetoothDirect/edit',
  },
  //蓝牙直连未连上云设备删除接口
  delBluetoothDevice: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/liteApp/bluetoothDirect/clear',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/liteApp/bluetoothDirect/clear`,
    api: '/v1/appliance/liteApp/bluetoothDirect/clear',
  },
  //修改非智设备名称
  editNormalDevice: {
    url: 'https://iot-dev.smartmidea.net:443/v1/appliance/normalDevice/modify',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/normalDevice/modify`,
    api: '/v1/appliance/normalDevice/modify',
  },
  ///删除非智设备
  deleteNormalDevice: {
    url: 'https://iot-dev.smartmidea.net:443/v1/appliance/normalDevice/delete',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/normalDevice/delete`,
    api: '/v1/appliance/normalDevice/delete',
  },
  // region 快开相关接口
  // 获取产品配置
  productConfig: {
    url: 'https://ce2.midea.com/quick-dev-api/frontend/productConfig',
    // masUrl: 'https://ce2.midea.com/quick-dev-api/frontend/productConfig',
    masUrl: `${domain[`${environment}`] + masPrefix}` + '/sda/control/transmit',
    api: '/quick-dev-api/frontend/productConfig',
  },
  // 生电透传接口
  sdaTransmit: {
    url: 'https://ce2.midea.com/sda/control/transmit',
    masUrl: `${domain[`${environment}`] + masPrefix}` + '/sda/control/transmit',
    api: '/sda/control/transmit',
  },
  // endregion
  luaGet: {
    url: 'https://iot-dev.smartmidea.net:443/v1/device/status/lua/get',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/device/status/lua/get`,
    api: '/mjl/v1/device/status/lua/get',
  },
  luaControl: {
    url: 'https://iot-dev.smartmidea.net:443/v1/device/lua/control',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/device/lua/control`,
    api: '/mjl/v1/device/lua/control',
  },
  getVipUserInfo: {
    // url: `https://iot-dev.smartmidea.net:443/ccrm2-core/userApi/getVipUserInfo`,
    // masUrl: `${domain[`${environment}`] + masPrefix}/ccrm2-core/userApi/getVipUserInfo`,
    // api: "/ccrm2-core/userApi/getVipUserInfo"
    url: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/getMemberInfo.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/getMemberInfo.do`,
    api: '/api/mcsp_uc/mcsp-uc-member/member/getMemberInfo.do',
  },
  share: {
    url: 'https://iot-dev.smartmidea.net:443/v1/wx/member/invite/share',
    // masUrl: `${domain[`${environment}`] + masPrefix}/v1/wx/member/invite/share`, //旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/wx/member/invite/share`, //新配置
    api: '/v1/wx/member/invite/share',
  },
  edApi: {
    url: 'https://iot-dev.smartmidea.net:443/mjl/ed/v1/api',
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/ed/v1/api`,
    api: '/mjl/ed/v1/api',
  },
  MzTransmit: {
    url: 'https://iot-dev.smartmidea.net:443/v1/app2base/data/transmit',
    masUrl: `${domain[`${environment}`] + masPrefix}` + '/mjl/v1/app2base/data/transmit',
    api: '/mjl/v1/app2base/data/transmit',
  },
  gatewayTransport: {
    url: 'https://iot-dev.smartmidea.net:443/v1/gateway/transport/send',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/gateway/transport/send`,
    api: '/v1/gateway/transport/send',
  },
  gatewayDeviceGetInfo: {
    url: 'https://iot-dev.smartmidea.net:443/v1/gateway/device/getInfo',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/gateway/device/getInfo`,
    api: '/v1/gateway/device/getInfo',
  },
  //查询活动邀请记录
  inviteRecord: {
    url: 'http://activity-sit.smartmidea.net/v1/activity/redpack/invite/record',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/redpack/invite/record_lite`,
    api: '/v1/activity/redpack/invite/record_lite',
  },
  //获取家庭成员
  homeGroupMember: {
    url: 'https://activity-sit.smartmidea.net/v1/homegroup/member/get',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/get_lite`,
    api: '/v1/homegroup/member/get_lite',
  },
  //获取活动分享id
  getSpreadId: {
    url: 'http://activity-sit.smartmidea.net/v1/activity/spread/id/get',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/spread/id/get_web_lite`,
    api: '/v1/activity/spread/id/get_web_lite',
  },
  //获取openId
  getOpendId: {
    url: 'https://iot-user-sit.smartmidea.net/v1/wx/openId/get',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/wx/openId/get_lite`,
    api: '/v1/wx/openId/get_lite',
  },
  //查询是否购买过美的智能设备
  checkPurchaseDevice: {
    url: 'http://activity-sit.smartmidea.net/v1/activity/device/purchase/check',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/device/purchase/check`,
    api: '/v1/activity/device/purchase/check',
  },

  //绑定设备到指定的家庭组和房间
  bindDeviceToHome: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/home/bind',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/home/bind_lite`,
    api: '/v1/appliance/home/bind_lite',
  },

  //美云销  新广告api
  getAdvertisement: {
    url: `${domain[`${environment}`] + masPrefix}/api/mcsp_cc/cc-web/mcsp/content/external/ad/list.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/api/mcsp_cc/cc-web/mcsp/content/external/ad/list.do_lite`,
    api: '/api/mcsp_cc/cc-web/mcsp/content/external/ad/list.do_lite',
  },

  //美云销  新广告api带token
  getAdvertisement_Token: {
    url: `${domain[`${environment}`] + masPrefix}/api/mcsp_cc/cc-web/mcsp/content/external/ad/list.do/withToken`,
    masUrl: `${
      domain[`${environment}`] + masPrefix
    }/api/mcsp_cc/cc-web/mcsp/content/external/ad/list.do/withToken_lite`,
    api: '/api/mcsp_cc/cc-web/mcsp/content/external/ad/list.do/withToken_lite',
  },

  // 协议更新——协议变更判断
  checkAgreementApi: {
    url: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/agreement/checkAgree`,
    //masUrl: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/agreement/checkAgree`,//旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/user/wx/c4a/agreement/checkAgree`, //新配置,
    api: '/v1/user/wx/c4a/agreement/checkAgree',
  },
  // 协议更新——协议标题列表
  agreementTitleApi: {
    url: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/agreement/titles`,
    //masUrl: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/agreement/titles`, //旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/user/wx/c4a/agreement/titles`, //新配置
    api: '/v1/user/wx/c4a/agreement/titles',
  },
  // 协议更新——同意最新协议接口
  agreeLatestApi: {
    url: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/agreement/agreeLatest`,
    //masUrl: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/agreement/agreeLatest`, //旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/user/wx/c4a/agreement/agreeLatest`, //新配置
    api: '/v1/user/wx/c4a/agreement/agreeLatest',
  },
  //爱范儿糖纸众测活动-助力接口
  assist: {
    url: 'https://activity-sit.smartmidea.net/v1/activity/ifzc/testing/assist',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/ifzc/testing/assist_lite`,
    api: '/v1/activity/ifzc/testing/assist_lite',
  },
  //获取设备图片
  getIotDeviceImg: {
    url: `${domain[`${environment}`] + masPrefix}/app/getIotDeviceV3`,
    masUrl: `${domain[`${environment}`] + masPrefix}/app/getIotDeviceV3_lite`,
    api: '/app/getIotDeviceV3_lite',
    // url: `https://dcpali-uat.smartmidea.net/dcp-web/api-product/iotDevice/getIotDevice`,
    // masUrl: `${domain[`${environment}`] + masPrefix}/dcp-web/api-product/iotDevice/getIotDeviceImg`,
    // api: "/dcp-web/api-product/iotDevice/getIotDeviceImg"
  },
  //获取IOT配网信息(扫码)
  getConnectInfoScan: {
    url: 'https://nc-sit.smartmidea.net/netconf/app/getConnectInfoScan',
    masUrl: `${domain[`${environment}`] + masPrefix}/product/conneProdApp/getConnectInfoScan_lite`,
    api: '/product/conneProdApp/getConnectInfoScan_lite',
  },
  //获取IOT配网信息(扫码)
  getQrcodeConnectInfoScan: {
    url: 'http://nc-sit.smartmidea.net/netconf/app/getQrcodeConnectInfoScan',
    masUrl: `${
      domain[`${environment}`] + masPrefix
    }/dcp-web/api-product/public-access/product/conneProdApp/getQrcodeConnectInfoScan`,
    api: '/dcp-web/api-product/public-access/product/conneProdApp/getQrcodeConnectInfoScan',
  },
  //获取多配网指引接口
  multiNetworkGuide: {
    url: 'http://nc-sit.smartmidea.net/netconf/app/connectinfos',
    masUrl: `${domain[`${environment}`] + masPrefix}/app/connectinfos_lite`,
    api: '/app/connectinfos_lite',
  },
  //扫码、选型获取指引
  queryConnectInfoV2: {
    url: 'http://nc-sit.smartmidea.net/netconf/app/queryConnectInfoV2',
    masUrl: `${domain[`${environment}`] + masPrefix}/app/queryConnectInfoV2`,
    api: '/app/queryConnectInfoV2',
  },
  //后确权指引
  getIotConfirmInfoV2: {
    url: 'http://nc-sit.smartmidea.net/netconf/app/getIotConfirmInfoV2',
    masUrl: `${domain[`${environment}`] + masPrefix}/app/getIotConfirmInfoV2`,
    api: '/app/getIotConfirmInfoV2',
  },
  //蓝牙-获取设备阈值
  getNetworkThreshold: {
    url: 'http://nc-sit.smartmidea.net/netconf/app/getNetworkThreshold',
    masUrl: `${domain[`${environment}`] + masPrefix}/app/getNetworkThreshold_lite`,
    api: '/app/getNetworkThreshold_lite',
  },
  //蓝牙-密钥协商第一步，获取公钥
  acquirePublicKey: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/acquirePublicKey',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/acquirePublicKey_lite`,
    api: '/v1/appliance/bluetooth/acquirePublicKey_lite',
  },
  //蓝牙-密钥协商第二部分，加密密文给模组验证,构造02指令
  generateSecretKey: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/generateSecretKey',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/generateSecretKey_lite`,
    api: '/v1/appliance/bluetooth/generateSecretKey_lite',
  },
  //蓝牙-上报密钥协商结果
  verifySecretKey: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/verifySecretKey',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/verifySecretKey_lite`,
    api: '/v1/appliance/bluetooth/verifySecretKey_lite',
  },
  //蓝牙-获取设备sn 指令获取
  getBluetoothApplianceInfo: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/getApplianceInfo',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/getApplianceInfo_lite`,
    api: '/v1/appliance/bluetooth/getApplianceInfo_lite',
  },
  //蓝牙-生成绑定码
  queryBindCode: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/queryBindCode',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/queryBindCode_lite`,
    api: '/v1/appliance/bluetooth/queryBindCode_lite',
  },
  //蓝牙-绑定结果
  bindCodeResult: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/bindCode/result',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/bindCode/result`,
    api: '/v1/appliance/bluetooth/bindCode/result',
  },
  //修改家庭和房间
  homeModify: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/home/modify',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/home/modify`,
    api: '/v1/appliance/home/modify',
  },
  //蓝牙-透传加密
  blueEncryptOrder: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/encrypt/order',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/encrypt/order`,
    api: '/v1/appliance/bluetooth/encrypt/order',
  },
  //蓝牙-透传解密
  blueDecryptOrder: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/bluetooth/decrypt/order',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/bluetooth/decrypt/order_lite`,
    api: '/v1/appliance/bluetooth/decrypt/order_lite',
  },

  //使用这个接口让设备进入待确权状态
  applianceAuthConfirm: {
    url: 'https://iot-appliance-sit.smartmidea.net/v1/appliance/auth/confirm',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/auth/confirm`,
    api: '/v1/appliance/auth/confirm',
  },
  //检查设备是否连上路由器
  checkApExists: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/sn/apExists',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/sn/apExists`,
    api: '/v1/appliance/sn/apExists',
  },
  //根据品类、sn8获取设备信息
  getIotDeviceByCode: {
    url: 'https://dcpali-uat.smartmidea.net/dcp-web/api-product/conneProdApp/getIotDeviceByCode',
    masUrl: `${domain[`${environment}`] + masPrefix}/api-product/conneProdApp/getIotDeviceByCode_lite`,
    // api: '/dcp-web/api-product/conneProdApp/getIotDeviceByCode',
    api: '/api-product/conneProdApp/getIotDeviceByCode_lite',
  },
  // 校验是否需要更新
  checkIsUpdate: {
    url: `${domain[`${environment}`] + masPrefix}/v1/app/upgrade/check_lite`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/app/upgrade/check_lite`,
    api: '/v1/app/upgrade/check_lite',
  },
  // 洗衣机-活动-领取延保卡
  washerActivityGetGuaranteeCard: {
    url: `${domain[`${environment}`] + masPrefix}/v1/activity/guaranteeCard/right/get`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/guaranteeCard/right/get`,
    api: '/v1/activity/guaranteeCard/right/get',
  },
  // 洗衣机-活动-查询延保卡历史
  washerActivityQueryGuaranteeCard: {
    url: `${domain[`${environment}`] + masPrefix}/v1/activity/guaranteeCard/right/query`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/guaranteeCard/right/query`,
    api: '/v1/activity/guaranteeCard/right/query',
  },
  // 洗衣机-活动-绑定生成延保卡
  washerActivityCreateGuaranteeCard: {
    url: `${domain[`${environment}`] + masPrefix}/v1/activity/guaranteeCard/right/create`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/activity/guaranteeCard/right/create`,
    api: '/v1/activity/guaranteeCard/right/create',
  },

  // 以换代修-活动-智能小家电列表
  getUserProductPageList: {
    url: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/behavior/appliance/list.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/behavior/appliance/list.do`,
    api: '/api/mcsp_uc/mcsp-uc-member/member/behavior/appliance/list.do',
    // url: `${domain[`${environment}`] + masPrefix}/ccrm2-core/userProduct/getUserProductPageList`,
    // masUrl: `${domain[`${environment}`] + masPrefix}/ccrm2-core/userProduct/getUserProductPageList`,
    // api: "/ccrm2-core/userProduct/getUserProductPageList"
  },

  // 以换代修-判断品类码是否支持以换代修
  typeCheck: {
    url: `${domain[`${environment}`] + masPrefix}/v1/replaceRepairCard/typeCheck`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/replaceRepairCard/typeCheck`,
    api: '/v1/replaceRepairCard/typeCheck',
  },
  orderList: {
    url: `${domain[`${environment}`] + masPrefix}/member/behavior/listOrder.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/member/behavior/listOrder.do`,
    api: '/member/behavior/listOrder.do',
  },
  invoiceList: {
    url: `${domain[`${environment}`] + masPrefix}/member/invoice/listInvoice.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/member/invoice/listInvoice.do`,
    api: '/member/invoice/listInvoice.do',
  },
  userProductUpdate: {
    url: `${domain[`${environment}`] + masPrefix}/member/behavior/appliance/modify.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/member/behavior/appliance/modify.do`,
    api: '/member/behavior/appliance/modify.do',
  },
  // 上传凭证 只支持线上图片
  uploadEvidenceByUrl: {
    // url: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/uploadPicByUrl.do`,
    url: 'https://mcsp.midea.com/mas/v5/app/proxy?alias=/api/mcsp_uc/mcsp-uc-member/member/uploadPicByUrl.do',
    masUrl: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/uploadPicByUrl.do_lite`,
    api: '/api/mcsp_uc/mcsp-uc-member/member/uploadPicByUrl.do_lite',
  },

  // 上传 支持文件流上传 美云销新接口2021.10.15上线
  uploadPic: {
    // url: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/uploadPic.do`,
    masUrl: `${domain[`${environment}`] + masPrefix}/api/mcsp_uc/mcsp-uc-member/member/uploadPic.do_lite`,
    api: '/api/mcsp_uc/mcsp-uc-member/member/uploadPic.do_lite',
  },
  // 上传接口 支持文件流
  upload: {
    url: `${domain[`${environment}`] + masPrefix}/ccrm2-core/uploadApi/upload`,
    masUrl: `${domain[`${environment}`] + masPrefix}/ccrm2-core/uploadApi/upload_lite`,
    api: '/ccrm2-core/uploadApi/upload_lite',
  },
  // 新客服-中控-获取售后产品资料对外服务接口 (产品型号模糊查询)
  getProdMessage: {
    url: `${domain[`${environment}`] + masPrefix}/dcp-web/api-product/message/getProdMessageWX`,
    masUrl: `${domain[`${environment}`] + masPrefix}/dcp-web/api-product/message/getProdMessageWX_lite`,
    api: '/dcp-web/api-product/message/getProdMessageWX_lite',
  },

  //微信扫一扫美居生成的二维码加入家庭
  scanCodeJoinFamily: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/join/home/scancode_lite`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/join/home/scancode_lite`,
    api: '/v1/homegroup/member/join/home/scancode_lite',
  },

  //新首页列表页接口
  applianceListAggregate: {
    url: `${domain[`${environment}`] + masPrefix}/v1/appliance/home/list/aggregate`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/home/list/aggregate`,
    api: '/v1/appliance/home/list/aggregate',
  },

  //未激活设备忽略接口
  ignoreAppliance: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/notActive/ignore',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/notActive/ignore_lite`,
    api: '/v1/appliance/notActive/ignore_lite',
  },

  //找朋友配网 主设备找朋友指令接口
  findFriends: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/friends/find',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/friends/find`,
    api: '/v1/appliance/friends/find',
  },

  //找朋友配网 返回待配网设备信息
  getFriendDevices: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/friends/find/result',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/friends/find/result_lite`,
    api: '/v1/appliance/friends/find/result_lite',
  },

  //找朋友配网 主设备给朋友设备发送配网指令
  friendDeviceNetwork: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/friends/confirm',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/friends/confirm`,
    api: '/v1/appliance/friends/confirm',
  },

  //找朋友配网 主设备给朋友设备配网结果
  friendNetworkResult: {
    url: 'https://appliance-api-sit.smartmidea.net/v1/appliance/friends/bind/result',
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/friends/bind/result_lite`,
    api: '/v1/appliance/friends/bind/result_lite',
  },
  // 获取当前登陆用户的信息接口
  getUserInfo: {
    url: `${domain[`${environment}`] + masPrefix}/v1/wx/user/get_lite`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/wx/user/get_lite`,
    api: '/v1/wx/user/get_lite',
  },

  // 发送用户手机号，昵称，头像到用户的邮箱
  sendEmail: {
    url: `${domain[`${environment}`] + masPrefix}/v1/wx/user/information/send`,
    //masUrl: `${domain[`${environment}`] + masPrefix}/v1/wx/user/information/send`,//旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/wx/user/information/send_lite`, //新配置
    // api: '/v1/wx/user/information/send',
    api: '/mjl/v1/wx/user/information/send_lite',
  },

  // 微信小程序撤销授权(协议)
  cancelAgreeAgreement: {
    // url: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/cancelAgreeAgreement`,
    url: `${domain[`${environment}`] + masPrefix}/mjl/v1/user/wx/c4a/cancelAgreeAgreement_lite`,
    //masUrl: `${domain[`${environment}`] + masPrefix}/v1/user/wx/c4a/cancelAgreeAgreement`,//旧配置
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/user/wx/c4a/cancelAgreeAgreement_lite`, //新配置
    // api: '/v1/user/wx/c4a/cancelAgreeAgreement',
    api: '/mjl/v1/user/wx/c4a/cancelAgreeAgreement_lite',
  },
  // 小程序挂牌公告
  shutdownNotice: {
    url: `${domain[`${environment}`] + masPrefix}/v1/app/mini/listed_lite`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/app/mini/listed_lite`,
    api: '/v1/app/mini/listed_lite',
  },
  //IOT设备icon查询接口
  getIotDeviceV3: {
    url: `${domain[`${environment}`] + masPrefix}/app/getIotDeviceV3`,
    masUrl: `${domain[`${environment}`] + masPrefix}/app/getIotDeviceV3_lite`,
    api: '/app/getIotDeviceV3_lite',
  },
  //获取非智能设备
  getNonIntelligentIotDeviceV: {
    url: `${domain[`${environment}`] + masPrefix}/v1/appliance/normalDevice/list/get`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/normalDevice/list/get`,
    api: '/v1/appliance/normalDevice/list/get',
  },
  //家庭管理-创建家庭组
  addFamily: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/add`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/add`,
    api: '/v1/homegroup/add',
  },
  //获取家庭成员管理上面有配置 homeGroupMember
  homeMemberGet: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/get`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/member/get`,
    api: '/v1/homegroup/member/get',
  },
  //家庭管理-注销家庭
  homeDelete: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/delete`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/delete`,
    api: '/v1/homegroup/delete',
  },
  //家庭管理-成员退出家庭
  homeQuit: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/quit`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/member/quit`,
    api: '/v1/homegroup/member/quit',
  },
  //家庭管理-家庭信息修改（参数加密）
  familyNameEdit: {
    url: `${domain[`${environment}`] + masPrefix}/v1/t2/homegroup/info/modify`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/t2/homegroup/info/modify`,
    api: '/v1/t2/homegroup/info/modify',
  },
  //家庭管理-创建房间
  addRoom: {
    url: `${domain[`${environment}`] + masPrefix}/v1/room/add`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/room/add`,
    api: '/v1/room/add',
  },
  //家庭管理-房间信息修改
  editRoom: {
    url: `${domain[`${environment}`] + masPrefix}/v1/room/info/modify`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/room/info/modify`,
    api: '/v1/room/info/modify',
  },
  //家庭管理-删除房间
  deleteRoom: {
    url: `${domain[`${environment}`] + masPrefix}/v1/room/delete`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/room/delete`,
    api: '/v1/room/delete',
  },
  //家庭管理-批量删除家庭成员
  deleteBatchMember: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/batch/delete`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/member/batch/delete`,
    api: '/v1/homegroup/member/batch/delete',
  },
  //家庭管理-修改用户家庭角色
  setRole: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/role/set`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/role/set`,
    api: '/v1/homegroup/role/set',
  },
  //家庭管理-删除成员
  deleteMember: {
    url: `${domain[`${environment}`] + masPrefix}/v1/homegroup/member/delete`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/homegroup/member/delete`,
    api: '/v1/homegroup/member/delete',
  },
  //修改用户信息
  modifyMemberInfo: {
    url: `${domain[`${environment}`] + masPrefix}/v1/user/info/modifyMemberInfo`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/v1/user/info/modifyMemberInfo`,
    api: '/v1/user/info/modifyMemberInfo',
  },
  // 根据品牌获取筛选信息
  filterDeviceWithBrand: {
    url: `${domain[`${environment}`] + masPrefix}/applet/queryBrandProduct`,
    masUrl: `${domain[`${environment}`] + masPrefix}/mjl/applet/queryBrandProduct`,
    api: '/applet/queryBrandProduct',
  },
  //批量检查设备是否连上路由器
  batchCheckApExists: {
    url: `${domain[`${environment}`] + masPrefix}/v1/appliance/sns/apExists`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/sns/apExists_lite`,
    api: '/v1/appliance/sns/apExists',
  },
  //批量设备到指定的家庭组和房间
  batchBindDeviceToHome: {
    url: `${domain[`${environment}`] + masPrefix}/v1/appliance/batch/home/bind`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/batch/home/bind_lite`,
    api: '/v1/appliance/batch/home/bind',
  },
  //生成组合设备
  generateCombinedDevice: {
    url: `${domain[`${environment}`] + masPrefix}/v1/appliance/compose/generate`,
    masUrl: `${domain[`${environment}`] + masPrefix}/v1/appliance/compose/generate_lite`,
    api: '/v1/appliance/compose/generate',
  },
  //多云协议-获取路由映射表
  getGlobalModule: {
    url: `${cloudDomain[`${environment}`] + masPrefix}/global/module`,
    masUrl: `${cloudDomain[`${environment}`] + masPrefix}/mjl/global/module`,
    api: '/global/module',
  },
  //多云协议-就近接入区域获取
  getGlobalRegion: {
    url: `${cloudDomain[`${environment}`] + masPrefix}/global/region`,
    masUrl: `${cloudDomain[`${environment}`] + masPrefix}/mjl/global/region`,
    api: '/global/region',
  },
}

//小程序（图片存放）
let imgBaseUrl = {
  environment: environment,
  url: `${agreementDomain[`${environment}`]}/projects/meiju-lite-assets`,
}
//小程序基础图片存放
let baseImgApi = {
  environment: environment,
  url:
    environment === 'sit' || environment === 'dev'
      ? `${agreementDomain[`${environment}`]}/projects/sit/meiju-lite-assets/mainContent/images/`
      : `${agreementDomain[`${environment}`]}/projects/meiju-lite-assets/mainContent/images/`,
}

//设备品类图片存放
let deviceImgApi = {
  environment: environment,
  url:
    environment === 'sit' || environment === 'dev'
      ? `${agreementDomain[`${environment}`]}/projects/sit/meiju-lite-assets/deviceImg/`
      : `${agreementDomain[`${environment}`]}/projects/sit/meiju-lite-assets/deviceImg/`,
}

//通用web-view路径
let commonH5Api = {
  environment: environment,
  url:
    environment === 'sit' || environment === 'dev'
      ? `${agreementDomain[`${environment}`]}/projects/sit/midea-meiju-lite-h5/`
      : `${agreementDomain[`${environment}`]}/projects/midea-meiju-lite-h5/`,
}

export { environment, api, imgBaseUrl, baseImgApi, deviceImgApi, commonH5Api }
