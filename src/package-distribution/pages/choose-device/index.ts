import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import cacheData from '../../common/cacheData'
import { productImgDir, CURTAIN_PID } from '../../../config/index'
// import { strUtil } from '../../../utils/index'

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
        icon: `${productImgDir()}/0x16.png`,
        name: '智能网关',
        path: '/package-distribution/pages/choose-model/index?proType=0x16',
      },
      {
        icon: `${productImgDir()}/subdevice.png`,
        name: '开关/灯具',
        path: '/package-distribution/pages/choose-model/index?proType=0x13',
      },
      {
        icon: `${productImgDir()}/sensor.png`,
        name: '传感器',
        path: '/package-distribution/pages/choose-model/index?proType=0xBC',
      },
      {
        icon: `${productImgDir()}/0x14.png`,
        name: '窗帘',
        path: `/package-distribution/pages/connect-guide/index?proType=0x14&modelId=${CURTAIN_PID.join(',')}`,
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
