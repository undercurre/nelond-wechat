import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { sensorList } from '../../config/index'

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
    deviceList: sensorList.map((sensor) => ({
      ...sensor,
      path: `/package-distribution/connect-guide/index?modelId=${sensor.productId}`,
    })),
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
