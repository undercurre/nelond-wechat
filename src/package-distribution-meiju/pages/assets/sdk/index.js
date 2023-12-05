/**
 * 配网SDK功能入口，调用端可以通过引入当前索引，引用到具体的功能模块
 * 可以引用总的index,也可以按需引用各个模块
 */
import { commonIndex } from './common/commonIndex'
import { coreIndex } from './core/coreIndex'
import { ap_coreIndex } from './ap_core/ap_coreIndex'
import { accessPointIndex } from './accessPoint/accessPointIndex'
import { ble_coreIndex } from './ble_core/ble_coreIndex'
import { bluetoothIndex } from './bluetooth/bluetoothIndex'

const index = {
  commonIndex,
  coreIndex,
  ap_coreIndex,
  accessPointIndex,
  ble_coreIndex,
  bluetoothIndex,
}

module.exports = {
  index,
  commonIndex,
  coreIndex,
  ap_coreIndex,
  accessPointIndex,
  ble_coreIndex,
  bluetoothIndex,
}
