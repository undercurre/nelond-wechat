import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'
import cacheData from '../common/cacheData'
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
        icon: `${productImgDir}/gateway.png`,
        name: '智能网关',
        path: '/package-distribution/scan/index?scanType=gateway',
      },
      {
        icon: `${productImgDir}/subdevice.png`,
        name: '开关/灯具',
        path: '/package-distribution/choose-light/index',
      },
      {
        icon: `${productImgDir}/screen.png`,
        name: '智慧屏',
        path: '/package-distribution/scan/index?scanType=screen',
      },
      {
        icon: `${productImgDir}/sensor.png`,
        name: '传感器',
        path: '/package-distribution/choose-sensor/index',
      },
      {
        icon: `${productImgDir}/curtain.png`,
        name: '窗帘',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '14',
          sn8: '79700Z76',
          productId: 'SC-1/M2-Z',
          deviceImg: `${productImgDir}/curtain.png`,
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/bath-heater.png`,
        name: '浴霸',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '26',
          sn8: 'M0100032',
          productId: 'MY-S5X28-Y5W',
          deviceImg: `${productImgDir}/bath-heater.png`,
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/laundry.png`,
        name: '晾衣机',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '17',
          sn8: 'M0100035',
          productId: 'MLY-D60W',
          deviceImg: `${productImgDir}/laundry.png`,
          mode: 0,
        } as Meiju.IProductItem),
      },
    ],
  },

  lifetimes: {
    ready() {
      const routes = getCurrentPages()

      // 保存进入配网流程的页面入口
      cacheData.pageEntry = '/' + (routes.length > 2 ? routes[routes.length - 2].route : 'pages/index/index')
    },
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
