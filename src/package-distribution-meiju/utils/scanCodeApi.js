/* eslint-disable @typescript-eslint/no-var-requires */
//扫设备二维码 一维码 能效二维码 触屏动态二维码 非智设备码 进入配网
import app from '../common/app'

import { hasKey, getStamp, getReqId } from 'm-utilsdk/index'
import { showToast } from './util.js'
import { addDeviceSDK } from './addDeviceSDK'
import { requestService } from './requestService'
import { isSupportPlugin } from './pluginFilter'
import { isAddDevice } from './temporaryNoSupDevices'
import { linkDevice } from './paths'
import { commonH5Api } from '../common/js/api'
import Dialog from '../../miniprogram_npm/m-ui/mx-dialog/dialog'
import { brandConfig } from '../pages/assets/js/brand'
const paths = require('./paths')

/**
 * @param {*} showNotSupport  扫描的二维码不适于添加设备弹窗方法
 * @param {*} justAppSupport  扫描的二维码仅在美居app支持弹窗方法
 * @param {*} actionGoNetwork  进入配网方法
 * @param {*} getDeviceApImgAndName 获取设备的图片和名字
 * @param {*} homegroupId 用户当前家庭的id
 * @param {*} homeName 用户当前家庭的名称
 * @returns
 */
export async function actionScanResult(
  showNotSupport,
  justAppSupport,
  actionGoNetwork,
  getDeviceApImgAndName,
  homegroupId,
  homeName,
) {
  let scanRes = ''
  try {
    scanRes = await scanCode()
  } catch (error) {
    console.log('微信扫码失败=========', error)
  }

  if (!scanRes.result) {
    return
  }

  // charSet: "UTF-8"
  // codeVersion: 5
  // errMsg: "scanCode:ok"
  // rawData: "aHR0cDovL3FyY29kZS5taWRlYS5jb20vbWlkZWFfZTMvaW5kZXguaHRtbD9jZD1lRFN1c2t4VXQxYVozUDB4LXpiOXFNWEdRMGgxLURkSm1Fc2Z2MndKJlNTSUQ9bWlkZWFfZTNfMDAzNg=="
  // result: "http://qrcode.midea.com/midea_e3/index.html?cd=eDSuskxUt1aZ3P0x-zb9qMXGQ0h1-DdJmEsfv2wJ&SSID=midea_e3_0036"
  // scanType: "QR_CODE"

  let scanType = [
    'AZTEC',
    'CODABAR',
    'CODE_39',
    'CODE_93',
    'CODE_128',
    'EAN_8',
    'EAN_13',
    'ITF',
    'MAXICODE',
    'RSS_14',
    'RSS_EXPANDED',
    'UPC_A',
    'UPC_E',
    'UPC_EAN_EXTENSION',
    'CODE_25',
  ] //一维码类型

  if (scanType.includes(scanRes.scanType)) {
    //扫码的类型是一维码
    actionOneOrEnergyCode(scanRes, '一维码', showNotSupport, justAppSupport, actionGoNetwork)
    return
  }

  if (scanRes.result.includes('el.bbqk.com')) {
    //扫码的类型是能效二维码
    actionOneOrEnergyCode(scanRes, '能效二维码', showNotSupport, justAppSupport, actionGoNetwork)
    return
  }

  if (addDeviceSDK.dynamicCodeAdd.isDeCodeDynamicCode(scanRes.result)) {
    //触屏动态二维码
    dynamicCodeAdd(scanRes.result, getDeviceApImgAndName, showNotSupport, justAppSupport)
    return
  }

  wx.showLoading() //解析等待loading
  let scanCodeRes = scanRes.result
  if (scanCodeRes) {
    const map = ['3', '5', '0', '100', '103']
    let result = scanCodeRes.replace(/\s*/g, '') //移除空格
    //如果链接里没有mode，补上默认mode=0
    if (!result.includes('mode=')) {
      result = result + '&mode=0'
    }
    const urlType = checkUrlType(result)
    const ifMideaQrcode = checkUrlQrcode(result)
    console.log('扫码成功返回', urlType, ifMideaQrcode, result)

    const isIntelligentDevice = checkIntelligentDevice(result)
    const isIntelligentDevices = checkIntelligentDevices(result)

    // 如果是非智能设备跳转非智设备虚拟插件页
    if (isIntelligentDevice) {
      wx.hideLoading()
      //非智统一修改为不支持弹框提示
      Dialog.confirm({
        title: '该二维码无法识别，请扫描机身上携带“智能产品”标识的二维码',
        confirmButtonText: '查看指引',
        confirmButtonColor: brandConfig.dialogStyle.confirmButtonColor,
        cancelButtonColor: brandConfig.dialogStyle.cancelButtonColor3,
        cancelButtonText: '取消',
      }).then((res) => {
        if (res.action == 'confirm') {
          clickQRcodeGuide()
        }
        // on confirm
      })
      return
    }

    // 跳转最新的虚拟插件页
    if (isIntelligentDevices) {
      wx.hideLoading()
      //非智统一修改为不支持弹框提示
      Dialog.confirm({
        title: '该二维码无法识别，请扫描机身上携带“智能产品”标识的二维码',
        confirmButtonText: '查看指引',
        confirmButtonColor: brandConfig.dialogStyle.confirmButtonColor,
        cancelButtonColor: brandConfig.dialogStyle.cancelButtonColor3,
        cancelButtonText: '取消',
      }).then((res) => {
        if (res.action == 'confirm') {
          clickQRcodeGuide()
        }
        // on confirm
      })
      return
    }

    if (!ifMideaQrcode) {
      wx.hideLoading()
      console.log('非midead 不支持')
      showNotSupport()
      return
    }

    if (ifMideaQrcode && !urlType) {
      wx.hideLoading()
      justAppSupport()
      return
    }

    let data = {}
    if (urlType && result.includes('cd=')) {
      //美的的密文二维码
      try {
        let decodeRes = await scanCodeDecode(result)
        console.log('二维码解密接口返回======', decodeRes)
        data.category = decodeRes.deviceType
        data.mode = addDeviceSDK.getMode(decodeRes.mode)
        data.sn8 = decodeRes.sn8
        data.ssid = decodeRes.ssid
        data.tsn = decodeRes.tsn ? decodeRes.tsn : ''
        data.sn = decodeRes.sn ? decodeRes.sn : ''
        console.log('scancodeDecode=========', data)
      } catch (error) {
        wx.hideLoading()
        if (error?.data?.code && error.data.code == 1) {
          showToast(error.data.msg, 'none', 3000)
        } else {
          showToast('当前网络信号不佳，请检查网络设置', 'none', 3000)
        }
        console.log('解密接口调用失败=========', error)
      }
    } else {
      data = getUrlParamy(result)
    }
    console.log('扫码解析出来数据', data)
    data.mode = data.mode || 0 //mode不存在 默认0
    if (data.mode.toString() === '999') {
      wx.hideLoading()
      console.log('扫码 不支持 非智能设备')
      showNotSupport()
      return
    }
    if (!map.includes((data.mode + '').toString())) {
      wx.hideLoading()
      console.log('扫码 不支持 的配网方式')
      justAppSupport()
      return
    }
    let formatType = '0x' + data.category.toLocaleUpperCase()
    if (!isSupportPlugin(formatType, data.sn8)) {
      wx.hideLoading()
      console.log('扫码 不支持 无对应插件')
      justAppSupport()
      return
    }
    const addDeviceInfo = getAddDeviceInfo(data)
    if (addDeviceInfo.moduleType == 0 && addDeviceInfo.category != 'C0') {
      console.log('扫码 不支持 特殊品类不支持')
      justAppSupport()
      return
    }
    if (!isAddDevice(data.category.toLocaleUpperCase(), data.sn8)) {
      wx.hideLoading()
      console.log('扫码 不支持 未测试')
      justAppSupport()
      return
    }
    wx.hideLoading()
    // 扫码成功时不执行自发现，防止扫码跳转后异常执行自发现
    app.globalData.ifBackFromScan = true

    actionGoNetwork(addDeviceInfo)
  }
}

