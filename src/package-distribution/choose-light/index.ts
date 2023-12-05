import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'
import { productImgDir } from '../../config/index'

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
        icon: `${productImgDir}/light-wifi.png`,
        name: '吸顶灯',
        tag: 'wifi',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '13',
          sn8: '7909AC81',
          productId: '美的智能吸顶灯',
          deviceImg: `${productImgDir}/light-wifi.png`,
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/downlight.png`,
        name: '筒射灯',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/magnetic-track-light.png`,
        name: '磁吸灯',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/tape-light.png`,
        name: 'CW灯带',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/switch.png`,
        name: '智能开关',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
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
