import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { productImgDir } from '../../../config/index'

ComponentWithComputed({
  options: {},
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    deviceList: [
      {
        icon: `${productImgDir}/downlight.png`,
        name: '筒射灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/mining-lamp.png`,
        name: '工矿灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/magnetic-track-light.png`,
        name: '磁吸灯',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/tape-light.png`,
        name: 'CW灯带',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/switch.png`,
        name: '智能开关',
        tag: 'zigbee',
        path: '/package-distribution/pages/scan/index?scanType=subdevice',
      },
    ],
  },

  lifetimes: {
    ready() {},
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
