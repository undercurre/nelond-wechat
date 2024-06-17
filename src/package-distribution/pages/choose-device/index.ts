import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import cacheData from '../../common/cacheData'
import { productImgDir, CURTAIN_PID, guideDir } from '../../../config/index'
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
        icon: `${productImgDir}/gateway.png`,
        name: '智能网关',
        path: '/package-distribution/pages/scan/index?scanType=gateway',
      },
      {
        icon: `${productImgDir}/subdevice.png`,
        name: '开关/灯具',
        path: '/package-distribution/pages/choose-model/index?proType=0x13',
      },
      // {
      //   icon: `${productImgDir}/screen.png`,
      //   name: '边缘服务器',
      //   path: '/package-distribution/pages/scan/index?scanType=screen',
      // },
      {
        icon: `${productImgDir}/sensor.png`,
        name: '传感器',
        path: '/package-distribution/pages/choose-model/index?proType=0xBC',
      },
      {
        guideImg: `${guideDir}/homlux/guide/485.gif`,
        guideDesc:
          '1、中弘网关BUS接口的A\\B口分别与智慧屏的485 接口A\\B口对接。\n2、接通电源并等待中弘网关工作指示灯变为绿色慢闪状态。',
        productId: CURTAIN_PID.join(','),
        icon: `${productImgDir}/0x14.png`,
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
