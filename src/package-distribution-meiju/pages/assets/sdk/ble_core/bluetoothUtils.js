/**
 *
 * 蓝牙相关的工具类
 */

/**
 * 十六进制转二进制数组
 * @param {*} str
 */
const hexToBinArray = (str) => {
  var dec = parseInt(str, 16),
    bin = dec.toString(2),
    len = bin.length
  if (len < 8) {
    var diff = 8 - len,
      zeros = ''
    for (var i = 0; i < diff; i++) {
      zeros += '0'
    }
    bin = zeros + bin
  }
  return bin.split('')
}

const inArray = (arr, key, val) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i
    }
  }
  return -1
}

// ArrayBuffer转16进度字符串示例
const ab2hex = (buffer) => {
  var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
    return ('00' + bit.toString(16)).slice(-2)
  })
  return hexArr.join('')
}

//十六进制转ASCII码
const hexCharCodeToStr = (hexCharCodeStr) => {
  var trimedStr = hexCharCodeStr.trim()
  var rawStr = trimedStr.substr(0, 2).toLowerCase() === '0x' ? trimedStr.substr(2) : trimedStr
  var len = rawStr.length
  if (len % 2 !== 0) {
    alert('存在非法字符!')
    return ''
  }
  var curCharCode
  var resultStr = []
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16)
    resultStr.push(String.fromCharCode(curCharCode))
  }
  return resultStr.join('')
}
//十六进制转二进制 59 => [1, 0, 0, 1, 1, 0, 1, 0]
const hex2bin = (str) => {
  if (!str) {
    return
  }
  str = parseInt(str, 16).toString(2)
  var i = str.length
  if (i >= 8) {
    //截取右8位，不足的位数前面补0
    str = str.substring(i - 8, i)
  } else {
    var str0 = '00000000'
    str = str0.substring(0, str0.length - i) + str
  }
  //切割反转 方便读取位数据
  str = str.split('').map((i) => {
    return parseInt(i)
  })
  return str.reverse()
}

/*
 *判断消息标识和消息类型是否相同
 *reqOrder respOrder
 *type 消息类型
 */
const checkLogoAndType = (reqOrder, respOrder) => {
  if (!reqOrder && !respOrder) {
    return
  }
  if (!reqOrder.includes('aa55') || !respOrder.includes('aa55')) {
    console.log('校验传入指令格式不正确')
    return
  }
  let isSameLogo = reqOrder.substr(6, 2) == respOrder.substr(6, 2)
  if (isSameLogo) {
    return true
  } else {
    return false
  }
}

const delay = (ms, res) => {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(res)
    }, ms)
  })
}

const hexStringToArrayBuffer = (str) => {
  if (!str) {
    return new ArrayBuffer(0)
  }
  var buffer = new ArrayBuffer(str.length / 2)
  let dataView = new DataView(buffer)
  let ind = 0
  for (var i = 0, len = str.length; i < len; i += 2) {
    let code = parseInt(str.substr(i, 2), 16)
    dataView.setUint8(ind, code)
    ind++
  }
  return buffer
}
//aa55 => aa,55
const formatStr = (str) => {
  let arr = []
  for (var i = 0, len = str.length; i < len; i += 2) {
    arr.push(str.substr(i, 2))
  }
  let string = arr.join(',')
  return string
}

