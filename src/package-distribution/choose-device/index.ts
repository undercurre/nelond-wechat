import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
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
        name: '边缘服务器',
        path: '/package-distribution/scan/index?scanType=screen',
      },
      {
        icon: `${productImgDir}/sensor.png`,
        name: '传感器',
        path: '/package-distribution/choose-sensor/index',
      },
    ],
  },

  lifetimes: {
    ready() {
      const routes = getCurrentPages()

      // 保存进入配网流程的页面入口
      cacheData.pageEntry = '/' + (routes.length > 1 ? routes[routes.length - 2].route : 'pages/index/index')
    },
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