//调取扫一扫 获取扫码的结果
function scanCode() {
  return new Promise((resolve, reject) => {
    wx.scanCode({
      success(res) {
        console.log('扫码结果', res)
        resolve(res)
      },
      fail(error) {
        console.log('扫码失败返回', error)
        reject(error)
      },
      complete() {},
    })
  })
}

//扫描一维码或能效二维码配网
async function actionOneOrEnergyCode(scanRes, codeType, showNotSupport, justAppSupport, actionGoNetwork) {
  wx.showLoading() //解析等待loading
  let scanCodeGuide = null
  try {
    scanCodeGuide = await isScanCodeGuide(scanRes.result)
    wx.hideLoading()
  } catch (error) {
    wx.hideLoading()
    showNotSupport()
    return
  }

  let { mode, code } = scanCodeGuide.data.data.mainConnectinfoList[0]
  let { category, enterpriseCode } = scanCodeGuide.data.data

  let data = {
    category: category,
    mode: mode,
    sn8: code,
    ssid: '',
  }

  const map = ['3', '5', '0', '100']

  if (data.mode.toString() === '999') {
    console.log('扫码 不支持 非智能设备')
    showNotSupport()
    return
  }

  if (!map.includes((data.mode + '').toString())) {
    console.log('扫码 不支持 的配网方式')
    justAppSupport()
    return
  }

  let formatType = '0x' + data.category.toLocaleUpperCase()

  if (!isSupportPlugin(formatType, data.sn8)) {
    console.log('扫码 不支持 无对应插件')
    justAppSupport()
    return
  }

  if (!isAddDevice(data.category.toLocaleUpperCase(), data.sn8)) {
    console.log('扫码 不支持 未测试')
    justAppSupport()
    return
  }

  const deviceInfo = getAddDeviceInfo(data)
  deviceInfo.enterprise = enterpriseCode
  deviceInfo.guideInfo = scanCodeGuide
  if (deviceInfo.moduleType == 0 && data.category != '0F') {
    console.log('扫码 不支持 特殊品类不支持')
    justAppSupport()
    return
  }

  // 扫码成功时不执行自发现，防止扫码跳转后异常执行自发现
  app.globalData.ifBackFromScan = true

  actionGoNetwork(deviceInfo)
}

