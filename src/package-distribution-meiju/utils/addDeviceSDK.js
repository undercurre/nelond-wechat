/**
 * author : lisin
 * desc   : 添加设备相关通用方法
 * date   : 2021/11/24 15:00pm
 */

import app from '../common/app'
import config from '../common/js/config.js'
import paths from './paths'
import { getReqId, getStamp, cloudDecrypt, hexCharCodeToStr, CryptoJS } from 'm-utilsdk/index'
import { isSupportPlugin } from './pluginFilter.js'
import { requestService } from './requestService'
import { brandConfig } from '../pages/assets/js/brand'

//配网方式list
const modeList = {
  0: 'ap',
  1: '快连',
  2: '声波配网',
  3: '蓝牙配网',
  4: '零配',
  5: '单蓝牙',
  6: 'zebee网关',
  7: '网线',
  8: 'NB - IOT',
  9: 'Msmart - lite协议',
  17: '数字遥控器配网',
  10: '本地蓝牙直连',
  20: '家用协议直连',
  21: '家用协议配网',
  30: 'msmart 直连', //小程序自定义
  31: 'msmart 直连后做wifi绑定', //小程序自定义
  100: '动态二维码(触屏配网)',
  101: 'zebee网关 + 手机蓝牙',
  102: '蓝牙网关 + 手机蓝牙',
  103: '大屏账号绑定',
  104: '蓝牙网关 + zebee网关 + 手机蓝牙',
  998: '客方配网',
  999: '非智能设备',
}

//目前小程序支持的配网模式
let supportAddDeviceMode = []
brandConfig.ap && supportAddDeviceMode.push(0)
brandConfig.bluetooth && supportAddDeviceMode.push(3)
brandConfig.singleBlue && supportAddDeviceMode.push(5)
brandConfig['NB-IOT'] && supportAddDeviceMode.push(8)
brandConfig.localBlue && supportAddDeviceMode.push(9, 10)
brandConfig.matchNetAfterDirectConn_AC && supportAddDeviceMode.push(20, 21)
brandConfig.matchNetAfterDirectConn_WB01 && supportAddDeviceMode.push(30, 31)
brandConfig.dynamicQRcode && supportAddDeviceMode.push(100)
brandConfig.bigScreenBind && supportAddDeviceMode.push(103)

//需要小程序授权使用蓝牙的配网模式
const bluetoothAuthModes = [3, 5, 20, 21, 30, 31] //蓝牙配网涉及的mode

//支持wb01直连后配网的白名单
const wb01BindBLeAfterWifi = {
  13: {
    SN8: ['79009833'],
  },
  26: {
    SN8: ['5706674Q', '5706674P', '57066720'],
  },
}

