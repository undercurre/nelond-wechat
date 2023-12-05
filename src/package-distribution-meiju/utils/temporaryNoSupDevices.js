import { brandConfig } from '../pages/assets/js/brand'

const addDevices = brandConfig.matchNetFilter

// eslint-disable-next-line no-unused-vars
const isAddDevice = (type, sn8, A0 = '') => {
  let isAddDevice = true
  if (Object.keys(addDevices).includes(type)) {
    if (!addDevices[type]['SN8'] || addDevices[type]['SN8'].length == 0) {
      isAddDevice = false
    } else {
      if (addDevices[type]['SN8'].includes(sn8)) {
        isAddDevice = false
      }
    }
    if (addDevices[type]['supSN8'] && addDevices[type]['supSN8'].includes(sn8)) {
      //配了支持的sn8
      isAddDevice = true
    }
    if (!sn8 && addDevices[type]['supSN8']) {
      //ap自发现无sn8 有配支持sn8则全开放品类
      isAddDevice = true
    }
  }
  return isAddDevice
}

module.exports = {
  isAddDevice,
}
