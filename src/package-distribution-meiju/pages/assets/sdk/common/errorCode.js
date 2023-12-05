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
      '请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi',
      '请确保家庭WiFi与密码填写正确，并确保该WiFi网络畅通 测试一下',
      '请将WiFi路由器尽量靠近设备',
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
      '请将WiFi路由器尽量靠近设备',
      '请确认已开启“本地网络”系统授权；（仅iOS展示）',
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
      '请将WiFi路由器尽量靠近设备',
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

  4094: {
    errorCode: '4094',
    mainTitle: 'XX联网失败',
    nextTitle: 'WiFi密码错误',
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
      '请将WiFi路由器尽量靠近设备',
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
    guideDesc: ['请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '请确保家庭WiFi与密码填写正确。'],
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
    guideDesc: ['1、请确保连接家庭2.4GHz WiFi，不可连接5GHz WiFi；', '2、请确保家庭WiFi与密码填写正确。'],
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
