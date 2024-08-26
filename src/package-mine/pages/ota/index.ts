import pageBehavior from '../../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    cellList: [
      {
        title: '子设备升级',
        otaType: 2,
      },
      {
        title: 'D3网关升级',
        otaType: 1,
      },
      {
        title: '边缘网关升级',
        otaType: 7,
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toDetail(event: WechatMiniprogram.CustomEvent) {
      console.log('toDetail', event)
      const { title, otaType } = event.currentTarget.dataset

      wx.navigateTo({
        url: `/package-mine/pages/ota-detail/index?title=${title}&otaType=${otaType}`,
      })
    },
  },
})
