import { guideDir, productImgDir } from '../../config/index'

export default {
  '0x13': {
    name: '开关/灯具',
    modelList: [
      {
        icon: `${productImgDir()}/downlight.png`,
        name: '筒射灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir()}/mining-lamp.png`,
        name: '工矿灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir()}/magnetic-track-light.png`,
        name: '磁吸灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir()}/tape-light.png`,
        name: 'CW灯带',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir()}/light-line.png`,
        name: '线条灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir()}/switch.png`,
        name: '智能开关',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
    ],
  },
  '0xBC': {
    name: '传感器',
    modelList: [
      {
        icon: `${productImgDir()}/sensor-body.png`,
        guideImg: `${guideDir()}/sensor_body.gif`,
        name: '人体传感器',
        guideDesc: '1、确认传感器电池已安装好\n2、长按球体顶部「配网按键」5秒以上，至指示灯开始闪烁（1秒/次）',
        path: `/package-distribution/pages/connect-guide/index?proType=0xBC&modelId=midea.ir.201`,
        productId: 'midea.ir.201',
      },
      {
        icon: `${productImgDir()}/sensor-door.png`,
        guideImg: `${guideDir()}/sensor_door.gif`,
        name: '门磁传感器',
        guideDesc: '1、确认传感器电池已安装好\n2、长按顶部「配网按键」5秒以上，至指示灯开始闪烁（1秒/次）',
        path: `/package-distribution/pages/connect-guide/index?proType=0xBC&modelId=midea.magnet.001.201`,
        productId: 'midea.magnet.001.201',
      },
      {
        icon: `${productImgDir()}/sensor-switch.png`,
        guideImg: `${guideDir()}/homlux/sensor_switch.gif`,
        name: '无线开关',
        guideDesc: '1、确认传感器电池已安装好\n2、点击「开关键」，随后立刻长按5秒以上，至指示灯开始闪烁（1秒/次）',
        path: `/package-distribution/pages/connect-guide/index?proType=0xBC&modelId=midea.freepad.001.201`,
        productId: 'midea.freepad.001.201',
      },
      {
        icon: `${productImgDir()}/sensor-lumen.png`,
        name: '照度传感器',
        // tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
    ],
  },
} as ICategoryConfig

export interface IModel {
  icon: string // 产品图标
  name: string // 产品名称
  productId?: string // 产品型号标识modelId，暂时只有网关子设备使用
  guideImg?: string // 配网指引图
  guideDesc?: string // 配网指引
  tag?: 'wifi' | 'zigbee' // 产品标签。 wifi：wifi配网  zigbee：zigbee配网
  path: string // 跳转页面路径
}

interface ICategoryConfig {
  [x: string]: {
    name: string // 类别名称
    modelList: IModel[] // 型号列表
  }
}
