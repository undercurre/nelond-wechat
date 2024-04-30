import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import deviceCategory, { IModel } from '../../common/deviceCategory'

ComponentWithComputed({
  options: {},
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {
    proType: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    name: '',
    modelList: [] as IModel[],
  },

  lifetimes: {
    ready() {
      const config = deviceCategory[this.data.proType]

      this.setData({
        name: config.name,
        modelList: config.modelList,
      })
    },
    detached() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