//触屏动态二维码逻辑
function dynamicCodeAdd(scanCodeRes, getDeviceApImgAndName, showNotSupport, justAppSupport) {
  let scanCdoeResObj = addDeviceSDK.dynamicCodeAdd.getTouchScreenScanCodeInfo(scanCodeRes)
  console.log('dynamic Code Add info:', scanCdoeResObj)
  if (scanCdoeResObj.verificationCode && scanCdoeResObj.verificationCodeKey) {
    //有验证码信息
    let deviceNameAndImg = getDeviceApImgAndName(app.globalData.dcpDeviceImgList, scanCdoeResObj.type.toUpperCase())
    let addDeviceInfo = {
      mode: 100, //触屏配网mode
      type: scanCdoeResObj.type.toUpperCase(),
      sn: scanCdoeResObj.sn,
      bigScreenScanCodeInfo: scanCdoeResObj,
      deviceName: deviceNameAndImg.deviceName,
      deviceImg: deviceNameAndImg.deviceImg,
    }
    app.addDeviceInfo = addDeviceInfo
    // 动态扫码绑定添加白名单过滤逻辑
    let formatType = '0x' + addDeviceInfo.type.toLocaleUpperCase()
    let sn8 = addDeviceInfo.sn && addDeviceInfo.sn.substring(9, 17)
    addDeviceInfo.sn8 = addDeviceInfo.sn8 ? addDeviceInfo.sn8 : sn8
    if (!isSupportPlugin(formatType, sn8)) {
      console.log('扫码 不支持 无对应插件')
      justAppSupport()
      return
    }

    if (!isAddDevice(addDeviceInfo.type.toLocaleUpperCase(), sn8)) {
      console.log('扫码 不支持 未测试')
      justAppSupport()
      return
    }
    wx.showModal({
      title: '',
      content: `你正在添加${app.addDeviceInfo.deviceName},确定要继续吗？`,
      cancelText: '取消',
      cancelColor: '#488FFF',
      confirmText: '确定',
      confirmColor: '#488FFF',
      success(res) {
        if (res.confirm) {
          //确定
          wx.navigateTo({
            url: linkDevice,
          })
        }
      },
    })
  } else {
    wx.showModal({
      title: '',
      content: '该二维码无法识别，请扫描设备屏幕二维码',
      confirmText: '我知道了',
      confirmColor: '#488FFF',
      showCancel: false,
    })
  }
}

