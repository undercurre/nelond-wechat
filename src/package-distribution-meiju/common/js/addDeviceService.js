/**
 * 配网公共类
 */

import { api } from '../../common/js/api'
import paths from '../../utils/paths'
import { getStamp, getReqId, hexCharCodeToStr, cloudDecrypt, CryptoJS } from 'm-utilsdk/index'
import { isSupportPlugin } from '../../utils/pluginFilter.js'
import { requestService } from '../../utils/requestService'
import app from '../app'

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
const supportAddDeviceMode = [0, 3, 5, 9, 10, 20, 21, 30, 31, 100]

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
const isCanWb01BindBLeAfterWifi = (type, sn8, A0 = '') => {
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
    '22012897',
    '220Z1554',
    '22251507',
    '22251505',
    '222Z1560',
  ], // MXC MZB K1-1 MKA YA103 x1-1 vc200
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

const addDeviceService = {
  modeList: modeList,
  supportAddDeviceMode: supportAddDeviceMode,
  isCanWb01BindBLeAfterWifi: isCanWb01BindBLeAfterWifi,
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
        //无配网方式 或 指引
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
    return this.supportAddDeviceMode.includes(mode) ? true : false
  },

  //计算udp广播地址
  getBroadcastAddress(ip, mask) {
    let maskBin = this.ip2bin(mask)
    let overMaskBin = this.overBin(maskBin)
    return this.andBin(ip, overMaskBin)
  },

  //把地址转换成二进制格式
  ip2bin(ip) {
    var ip_str = '',
      ip_arr = ip.split('.'),
      curr_num,
      number_bin,
      count
    for (var i = 0; i < 4; i++) {
      curr_num = ip_arr[i]
      number_bin = parseInt(curr_num)
      number_bin = number_bin.toString(2)
      count = 8 - number_bin.length
      for (var j = 0; j < count; j++) {
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
    for (var i = 0; i < 4; i++) {
      broadcast.push(ipArr[i] | mask[i])
    }
    return broadcast.join('.')
  },

  //调添加设备灰度权限接口
  getCheckUserCanAddDevice() {
    let reqData = {
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('addDeviceGray', reqData)
        .then((resp) => {
          console.log('调接口判断用户是否可以进行添加设备', resp.data.data)
          resolve(resp.data.data)
        })
        .catch((error) => {
          console.log('调添加设备灰度权限接口', error)
          reject(error)
        })
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
    return type == 'AC' && this.addDeviceACList.black.includes(sn8) ? true : false
  },

  //是否是走直连后配网的空调sn8
  isBlueAfterLinlNetAc(type, sn8) {
    return type.toLocaleUpperCase().includes('AC') && this.addDeviceACList.white.includes(sn8) ? true : false
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
    let reg = /(midea|bugu|toshiba)_[a-z0-9]{2}_.{4}/
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
    const appKey = api.appKey
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
    return app.globalData.curAddedApDeviceList.includes(ssid)
  },

  /**
   * 获取设备确权情况
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
          console.log('查询确权状态', resp)
          if (resp.data.data.status == 1 || resp.data.data.status == 2) {
            //0 已确权 1 待确权 2 未确权 3 不支持确权
            resolve(true)
          } else {
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
    if (ssid.includes('5g') || ssid.includes('5G')) {
      return true
    }
    return false
  },

  //触屏动态二维码配网相关
  dynamicCodeAdd: {
    //判断是否是触屏动态配网生成的二维码
    isDeCodeDynamicCode(scanCodeRes) {
      if (!scanCodeRes) return false
      let isDeCodeDynamicCode = true
      let keys = ['appliance=', 'ck=', 'cd=']
      for (var i = 0; i < keys.length; i++) {
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
      keyVulueArr.forEach((item, index) => {
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
    } else if (mode == '' || !Object.keys(modeList).includes(mode)) {
      //mode为空 或者不规则都转为ap配网
      return 0
    }
    return mode
  },
}

export { addDeviceService }
