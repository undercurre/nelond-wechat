import { BleClient } from '../../../utils/index'

export interface IBleDevice {
  deviceUuid: string
  mac: string
  zigbeeMac: string
  name: string
  spaceId: string
  spaceName: string
  icon: string
  client: BleClient
  status: 'waiting' | 'fail' | 'success' // 配网状态
  requestTimes: number // 查询云端在线次数
  zigbeeRepeatTimes: number // 配网自动重试次数
}
