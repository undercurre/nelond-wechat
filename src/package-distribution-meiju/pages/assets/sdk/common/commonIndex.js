import { deviceGuide } from './deviceGuide'
import { selectDevice } from './selectDevice'
import { scanCodeService } from './scanCodeService'
import { wifiService } from './wifiService'
import { commonUtils } from './commonUtils'
import { linkDeviceService } from './linkDeviceService'
import { addSuccessService } from './addSuccessService'

const commonIndex = {
  deviceGuide,
  selectDevice,
  scanCodeService,
  wifiService,
  commonUtils,
  linkDeviceService,
  addSuccessService,
}

module.exports = {
  commonIndex,
}
