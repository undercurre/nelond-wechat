import { deviceImgMap } from '../../utils/deviceImgMap'
import app from '../app'
import { deviceImgApi } from './api'
import config from './config.js'
import { cloudDecrypt } from 'm-utilsdk/index'
const getDeviceImgAndName = (dcpDeviceImgList, category, sn8) => {
  let item = new Object()
  if (dcpDeviceImgList[category]) {
    if (dcpDeviceImgList[category][sn8]) {
      item.deviceImg = dcpDeviceImgList[category][sn8]
    } else {
      item.deviceImg = dcpDeviceImgList[category].common
    }
  } else {
    if (deviceImgMap[category]) {
      item.deviceImg = deviceImgApi.url + 'blue_' + category.toLocaleLowerCase() + '.png'
    } else {
      item.deviceImg = deviceImgApi.url + 'blue_default_type.png'
    }
  }
  if (deviceImgMap[category]) {
    const filterObj = deviceImgMap[category]
    item.deviceName = filterObj.title
  } else {
    item.deviceName = ''
  }
  return item
}
//获取明文sn
const getDeviceSn = (sn) => {
  const cipText = sn || ''
  const appKey = config.appKey[config.environment]
  const key = app.globalData.isLogon ? app.globalData.userData.key : ''
  console.log('sn解密前', cipText, key, appKey)
  const plainTextSn = cloudDecrypt(cipText, key, appKey)
  console.log('sn解密后', plainTextSn)
  return plainTextSn
}
//获取sn8
const getDeviceSn8 = (sn) => {
  if (!sn) return ''
  return sn.substring(9, 17)
}
export { getDeviceImgAndName, getDeviceSn, getDeviceSn8 }
