const platforms = {
  meiJuLite: '9',
}

const modules = {
  addDevice: '01', //配网
}

const errorCodes = {
  common: '001', //通用错误
  moudelRespPwsError: '180004', //模块响应密码错误
  noCheckDevice: '4200', //自启热点无后确权
}

//失败页对应文案
const failTextData = {
  common: {
    errorCode: '901001',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX联网过程出错',
    guideDesc: [
      '请确保连接家庭2.4GHz Wi-Fi，不可连接5GHz Wi-Fi',
      '请确保家庭Wi-Fi与密码填写正确，并确保该Wi-Fi网络畅通 测试一下',
      '请将路由器尽量靠近设备',
    ],
    isTest: true, //是否有测试一下
    isNeedInputPsw: true, //是否需要WiFi密码确认框
  },

  901005: {
    //蓝牙产品错误
    errorCode: '901005',
    mainTitle: 'XX连接失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备。'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false, //是否需要WiFi密码确认框
  },

  901006: {
    //msmart 直连失败通用
    errorCode: '901006',
    mainTitle: 'XX连接失败',
    nextTitle: '手机没有靠近',
    guideDesc: ['请将手机尽量靠近设备。'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false, //是否需要WiFi密码确认框
  },
  1301: {
    //触屏配网绑定失败
    errorCode: '1301',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX联网过程出错',
    guideDesc: ['请重新生成二维码后重新扫码联网。'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false, //是否需要WiFi密码确认框
  },

  4200: {
    //自启热点无后确权 需二次配网验证 code
    errorCode: '4200',
    mainTitle: 'XX联网失败',
    nextTitle: '未进行安全性验证',
    guideDesc: [],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false, //是否需要WiFi密码确认框
  },

  //云端返回错误code
  1307: {
    errorCode: '1307',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: [
      '请确保家庭WiFi与密码填写正确，并确保该WiFi网络畅通 测试一下',
      '请确保设备通电状态',
      '请确认已开启“本地网络”系统授权；（仅iOS展示）',
      '请将路由器尽量靠近设备',
      '若路由器设置了Mac地址白名单，请解除白名单，或将XX的Mac地址添加到白名单',
      '请确保路由器的DHCP功能已开启',
    ],
    isTest: true, //是否有测试一下
    isNeedInputPsw: true,
  },
  1383: {
    errorCode: '1383',
    mainTitle: 'XX联网失败',
    nextTitle: '联网操作过于频繁',
    guideDesc: ['XX联网过于频繁，请3分钟后再试'],
    isTest: true, //是否有测试一下
    isNeedInputPsw: true,
  },

  1501: {
    errorCode: '1501',
    mainTitle: 'XX绑定失败',
    nextTitle: '家庭设备数量达到上限',
    guideDesc: ['每个家庭最多可绑定140个设备，当前家庭设备数量已达上限。请切换家庭或创建新家庭，再进行添加。'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false,
  },

  //AP配网在AP模式下超时时间内未发现设备
  4011: {
    errorCode: '4011',
    mainTitle: 'XX联网失败',
    nextTitle: '手机无法连接设备',
    guideDesc: [
      '请将手机尽量靠近设备',
      '建议在手机系统的WiFi设置页面中关闭“自动切换WiFi”功能',
      '请确认已开启“本地网络”系统授权。（仅iOS展示）',
    ],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false,
    msg: 'AP配网在AP模式下超时时间内未发现设备',
  },

  //配网在STA模式下超时时间内未发现设备
  4013: {
    errorCode: '4013',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: [
      '请确保家庭WiFi与密码填写正确，并确保该WiFi网络畅通 测试一下',
      '请将路由器尽量靠近设备',
      '请确认已开启“本地网络”系统授权（仅iOS展示）',
      '若路由器设置了Mac地址白名单，请将解除白名单，或将XX的Mac地址添加到白名单',
      '请确保路由器的DHCP功能已开启',
    ],
    isTest: true, //是否有测试一下
    isNeedInputPsw: true,
    msg: '配网在STA模式下超时时间内未发现设备 ',
  },

  4038: {
    errorCode: '4038',
    mainTitle: 'XX联网失败',
    nextTitle: '手机无法连接设备',
    guideDesc: ['请将手机尽量靠近设备', '建议在手机系统的WiFi设置页面中关闭“自动切换WiFi”功能'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false,
    msg: 'AP配网，连接设备发生IO错误',
  },
  // 蓝牙配网OD指令返回错误码 连接路由失败，密码错误
  4094: {
    errorCode: '4094',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器WiFi密码错误',
    guideDesc: ['WiFi密码错误，请确保家庭WiFi与密码填写正确，并确保该WiFi网络畅通 测试一下'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: true,
    msg: '二代蓝牙配网，模组返回路由密码错误',
  },

  4135: {
    errorCode: '4135',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: [
      '请确保家庭WiFi与密码填写正确，并确保该WiFi网络畅通',
      '请将路由器尽量靠近设备',
      '若设置路由器Mac地址白名单，请将解除白名单，或将XX的Mac地址添加到白名单。',
    ],
    isTest: true, //是否有测试一下
    isNeedInputPsw: true,
    msg: 'AP配网，模组重新进入AP',
  },

  4169: {
    errorCode: '4169',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通 测试一下'],
    isTest: true, //是否有测试一下
    isNeedInputPsw: true,
    msg: 'AP配网，局域网在线，云端查找sn和随机数都没找到',
  },

  180004: {
    errorCode: '180004',
    mainTitle: 'XX联网失败   ',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['请确保连接家庭2.4GHz Wi-Fi，不可连接5GHz Wi-Fi；', '请确保家庭WiFi与密码填写正确。'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: true,
  },
  180011: {
    errorCode: '180011',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: [
      '若路由器设置了Mac地址白名单，请解除白名单，或将XX的Mac地址添加到白名单；',
      '请确保路由器的DHCP功能已开启。',
    ],
    isTest: false,
    isNeedInputPsw: false,
  },
  180005: {
    errorCode: '180005',
    mainTitle: '联网失败',
    nextTitle: '无法接连路由器',
    guideDesc: ['1、请确保连接家庭2.4GHz Wi-Fi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
    isTest: false,
  },
  180006: {
    errorCode: '180005',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['1、请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
    isTest: false,
    isNeedInputPsw: true,
  },
  180007: {
    errorCode: '180007',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['1、请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
    isTest: false,
    isNeedInputPsw: true,
  },
  180008: {
    errorCode: '180008',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['1、请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
    isTest: false,
    isNeedInputPsw: true,
  },
  180009: {
    errorCode: '180009',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['1、请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
    isTest: false,
    isNeedInputPsw: true,
  },
  180010: {
    errorCode: '180010',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['1、请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
    isTest: false,
    isNeedInputPsw: true,
  },
  180013: {
    errorCode: '180013',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法接连路由器',
    guideDesc: ['请打开路由器的DHCP功能。'],
    isTest: false,
    isNeedInputPsw: false,
  },
  180020: {
    errorCode: '180020',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通。测试一下'],
    isTest: true,
    isNeedInputPsw: false,
  },
  180021: {
    errorCode: '180021',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通。测试一下'],
    isTest: true,
    isNeedInputPsw: false,
  },
  180022: {
    errorCode: '180022',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通。测试一下'],
    isTest: true,
    isNeedInputPsw: false,
  },
  180023: {
    errorCode: '180023',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通。测试一下'],
    isTest: true,
    isNeedInputPsw: false,
  },
  4160: {
    // AP缺少ADS集群ID
    errorCode: '4160',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法登录云端',
    guideDesc: ['系统出错，请稍后重试。'],
    isTest: false,
  },
  4164: {
    // 蓝牙缺少ADS集群ID
    errorCode: '4164',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法登录云端',
    guideDesc: ['系统出错，请稍后重试。'],
    isTest: false,
  },
  4056: {
    // 蓝牙配网OD指令返回错误码 找不到ssid
    errorCode: '4056',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未找到路由器的WiFi',
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请将WiFi路由器尽量靠近设备；'],
    isTest: false,
  },
  4058: {
    // 蓝牙配网OD指令返回错误码 DNS解析失败/域名解析失败
    errorCode: '4058',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保使用的家庭WiFi网络畅通'],
    isTest: false,
  },
  4059: {
    // 蓝牙配网OD指令返回错误码 与服务器建立TCP连接失败（重试次数 或是 通过时间 判断）
    errorCode: '4059',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保使用的家庭WiFi网络畅通'],
    isTest: false,
  },
  4060: {
    // 蓝牙配网OD指令返回错误码 心跳包超时
    errorCode: '4060',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4061: {
    // 蓝牙配网OD指令返回错误码 登陆过程SST错误
    errorCode: '4061',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4062: {
    // 蓝牙配网OD指令返回错误码 模组主动重启
    errorCode: '4062',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4063: {
    // 蓝牙配网OD指令返回错误码 模组被动重启
    errorCode: '4063',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4064: {
    // 蓝牙配网OD指令返回错误码 SDK认证失败
    errorCode: '4064',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4065: {
    // 蓝牙配网OD指令返回错误码 登陆过程被服务器主动关闭
    errorCode: '4065',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4066: {
    // 蓝牙配网OD指令返回错误码 登陆过程发送数据失败
    errorCode: '4066',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4098: {
    // 蓝牙配网OD指令返回错误码 连接路由失败，信号弱
    errorCode: '4098',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX（设备名称）距离路由器太远',
    guideDesc: ['请将路由器靠近XX（设备名称）'],
    isTest: false,
  },
  4099: {
    // 蓝牙配网OD指令返回错误码 DHCP失败
    errorCode: '4099',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法连接路由器',
    guideDesc: [
      '1、若路由器设置了Mac地址白名单，请解除白名单，或将XX的Mac地址添加到白名单；【展示查看教程入口】',
      '2、请确保路由器的DHCP功能已开启。【展示查看教程入口】',
    ],
    isTest: false,
  },
  4100: {
    // 蓝牙配网OD指令返回错误码 路由器认证错误
    errorCode: '4100',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法连接路由器',
    guideDesc: [
      '1、若路由器设置了Mac地址白名单，请解除白名单，或将XX的Mac地址添加到白名单；【展示查看教程入口】',
      '2、请确保路由器的DHCP功能已开启。【展示查看教程入口】',
    ],
    isTest: false,
  },
  4101: {
    // 蓝牙配网OD指令返回错误码 路由器关联错误
    errorCode: '4101',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法连接路由器',
    guideDesc: [
      '1、若路由器设置了Mac地址白名单，请解除白名单，或将XX的Mac地址添加到白名单；【展示查看教程入口】',
      '2、请确保路由器的DHCP功能已开启。【展示查看教程入口】',
    ],
    isTest: false,
  },
  4115: {
    // 蓝牙配网OD指令返回错误码 服务器登陆过程超时
    errorCode: '4115',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通'],
    isTest: false,
  },
  4116: {
    // 蓝牙配网OD指令返回错误码 APP发送的信道在1~13之间，且SSID包含有“5G/-5G/_5G”等有5G标识的相关字符集，WiFi模块扫描路由器AP失败
    errorCode: '4116',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4117: {
    // 蓝牙配网OD指令返回错误码 APP发送的信道在1-13之间，且SSID没有包含“5G/-5G/_5G”相关字符集，wifi模块扫描路由器AP失败
    errorCode: '4117',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未找到路由器的WiFi',
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请将WiFi路由器尽量靠近设备；'],
    isTest: false,
  },
  4118: {
    // 蓝牙配网OD指令返回错误码 APP发送的信道是0，且SSID中没有包含“5G/-5G/_5G”相关字符集wifi模块扫描路由器AP失败
    errorCode: '4118',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未找到路由器的WiFi',
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请将WiFi路由器尽量靠近设备；'],
    isTest: false,
  },
  4119: {
    // 蓝牙配网OD指令返回错误码 APP发送的信道是>13，且SSID中没有包含“5G/-5G/_5G”相关字符集wifi模块扫描路由器AP失败
    errorCode: '4119',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未找到路由器的WiFi',
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请将WiFi路由器尽量靠近设备；'],
    isTest: false,
  },
  4120: {
    // 蓝牙配网OD指令返回错误码 APP发送的信道>13，且SSID包含有“5G/-5G/_5G”等有5G标识的相关字符集，wifi模块扫描路由器AP失败
    errorCode: '4120',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未找到路由器的WiFi',
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请将WiFi路由器尽量靠近设备；'],
    isTest: false,
  },
  4121: {
    // 蓝牙配网OD指令返回错误码 APP发送的信道是0，且SSID包含有“5G/-5G/_5G”等有5G标识的相关字符集，wifi模块扫描路由器AP失败
    errorCode: '4121',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未找到路由器的WiFi',
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请将WiFi路由器尽量靠近设备；'],
    isTest: false,
  },
  4165: {
    // 蓝牙配网OD指令返回错误码 ADS DNS解析失败
    errorCode: '4165',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4166: {
    // 蓝牙配网OD指令返回错误码 与ADS建立TCP连接失败（重试次数 或是 通过时间 判断）
    errorCode: '4166',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4173: {
    // 蓝牙配网OD指令返回错误码 平台集群ID错误
    errorCode: '4173',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4174: {
    // 蓝牙配网OD指令返回错误码 请求接入层域名错误
    errorCode: '4174',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX连接过程出错',
    guideDesc: ['请将手机尽量靠近设备'],
    isTest: false,
  },
  4175: {
    // 蓝牙配网OD指令返回错误码 连接路由中，但路由信号弱
    errorCode: '4175',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX（设备名称）距离路由器太远',
    guideDesc: ['请将路由器靠近XX（设备名称）'],
    isTest: false,
  },
  4176: {
    // 蓝牙配网OD指令返回错误码 配网阶段连接路由成功，但超时连不上服务器
    errorCode: '4176',
    mainTitle: 'XX联网失败',
    nextTitle: '路由器无法连接网络',
    guideDesc: ['请确保家庭WiFi网络畅通'],
    isTest: false,
  },
  3001: {
    // 组合
    errorCode: '3001',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX未连接云端',
    guideDesc: ['请将扫地机放回基站', '请确认XX与基站建立配对'],
    isTest: false,
  },
  3002: {
    // 组合
    errorCode: '3002',
    mainTitle: 'XX联网失败',
    nextTitle: '账号绑定失败',
    guideDesc: ['请确保手机网络畅通，重新进行绑定'],
    isTest: false,
  },
}

//找朋友设备配网失败文案
const friendDeviceFailTextData = {
  7001: {
    //云端找朋友配网接口返回result为0x01
    errorCode: '7001',
    mainTitle: 'XX联网失败',
    nextTitle: 'XX无法连接',
    guideDesc: ['请将XX尽量靠近YY。若无法靠近或重试后仍失败，请尝试扫码或选择型号添加设备'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false, //是否需要WiFi密码确认框
  },
  7002: {
    //云端找朋友配网接口返回result为0x02
    errorCode: '7002',
    mainTitle: 'XX联网失败',
    nextTitle: 'wifi密码错误',
    guideDesc: ['Wifi密码错误，请确保家庭WiFi与密码填写正确，并确保该WiFi网络畅通；测试一下'],
    isTest: false, //是否有测试一下
    isNeedInputPsw: false, //是否需要WiFi密码确认框
  },
}

function creatErrorCode({ platform = 'meiJuLite', module = 'addDevice', errorCode = '001', isCustom = false }) {
  if (isCustom) {
    return errorCode
  }
  return `${platforms[platform]}${modules[module]}${errorCodes[errorCode]}`
}

module.exports = {
  creatErrorCode: creatErrorCode,
  failTextData: failTextData,
  friendDeviceFailTextData: friendDeviceFailTextData,
}
