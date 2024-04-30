import { rpx2px } from '../utils/index'

// 设备列表，每次加载的条数 应该为4的倍数
export const LIST_PAGE = 20

// 依赖 WebSocket 更新设备数据的最大设备数
export const MAX_DEVICES_USING_WS = 160

// 最多可以移动和删除的设备数（按卡片计数）
export const MAX_MOVE_CARDS = 20

/**
 * @name 设备卡片更新时间阈值
 * @description 等待时间小于这个值的，均不即时更新，与后面的更新合并，或到到队列清空时一起更新
 */
export const CARD_REFRESH_TIME = 1000

// 卡片尺寸
export const CARD_W = rpx2px(180)
export const CARD_H = rpx2px(236)
export const ROOM_CARD_H = rpx2px(184) // 空间卡片高度

// 设备 modelName -> 品类码
export const PRO_TYPE = {
  light: '0x13',
  switch: '0x21',
  curtain: '0x14',
  gateway: '0x16',
  sensor: '0xBC',
  clothesDryingRack: '0x17',
  bathHeat: '0x26',
} as const

// productId -> 设备modelName，暂时为传感器专用
export const SENSOR_MODEL_NAME = {
  'midea.ir.201': 'irDetector',
  'midea.magnet.001.201': 'magnet',
  'midea.freepad.001.201': 'freepad',
  'midea.hlightsensor.001.001': 'lightsensor',
} as Record<string, string>

/**
 * @description 综合获取modelName的方法，proType & productId -> 设备modelName
 * !! 多路面板modelName为wallSwitch\d，直接从switchInfoDTOList获取
 * @param proType
 * @param productId
 */
export const getModelName = (proType: string, productId: string) => {
  if (proType === PRO_TYPE.sensor) {
    return SENSOR_MODEL_NAME[productId]
  }

  return proName[proType]
}

// 智慧屏pid:  四寸屏：pkey:t1ae5ff32ae84b60b159676556aafbf7 psecret: e953d99rb7ef4b55  pid : zk527b6c944a454e9fb15d3cc1f4d55b 十寸屏  pkey:j1ae3ez32ae84b60b159676556aafbf7 psecret: m95fd9grb7ef4b55  pid:ok523b6c941a454e9fb15d3cc1f4d55b
export const SCREEN_PID: readonly string[] = ['zk527b6c944a454e9fb15d3cc1f4d55b', 'ok523b6c941a454e9fb15d3cc1f4d55b']

// 旋钮开关pid
export const KNOB_PID: readonly string[] = ['midea.knob.001.003']

// 无色温调节pid
export const NO_COLOR_TEMP: readonly string[] = [
  'midea.hlight.005.001', // 工矿灯
  'midea.hlight.006.001', // 线条灯
]

// 设备品类码 -> modelName
export const proName: Record<string, string> = {
  '0x13': 'light',
  '0x14': 'curtain',
  '0x16': 'gateway',
  '0x17': 'clothesDryingRack',
  '0x21': 'switch',
  '0x26': 'bathHeat',
  '0xBC': 'sensor',
} as const

// 传感器类型，通过productId区分
export const SENSOR_TYPE = {
  humanSensor: 'midea.ir.201',
  doorsensor: 'midea.magnet.001.201',
  freepad: 'midea.freepad.001.201',
  lightsensor: 'midea.hlightsensor.001.001',
} as const