//扫码是否有配网指引
function isScanCodeGuide(scanCodeRes) {
  let resq = {
    qrcode: scanCodeRes,
    queryType: 3,
    stamp: getStamp(),
    reqId: getReqId(),
  }
  return new Promise((resolve, reject) => {
    requestService
      .request('multiNetworkGuide', resq)
      .then((resp) => {
        console.log('扫码请求返回指引为resp', resp)
        resolve(resp)
      })
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}

//获取扫描的二维码链接参数
function getUrlParamy(result) {
  const map = ['mode', 'type', 'tsn', 'type', 'v', 'SSID', 'dsn', 'ssid']
  if (
    (result.includes('//qrcode.midea.com') && result.includes('mode') && result.includes('type')) ||
    result.includes('dsn')
  ) {
    const res = result.split('?')[1]
    let list = []
    let paramy = []
    if (res.includes(';')) {
      list = res.split(';')
      console.log('paramy11111111', list)
      list.forEach((item) => {
        let itemList = []

        itemList = item.split('&')
        console.log('paramy2222', itemList)
        paramy = paramy.concat(itemList)
      })
    } else {
      paramy = res ? res.split('&') : []
    }
    console.log('paramy---------', paramy)
    let obj = {}
    paramy.forEach((item) => {
      let key = item.split('=')[0]
      let value = item.split('=')[1]
      if (map.includes(key)) {
        obj[key] = value
        if (key == 'type') {
          const type = value
          obj.category = compatibleType(type.slice(4, 6))
          const len = type.length
          obj.sn8 = type.slice(len - 8)
        } else if (key == 'mode') {
          obj[key] = addDeviceSDK.getMode(value)
        } else if (key == 'dsn') {
          obj.category = compatibleType(value.slice(4, 6))
          obj.sn8 = value.substring(9, 17)
        }
      }
    })
    return obj
  }
}

//解析品类兼容
function compatibleType(type) {
  if (type == '00' || type == 'AB') {
    //空调特殊转化
    type = 'ac'
  }
  return type.toLocaleUpperCase()
}

//处理设备信息
function getAddDeviceInfo(data) {
  const moduleType = getModuleType(data)
  const mode = hasKey(data, 'mode') ? addDeviceSDK.getMode(data.mode) : ''
  const addDeviceInfo = {
    isFromScanCode: true,
    deviceName: '',
    deviceId: '', //设备蓝牙id
    mac: '', //设备mac 'A0:68:1C:74:CC:4A'
    category: hasKey(data, 'category') ? data.category : '', //设备品类 AC
    sn8: hasKey(data, 'sn8') ? data.sn8 : '',
    deviceImg: '', //设备图片
    moduleType: moduleType, //模组类型 0：ble 1:ble+weifi
    blueVersion: '', //蓝牙版本 1:1代  2：2代
    mode: mode,
    tsn: hasKey(data, 'tsn') ? data.tsn : '',
    fm: 'scanCode',
    SSID: getSsid(data),
    sn: hasKey(data, 'sn') ? data.sn : '',
  }
  return addDeviceInfo
}

//获取设备moduleType
function getModuleType(item) {
  if (item.mode == 3 || item.mode == '003') return '1'
  if (item.mode == 5 || item.mode == '005') return '0'
}

//检查 二维码链接是否是美的设备二维码
function checkUrlType(result) {
  let tag = false
  if (
    result.includes(brandConfig.qrcode || '//qrcode.midea.com') &&
    result.includes('mode') &&
    result.includes('type')
  ) {
    tag = true
  }
  if (result.includes(brandConfig.qrcode || '//qrcode.midea.com') && result.includes('cd=')) {
    //美的密文二维码支持
    tag = true
  }
  if (result.includes('www.midea.com') && result.includes('cd=')) {
    //美的密文二维码支持
    tag = true
  }
  if (
    result.includes(brandConfig.qrcode || '//qrcode.midea.com') &&
    (result.includes('v=5') || result.includes('V=5')) &&
    result.includes('dsn=')
  ) {
    //美的V5版本的新标准二维码
    tag = true
  }
  return tag
}

//检查 扫描的二维码链接是否是美的设备的
function checkUrlQrcode(result) {
  let tag = false
  if (result.includes(brandConfig.qrcode || '//qrcode.midea.com')) {
    tag = true
  }
  if (result.includes('www.midea.com')) {
    tag = true
  }
  return tag
}

// 校验非智能链接，微清还是生电的链接
function checkIntelligentDevice(result) {
  let tag = false
  if (
    result.includes('//www.smartmidea.net') &&
    (result.includes('/projects/sit/mini-qrcode/') || result.includes('/projects/mini-qrcode/'))
  ) {
    tag = true
  }
  return tag
}

// 校验最新标准非智能链接
function checkIntelligentDevices(result) {
  let tag = false
  if (
    (result.includes('//qrcode.midea.com/test/qrcode') || result.includes('//qrcode.midea.com/NI/')) &&
    (result.includes('tsn') || result.includes('dsn') || result.includes('type'))
  ) {
    tag = true
  }
  return tag
}

//获取设备ssid
function getSsid(data) {
  if (data.ssid) return data.ssid
  if (data.SSID) return data.SSID
  return ''
}

//密文二维码扫码解析
function scanCodeDecode(qrCode, timeout = 3000) {
  let resq = {
    qrCode: qrCode,
    reqId: getReqId(),
    stamp: getStamp(),
  }
  return new Promise((resolve, reject) => {
    requestService
      .request('scancodeDecode', resq, 'POST', '', timeout)
      .then((resp) => {
        console.log('密文二维码扫码解析', resp.data.data)
        resolve(resp.data.data)
      })
      .catch((error) => {
        console.log('密文二维码扫码解析error', error)
        reject(error)
      })
  })
}

// 点击跳转机身二维码指引
function clickQRcodeGuide() {
  jumpQRcodeGuide()
}
function jumpQRcodeGuide() {
  const guideUrl =
    brandConfig.QRcodeGuideUrl ||
    `${paths.webView}?webViewUrl=${encodeURIComponent(
      `${commonH5Api.url}deviceQrCode.html`,
    )}&pageTitle=如何找到设备的二维码`
  wx.navigateTo({
    url: guideUrl,
  })
}
