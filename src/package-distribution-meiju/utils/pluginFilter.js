import paths from './paths'
import { getPluginUrl } from './getPluginUrl'
import app from '../common/app'
import Dialog from '../../miniprogram_npm/m-ui/mx-dialog/dialog'
import { getFullPageUrl } from './util'
const isSupportPlugin = (type, sn8, A0 = '', isOtherEquipment = '0', cardType) => {
  return true
}

//过滤小程序支持的设备（因为涉及到回归验证的问题，暂时不合并其他业务的过滤逻辑）
function filterSupportedPlugin(type, sn8, A0, isOtherEquipment, cardType) {
  return true
}
//微清相关插件合包
const msoType = ['B0', 'B1', 'B2', 'B4', '9B', 'BF']
const getCommonType = (type) => {
  return msoType.indexOf(type.substr(2)) > -1 ? '0xBX' : type
}

/**
 * deviceInfo 设备信息
 * hasPageName 是否是后确权页面过来
 */
function showDialog(deviceInfo, hasPageName) {
  Dialog.confirm({
    title: '无法跳转设备控制页面',
    message: '未获取到控制页面，请检查网络后重试，若仍无法获取，请联系客服',
    confirmButtonText: hasPageName ? '我知道了' : '返回首页',
    // confirmButtonColor: brandConfig.dialogStyle.confirmButtonColor,
    // cancelButtonColor: brandConfig.dialogStyle.cancelButtonColor3,
    cancelButtonText: '返回首页',
    showCancelButton: hasPageName,
  })
}

/**
 * 统一跳转支持的插件页
 * deviceInfo {Object} 必
 *
 * isRomoveRoute {boolear} 是否清除路由栈 默认 false
 *
 * fromPage 因为多个页面有用到此方法，其中后确权页面有调整，故新增一个参数fromPage，默认为空
 */
function goTopluginPage(deviceInfo, backPage = '', isRomoveRoute = false, fromPage = '') {
  if (!deviceInfo) {
    console.log('无跳转设备信息')
    return
  }
  console.log('deviceInfo====', typeof deviceInfo)
  console.log('deviceInfo==type==', deviceInfo.type)
  console.log('deviceInfo=====', deviceInfo)
  let type = deviceInfo.type.includes('0x') ? deviceInfo.type : '0x' + deviceInfo.type
  let category = type
  let sn8 = deviceInfo.sn8
  type = getCommonType(type)
  type = type.includes('0x') ? type.substr(2, 2) : type
  deviceInfo = JSON.stringify(deviceInfo)
  console.log('fromPage:', fromPage)
  let hasPageName = fromPage == 'afterCheck' ? false : true

  let pageAddress = getFullPageUrl() // colmo 首页卡片引用此方法，app.addDeviceInfo.cloudBackDeviceInfo.modelNumber 可能不存在，导致点击不成功，且首页不应该弹出弹窗，所以添加页面判断
  let isNoIndex = false

  if (
    pageAddress.includes('addDevice/pages/afterCheck/afterCheck') ||
    pageAddress.includes('addDevice/pages/inviteFamily/inviteFamily')
  ) {
    isNoIndex = true
    console.log(
      'isSupportPlugin!!!!,deviceInfo.type, deviceInfo.sn8, app.addDeviceInfo.cloudBackDeviceInfo.modelNumber:',
      category,
      sn8,
      app.addDeviceInfo.cloudBackDeviceInfo?.modelNumber,
    )
    console.log(
      'isSupportPlugin2!!!!,',
      isSupportPlugin(category, sn8, app.addDeviceInfo.cloudBackDeviceInfo?.modelNumber, '0'),
    )
    if (!isSupportPlugin(category, sn8, app.addDeviceInfo?.cloudBackDeviceInfo.modelNumber, '0')) {
      showDialog(deviceInfo, hasPageName)
      return
    }
  }
  if (isRomoveRoute) {
    wx.reLaunch({
      // url: `/plugin/T0x${type}/index/index?deviceInfo=` + encodeURIComponent(deviceInfo) + `&backTo=${backPage}`,
      url: getPluginUrl(type, deviceInfo) + `&backTo=${backPage}`,
      success: () => {},
      fail: () => {
        if (isNoIndex) {
          showDialog(deviceInfo, hasPageName)
        }
      },
    })
  } else {
    wx.navigateTo({
      // url: `/plugin/T0x${type}/index/index?deviceInfo=` + encodeURIComponent(deviceInfo) + `&backTo=${backPage}`,
      url: getPluginUrl(type, deviceInfo) + `&backTo=${backPage}`,
      success: () => {},
      fail: () => {
        if (isNoIndex) {
          showDialog(deviceInfo, hasPageName)
        }
      },
    })
  }
}

/**
 * 根据sn位数判断是否colmo设备
 * @param {*} decodedSn
 */
const isColmoDeviceByDecodeSn = (decodedSn = '') => {
  return decodedSn[8] === '8'
}

module.exports = {
  isSupportPlugin,
  getCommonType,
  goTopluginPage,
  isColmoDeviceByDecodeSn,
}