//是否走wb01直连后配网
const isCanWb01BindBLeAfterWifi = (type, sn8) => {
  let tag = false

  if (Object.keys(wb01BindBLeAfterWifi).includes(type)) {
    if (wb01BindBLeAfterWifi[type]['SN8'].includes(sn8)) {
      tag = true
    }
  }
  return tag
}
//设备ap默认密码
const deviceApPassword = '12345678'
//空调设备 配网 黑白名单
const addDeviceACList = {
  white: [
    '22251469',
    '222Z1531',
    '22251471',
    '22012869',
    '22012871',
    '220Z1524',
    '22012863',
    '220Z1523',
    '22251473',
    '22251491',
    '222Z1535',
    '22251499',
    '22251489',
    '222Z1532',
    '22012887',
    '22012889',
    '22012899',
    '220Z2338',
    '220Z1552',
    '220F1079',
    '220F1077',
    '22012897',
    '220Z1554',
    '22251507',
    '22251505',
    '222Z1560',
    '22012879',
    '22012883',
    '220Z1529',
    '22012875',
    '22012873',
    '220Z1526',
    '222Z1566', // QJ200_51_72_BLE
    '22251511', // QJ200_51_72_BLE
    '22251509', // QJ200_51_72_BLE
    '22251517', // YB233_D5_BLE
    '22251513', // YB233_D5_BLE
    '222Z1567', // YB233_D5_BLE
    '22251515', // TP200_D5_BLE
    '22251519', // TP200_D5_BLE
    '222Z1571', // TP200_D5_BLE
    '220Z1565',
    '22012925',
    '22012929', // QJ200_26_35_BLE
    '22012927',
    '220Z1564', // MCA1_BLE,
    '22012933',
    '220Z1570',
    '22012931', // F1_1_26_35_BLE
    '22251523',
    '22251521', // MZB_风尊,
    '22396413',
    '22396415',
    '22396421',
    '22396411',
    '22396419',
    '22396417',
    '22396569',
    '22396561',
    '22396565',
    '22396567',
    '22396559',
    '22396563', // 酷风 96413/96415/96421/96411/96419/96417/96569/96561/96565/96567/96559/96563
    '22020087',
    '22020085',
    '220Z1926',
    '220F9025', // W11 20085/Z1926/F9025
    '222Z1576',
    '22251529',
    '22251531', // VC201 Z1576/51529/51531
    '22012959',
    '22012957',
    '22013001',
    '220Z1591', // D1-1  12959/12957
    '22251537',
    '22251535', // KS1-1 51537/51535
    '22251533',
    '22251557', // HY1-1 22251533\22251557
    '22251559',
    '222Z1581',
    '22251545', // 22251559/222Z1581/22251545 F1-1柜
    '22012983',
    '22012985', // 22012983、22012985 QD201
    '22012971',
    '22012973', // 22012971、22012973 PH201,
    '22251569',
    '22251565',
    '22251563',
    '22251567', // 22251569 22251565 22251563 22251567  N8MJD1 N8ZHD1
    '22251539',
    '22251541', // 22051539 22051541 KS1_3_BLE
    '22012999',
    '22012997', // 22012999 22012997 N8KS1-1
    '22013031',
    '22013029',
    '220F1101', // 22013031 22013029 N8KS1-3
    '22013049', // 22013049 KFR-46GW/KS1-1
    '22013003',
    '22013005',
    '220F1071',
    '220F1073', // 22013003 22013005 220F1071 220F1073 N8XF1-1
    '22013025',
    '22013027',
    '220Z1590', // K2-1
    '22251573',
    '22251571', // MJ101(1),
    '222Z1592',
    '22251575', // M2-1,
    '22013045',
    '22013043',
    '220Z1593',
    '22013041', // JH1-1
    '22012951',
    '220Z1580', // KFR-35G/T5[Y] KFR-35G/T5
    '22013019',
    '220Z1587', // KFR-35G/T3 KFR-35G/T3[Y]
    '22251525',
    '222Z1568', // KFR-72L/T5 KFR-72L/T5[Y]
    '22260049',
    '22260047', //  KFR-72/W11
    '24012965', // 厨房空调 24012965 240Z1595 24013047 240Z1597 129Z2363
    '240Z1595',
    '24013047',
    '240Z1597',
    '129Z2363',
    '240F1093',
    '240F1107',
    '220F1173',
    '220F1171', // N8KQ1-D1
  ], // MXC MZB K1-1 MKA YA103 x1-1 vc200 KW200A_26_35_BLE N8MKA1A_26_35_BLE KS1-1 HY1-1
  black: [
    '22040013',
    '22040017',
    '22040015',
    '22040019',
    '22040021',
    '22040047',
    '22040049',
    '22270015',
    '22270019',
    '22270023',
    '22270025',
    '22270031',
    '22270033',
    '22270027',
    '22270029',
    '222Z1803',
    '222Z1802',
    '222Z1800',
    '22270017',
    '22270021',
    '22270045',
    '22270043',
    '22270035',
    '22270037',
    '222Z1806',
    '22270041',
    '22270039',
    '22040025',
    '22040023',
    '22040027',
    '22040029',
    '220Z1805',
    '220Z1801',
    '22040035',
    '22040037',
    '220Z1807',
    '22040031',
    '22040033',
    '220Z1804',
    '22040039',
    '22040041',
    '220Z1808',
    '22040045',
    '22040051',
    '22040043',
    '220F4015',
    '220F4013',
    '220F4011',
    '22270047',
    '220F4005',
    '22040053',
    '22040057',
    '22040055',
    '220F4017',
    '22270055',
    '22270053',
    '22270051',
    '22270049',
    '22040063',
    '22040061',
    '22040059',
  ],
}

//支持添加自发现空调型号
const supportAutoFoundACModel = [
  'KFR-35G/N8MXC1A',
  'KFR-35G/N8MXC1A[Y]',
  'KFR-35G/N8MXC1',
  'KFR-26G/N8MXC1',
  'KFR-72L/N8MZB1',
  'KFR-51L/N8MZB1',
  'KFR-72L/N8MZB1[Y]',
  'KFR-72L/K1-1A',
  'KFR-51L/K1-1A',
  'KFR-72L/K1-1A[Y]',
  'KFR-51L/N8MKA1A',
  'KFR-72L/N8MKA1A',
  'KFR-72L/N8MKA1A[Y]',
  'KFR-35G/N8MXC1[Y]',
  'KFR-35G/BDN8Y-YA103(1)A',
  'KFR-26G/BDN8Y-YA103(1)A',
]