//设备信息表
const locationdevice = {
  DEFAULT_ICON: {
    title: '默认图标',
    deviceType: 'DEFAULT_ICON',
    onlineIcon: 'blue_default_type',
    offlineIcon: 'gray_default_type',
  },
  '0F': {
    title: '体脂秤',
    deviceType: '0F',
    onlineIcon: 'blue_0f',
    offlineIcon: 'gray_0f',
  },
  10: {
    title: '智能插座',
    deviceType: '10',
    onlineIcon: 'blue_10',
    offlineIcon: 'gray_10',
  },
  ce: {
    title: '新风机',
    deviceType: 'ce',
    onlineIcon: 'smart_ce',
    offlineIcon: 'smart_ce',
  },
  cf: {
    title: '地暖',
    deviceType: 'cf',
    onlineIcon: 'smart_cf',
    offlineIcon: 'smart_cf',
  },
  13: {
    title: '智能灯',
    deviceType: '13',
    onlineIcon: 'blue_13',
    offlineIcon: 'gray_13',
  },
  '1B': {
    title: '美的路由器',
    deviceType: '1B',
    onlineIcon: 'blue_1b',
    offlineIcon: 'gray_1b',
  },
  '1D': {
    title: '空调伴侣',
    deviceType: '1D',
    onlineIcon: 'blue_1d',
    offlineIcon: 'gray_1d',
  },
  '1F': {
    title: '燃气传感器',
    deviceType: '1F',
    onlineIcon: 'blue_1f',
    offlineIcon: 'gray_1f',
  },
  20: {
    title: '智能门锁',
    deviceType: '20',
    onlineIcon: 'blue_20',
    offlineIcon: 'gray_20',
  },
  '2A': {
    title: 'mini网关',
    deviceType: '2A',
    onlineIcon: 'blue_2ab',
    offlineIcon: 'gray_2ab',
  },
  '2B': {
    title: '摄像头',
    deviceType: '2B',
    onlineIcon: 'blue_2b',
    offlineIcon: 'gray_2b',
  },
  '9A': {
    title: '微波烤箱',
    deviceType: '9A',
    onlineIcon: 'blue_9a',
    offlineIcon: 'gray_9a',
  },
  '9B': {
    title: '蒸汽烤箱',
    deviceType: '9B',
    onlineIcon: 'blue_9b',
    offlineIcon: 'gray_9b',
  },
  A1: {
    title: '除湿器',
    deviceType: 'A1',
    onlineIcon: 'blue_a1',
    offlineIcon: 'gray_a1',
  },
  AB: {
    title: '',
    deviceType: 'AB',
    onlineIcon: 'blue_ab_ac',
    offlineIcon: 'blue_ab_ac',
  },
  AC: {
    title: '空调',
    deviceType: 'AC',
    onlineIcon: 'blue_ab_ac',
    offlineIcon: 'blue_ab_ac',
  },
  AD: {
    title: '空气ball',
    deviceType: 'AD',
    onlineIcon: 'blue_ad',
    offlineIcon: 'blue_ad',
  },
  B0: {
    title: '微波炉',
    deviceType: 'B0',
    onlineIcon: 'blue_b0',
    offlineIcon: 'blue_b0',
  },
  B1: {
    title: '大烤箱',
    deviceType: 'B1',
    onlineIcon: 'blue_b1',
    offlineIcon: 'blue_b1',
  },
  B2: {
    title: '蒸汽炉',
    deviceType: 'B2',
    onlineIcon: 'blue_b2',
    offlineIcon: 'blue_b2',
  },
  B3: {
    title: '消毒柜',
    deviceType: 'B3',
    onlineIcon: 'blue_b3',
    offlineIcon: 'blue_b3',
  },
  B4: {
    title: '小烤箱',
    deviceType: 'B4',
    onlineIcon: 'blue_b4',
    offlineIcon: 'blue_b4',
  },
  B6: {
    title: '抽油烟机',
    deviceType: 'B6',
    onlineIcon: 'blue_b6',
    offlineIcon: 'blue_b6',
  },
  B7: {
    title: '燃气炉',
    deviceType: 'B7',
    onlineIcon: 'blue_b7',
    offlineIcon: 'blue_b7',
  },
  B8: {
    title: '吸尘器',
    deviceType: 'B8',
    onlineIcon: 'blue_b8',
    offlineIcon: 'blue_b8',
  },
  B9: {
    title: '多头炉',
    deviceType: 'B9',
    onlineIcon: 'gray_b9',
    offlineIcon: 'gray_b9',
  },
  BF: {
    title: '微波蒸汽烤箱',
    deviceType: 'BF',
    onlineIcon: 'blue_bf',
    offlineIcon: 'blue_bf',
  },
  CA: {
    title: '冰箱',
    deviceType: 'CA',
    onlineIcon: 'blue_cb_ca',
    offlineIcon: 'blue_cb_ca',
  },
  CB: {
    title: '大屏智能冰箱',
    deviceType: 'CB',
    onlineIcon: 'blue_cb_ca',
    offlineIcon: 'blue_cb_ca',
  },
  CC: {
    title: '中央空调',
    deviceType: 'CC',
    onlineIcon: 'blue_cc',
    offlineIcon: 'blue_cc',
  },
  DA: {
    title: '波轮洗衣机',
    deviceType: 'DA',
    onlineIcon: 'blue_da',
    offlineIcon: 'blue_da',
  },
  DB: {
    title: '滚筒洗衣机',
    deviceType: 'DB',
    onlineIcon: 'blue_db',
    offlineIcon: 'blue_db',
  },
  DC: {
    title: '干衣机',
    deviceType: 'DC',
    onlineIcon: 'blue_da_db_d9',
    offlineIcon: 'blue_da_db_d9',
  },
  E1: {
    title: '洗碗机',
    deviceType: 'E1',
    onlineIcon: 'blue_e1',
    offlineIcon: 'blue_e1',
  },
  E2: {
    title: '电热水器',
    deviceType: 'E2',
    onlineIcon: 'blue_e2',
    offlineIcon: 'blue_e2',
  },
  E3: {
    title: '燃热水器',
    deviceType: 'E3',
    onlineIcon: 'blue_e3',
    offlineIcon: 'blue_e3',
  },
  E7: {
    title: '电磁炉',
    deviceType: 'E7',
    onlineIcon: 'blue_e7',
    offlineIcon: 'blue_e7',
  },
  E8: {
    title: '电炖锅',
    deviceType: 'E8',
    onlineIcon: 'blue_e8',
    offlineIcon: 'blue_e8',
  },
  E9: {
    title: '面包机',
    deviceType: 'E9',
    onlineIcon: 'blue_e9',
    offlineIcon: 'blue_e9',
  },
  EA: {
    title: '电饭煲',
    deviceType: 'EA',
    onlineIcon: 'blue_ea',
    offlineIcon: 'blue_ea',
  },
  EB: {
    title: '烹饪机',
    deviceType: 'EB',
    onlineIcon: 'blue_eb',
    offlineIcon: 'blue_eb',
  },
  EC: {
    title: '压力锅',
    deviceType: 'EC',
    onlineIcon: 'blue_ec',
    offlineIcon: 'blue_ec',
  },
  ED: {
    title: '净水机',
    deviceType: 'ED',
    onlineIcon: 'blue_ed',
    offlineIcon: 'blue_ed',
  },
  EF: {
    title: '豆浆机',
    deviceType: 'EF',
    onlineIcon: 'blue_ef',
    offlineIcon: 'blue_ef',
  },
  FA: {
    title: '风扇',
    deviceType: 'FA',
    onlineIcon: 'blue_fa',
    offlineIcon: 'blue_fa',
  },
  FB: {
    title: '电暖器',
    deviceType: 'FB',
    onlineIcon: 'blue_fb',
    offlineIcon: 'blue_fb',
  },
  FC: {
    title: '空气净化器',
    deviceType: 'FC',
    onlineIcon: 'blue_fc',
    offlineIcon: 'blue_fc',
  },
  FD: {
    title: '加湿器',
    deviceType: 'FD',
    onlineIcon: 'blue_fd',
    offlineIcon: 'blue_fd',
  },
  FE: {
    title: '空调扇',
    deviceType: 'FE',
    onlineIcon: 'blue_fe',
    offlineIcon: 'blue_fe',
  },
  CD: {
    title: '空气能热水器',
    deviceType: 'CD',
    onlineIcon: 'blue_cd',
    offlineIcon: 'blue_cd',
  },
  F1: {
    title: '破壁机',
    deviceType: 'F1',
    onlineIcon: 'blue_f1',
    offlineIcon: 'blue_f1',
  },
  15: {
    title: '电水壶',
    deviceType: '15',
    onlineIcon: 'blue_15',
    offlineIcon: 'blue_15',
  },
  C0: {
    title: '智能厨房秤',
    deviceType: 'C0',
    onlineIcon: 'blue_c0',
    offlineIcon: 'blue_c0',
  },
  C2: {
    title: '智能坐便器',
    deviceType: 'C2',
    onlineIcon: 'blue_c2',
    offlineIcon: 'blue_c2',
  },
  D9: {
    title: '复式洗衣机',
    deviceType: 'D9',
    onlineIcon: 'blue_d9',
    offlineIcon: 'blue_d9',
  },
  10002: {
    title: '禅意系列',
    deviceType: '10002',
    onlineIcon: 'blue_10002',
    offlineIcon: 'gray_10002',
  },

  '1C': {
    title: '智能音箱',
    deviceType: '1C',
    onlineIcon: 'blue_1c',
    offlineIcon: 'blue_1c',
  },

  16: {
    title: '智能网关',
    deviceType: '16',
    onlineIcon: 'blue_16',
    offlineIcon: 'blue_16',
  },
  17: {
    title: '智能晾衣机',
    deviceType: '17',
    onlineIcon: 'blue_17',
    offlineIcon: 'blue_17',
  },
  '9d': {
    title: '彩屏集控器',
    deviceType: '9d',
    onlineIcon: 'blue_9d',
    offlineIcon: 'gray_9d',
  },
  12: {
    title: '空气检测仪',
    deviceType: '12',
    onlineIcon: 'blue_12',
    offlineIcon: 'blue_12',
  },

  '1A': {
    title: '一路开关（网关）',
    deviceType: '1A',
    onlineIcon: 'blue_1a',
    offlineIcon: 'blue_1a',
  },
  24: {
    title: '快速烹饪机器人',
    deviceType: '24',
    onlineIcon: 'blue_24',
    offlineIcon: 'blue_24',
  },

  26: {
    title: '智能浴霸',
    deviceType: '26',
    onlineIcon: 'blue_26',
    offlineIcon: 'blue_26',
  },

  '9C': {
    title: '集成灶',
    deviceType: '9C',
    onlineIcon: 'blue_9c',
    offlineIcon: 'blue_9c',
  },
}

const bluetoothUtils = {
  locationdevice,
  hexToBinArray,
  inArray,
  ab2hex,
  hex2bin,
  hexCharCodeToStr,
  hexStringToArrayBuffer,
  delay,
  checkLogoAndType,
  formatStr,
}

module.exports = {
  bluetoothUtils: bluetoothUtils,
  locationdevice: locationdevice,
  hexToBinArray: hexToBinArray,
  inArray: inArray,
  ab2hex: ab2hex,
  hex2bin: hex2bin,
  hexCharCodeToStr: hexCharCodeToStr,
  hexStringToArrayBuffer: hexStringToArrayBuffer,
  delay: delay,
  checkLogoAndType: checkLogoAndType,
  formatStr: formatStr,
}