const addDeviceSDK = {
  modeList: modeList,
  supportAddDeviceMode,
  isCanWb01BindBLeAfterWifi,
  deviceApPassword: deviceApPassword,
  addDeviceACList: addDeviceACList,
  bluetoothAuthModes: bluetoothAuthModes,
  supportAutoFoundACModel: supportAutoFoundACModel,

  /**
   * 已知设备信息跳转设备配网
   * @param {
   *  type               设备品类         必传
   *  sn8                设备sn8          必传
   *  A0                 A0               非必
   *  mode               配网方式          非必
   *  guideInfo          配网指引          非必
   *  isCheckHasPlugin   是否校验有插件     非必     默认校验
   * }
   *
   */
  goToAddDevice({ type, sn8, A0, mode, guideInfo, isCheckHasPlugin = true }) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      // if (!paramas.type || !paramas.sn8) { //无完整设备信息直接跳转添加设备页
      //     wx.navigateTo({
      //         url: paths.scanDevice,
      //     })
      // }
      if (isCheckHasPlugin) {
        //配网模块产品逻辑 需校验是否有对应插件控制
        let type0x = type.includes('0x') ? type : '0x' + type
        if (!isSupportPlugin(type0x, sn8)) {
          //无插件
          reject({
            code: 1001,
            msg: '小程序当前无对应插件控制此设备',
          })
        }
      }
      if (!mode || !guideInfo) {
        try {
          let guideRes = await this.getAddDeviceModeAndGuide({
            type,
            sn8,
            mode,
          })
          guideInfo = guideRes.guideInfo
          mode = this.modeTransition(guideRes.mode)
          console.log('mode=======', mode, this.isSupportAddDeviceMode(mode))
          if (!this.isSupportAddDeviceMode(mode)) {
            //mode校验
            reject({
              code: 1003,
              msg: '小程序当前不支持的配网方式',
            })
          } else {
            app.addDeviceInfo.type = type
            app.addDeviceInfo.sn8 = sn8
            app.addDeviceInfo.guideInfo = guideInfo
            app.addDeviceInfo.mode = mode
            wx.navigateTo({
              url: paths.inputWifiInfo,
            })
            resolve({
              code: 0,
              msg: '成功',
            })
          }
        } catch (error) {
          reject({
            code: 1004,
            msg: '获取配网指引失败' + error,
          })
        }
      }
    })
  },

  //跳转添加设备页自动打开扫码
  goToScanCodeAddDevice() {
    wx.navigateTo({
      url: paths.scanDevice + '?openScan=true',
    })
  },

  //配网方式的转化 产品逻辑处理
  modeTransition(mode) {
    mode = mode + ''
    if (mode == 1) {
      //特殊逻辑 快连在小程序转为ap配网
      return 0
    } else if (mode == '' || !Object.keys(this.modeList).includes(mode)) {
      //mode为空 或者不规则都转为ap配网
      return 0
    }
    return mode * 1
  },

  //是否是支持的配网方式
  isSupportAddDeviceMode(mode) {
    mode = mode * 1
    mode = this.modeTransition(mode)
    return this.supportAddDeviceMode.includes(mode)
  },

  //计算udp广播地址
  getBroadcastAddress(ip, mask) {
    let maskBin = this.ip2bin(mask)
    let overMaskBin = this.overBin(maskBin)
    return this.andBin(ip, overMaskBin)
  },

  //把地址转换成二进制格式
  ip2bin(ip) {
    let ip_str = '',
      ip_arr = ip.split('.'),
      curr_num,
      number_bin,
      count
    for (let i = 0; i < 4; i++) {
      curr_num = ip_arr[i]
      number_bin = parseInt(curr_num)
      number_bin = number_bin.toString(2)
      count = 8 - number_bin.length
      for (let j = 0; j < count; j++) {
        number_bin = '0' + number_bin
      }
      ip_str += number_bin + (i == 3 ? '' : '.')
    }
    return ip_str
  },

  //二进制反码
  overBin(mask) {
    let binIpArr = mask.split('.')
    let overArr = []
    binIpArr.forEach((item) => {
      let overItem = ''
      item.split('').forEach((item2) => {
        overItem += Number(item2) ? 0 : 1
      })
      overArr.push(parseInt(overItem, 2))
    })
    return overArr
  },

  //地址与
  andBin(ip, mask) {
    let ipArr = ip.split('.')
    let broadcast = []
    for (let i = 0; i < 4; i++) {
      broadcast.push(ipArr[i] | mask[i])
    }
    return broadcast.join('.')
  },

  /**
   * desc: 知道设备的品类、sn8 获取设备的配网方式  注：调接口需登录
   * @params {type,sn8}
   * @return {mode,guideInfo}
   */
  getAddDeviceModeAndGuide({ type, sn8, mode }) {
    let param = {
      category: type.includes('0x') ? type.substr(2, 2) : type,
      code: sn8,
      mode: mode || null,
      queryType: 2,
      stamp: getStamp(),
      reqId: getReqId(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('multiNetworkGuide', param)
        .then((res) => {
          console.log('res====', res)
          resolve({
            mode: res.data.data.mainConnectinfoList[0].mode,
            guideInfo: res.data.data.mainConnectinfoList[0],
          })
        })
        .catch((err) => {
          console.log('error=====', err)
          reject(err)
        })
    })
  },

  /**
   * 0是AP配网，1是单蓝牙模组的蓝牙绑定, 2是combo的蓝牙配网,3是combo模组的蓝牙绑定, 不传默认都是AP配网
   * @param {*} mode
   * @param {*} moduleType  0:ble 1:combo
   */
  mode2bindType(mode, moduleType) {
    if (mode == 0) {
      return 0 //配网
    }
    if (mode == 3) {
      return 2 //配网
    }
    if (mode == 5) {
      return moduleType ? 3 : 1
    }
    if (mode == 20) {
      return 3 //combo 蓝牙
    }
    if (mode == 21) {
      return 2 //遥控器 后配网
    }
    if (mode == 30) {
      return 3 //遥控器 后配网
    }
    if (mode == 31) {
      return 2 //遥控器 后配网
    }
    return null
  },

  //是否是需要屏蔽的空调蓝牙信号
  isShiledAcAdata(type, sn8) {
    return type === 'AC' && this.addDeviceACList.black.includes(sn8)
  },

  //是否是走直连后配网的空调sn8
  isBlueAfterLinlNetAc(type, sn8) {
    return type.toLocaleUpperCase().includes('AC') && this.addDeviceACList.white.includes(sn8)
  },

  //获得连接方式
  getLinkType(mode) {
    let linkType = ''
    if (mode == 0) {
      linkType = 'ap'
    }
    if (mode == 3 || mode == 5) {
      linkType = 'bluetooth'
    }
    if (mode == 9 || mode == 10) {
      linkType = '本地蓝牙直连'
    }
    return linkType
  },

  //判断是否是设备ap
  isDeviceAp(ssid) {
    let reg = /(midea|bugu|toshiba)_[a-z\d]{2}_.{4}/
    let re = new RegExp(reg)
    return re.test(ssid.toLocaleLowerCase())
  },

  //判断是否是设备ip
  isDeviceIp(ip) {
    let deviceIp = '192.168.1'
    return ip.includes(deviceIp)
  },

  //rssi强度转微信wifi信号强度
  rssiChangeSignalStrength(rssi) {
    return parseInt(Math.abs(((rssi - -100) * 99) / -45))
  },

  //设备信息
  //获取明文sn
  getDeviceSn(sn) {
    const cipText = sn || ''
    const appKey = config.appKey[config.environment]
    const key = app.globalData.isLogon ? app.globalData.userData.key : ''
    console.log('sn解密前', cipText, key, appKey)
    const plainTextSn = cloudDecrypt(cipText, key, appKey)
    console.log('sn解密后', plainTextSn)
    return plainTextSn
  },

  //获取sn8
  getDeviceSn8(sn) {
    if (!sn) return ''
    return sn.substring(9, 17)
  },

  /**
   * 判断ap自发现设备是否是已ap配网的设备  解决wx.getWifiList 有缓存问题
   * @param {*} ssid wifi ssid
   */
  checkIsAddedApDevice(ssid) {
    const list = app.globalData.curAddedApDeviceList || []
    if (list.length === 0) return false
    return list.some((item) => {
      return item.ssid === ssid
    })
  },

  //msmartlite插件直连插件 跳转配网
  msmartLiteBlueAfterLinkNet({
    type,
    sn8,
    deviceId, //蓝牙id
    deviceName, //设备名字
    deviceImg, //设备图片
  }) {
    app.addDeviceInfo.type = type
    app.addDeviceInfo.sn8 = sn8
    app.addDeviceInfo.deviceId = deviceId
    app.addDeviceInfo.deviceName = deviceName
    app.addDeviceInfo.deviceImg = deviceImg
    app.addDeviceInfo.mode = 3
    app.addDeviceInfo.fm = 'bluePugin'
    app.addDeviceInfo.blueVersion = 2
    app.addDeviceInfo.isCheck = true
    wx.navigateTo({
      url: paths.inputWifiInfo,
    })
  },

  /**
   *
   * @param {*} applanceCode 设备code
   */
  checkDeviceAuth(applianceCode) {
    return new Promise((resolve, reject) => {
      let reqData = {
        applianceCode: applianceCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('getApplianceAuthType', reqData)
        .then((resp) => {
          console.log('首页卡片进插件页调用66666-查询确权状态', resp)
          if (resp.data.data.status == 1 || resp.data.data.status == 2) {
            //0 已确权 1 待确权 2 未确权 3 不支持确权
            resolve(true)
          } else {
            //不需要确权的
            if (!app.globalData.noAuthApplianceCodeList.includes(applianceCode)) {
              app.globalData.noAuthApplianceCodeList.push(applianceCode)
            }
            resolve(false)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  /**
   * 通过wifi名判断是否是5G wifi
   * @param {*} ssid
   */
  bySSIDCheckIs5g(ssid) {
    return !!(ssid.includes('5g') || ssid.includes('5G'))
  },

  //触屏动态二维码配网相关
  dynamicCodeAdd: {
    //判断是否是触屏动态配网生成的二维码
    isDeCodeDynamicCode(scanCodeRes) {
      if (!scanCodeRes) return false
      let isDeCodeDynamicCode = true
      let keys = ['appliance=', 'ck=', 'cd=']
      for (let i = 0; i < keys.length; i++) {
        if (!scanCodeRes.includes(keys[i])) {
          isDeCodeDynamicCode = false
          return isDeCodeDynamicCode
        }
      }
      return isDeCodeDynamicCode
    },
    //解密动态二维码
    deCodeDynamicCodeSn(enCodeSn, key) {
      let wordArray = CryptoJS.enc.Utf8.parse(key)
      key = CryptoJS.MD5(wordArray).toString().substring(0, 16)

      let cipherTextHexStr = CryptoJS.enc.Hex.parse(enCodeSn)
      let baseData = CryptoJS.enc.Base64.stringify(cipherTextHexStr)
      key = CryptoJS.enc.Utf8.parse(key)

      let decodeData = CryptoJS.AES.decrypt(baseData, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      })
      console.log('解密的sn===', decodeData.toString())
      return hexCharCodeToStr(decodeData.toString())
    },

    //获取大屏二维码原文中的 信息
    getTouchScreenScanCodeInfo(scanCodeRes) {
      if (!this.isDeCodeDynamicCode(scanCodeRes))
        return {
          res: '二维码格式不符合要求',
        }
      let keyVulueArr = scanCodeRes.split('?')[1].split('&')
      let resObject = {}
      keyVulueArr.forEach((item) => {
        resObject[item.split('=')[0]] = item.split('=')[1]
      })
      console.log('keyVulueArr===', resObject)
      resObject.verificationCodeKey = resObject.ck ? resObject.ck : ''
      resObject.verificationCode = resObject.cd ? resObject.cd : ''
      resObject.type = resObject.appliance ? resObject.appliance.substring(0, 2) : ''

      let enCodeSn = resObject.appliance ? resObject.appliance.substring(2) : ''
      let key = '0x' + resObject.type + '_msmart'

      resObject.sn = this.deCodeDynamicCodeSn(enCodeSn, key)

      return resObject
    },
  },

  //获取设备mode
  getMode(mode) {
    if (mode == '003') {
      return 3
    } else if (mode == '005') {
      return 5
    } else if (mode == '000' || mode == '001' || mode == '1') {
      //001 1 的mode临时转为ap配网
      return 0
    } else if (mode == '' || !Object.keys(modeList).includes(mode.toString())) {
      //mode为空 或者不规则都转为ap配网
      return 0
    }
    return mode
  },
}

export { addDeviceSDK }
