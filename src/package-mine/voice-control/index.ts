// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { projectBinding, userBinding } from '../../store/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {
      duerIntro: '/package-mine/guideline/index?type=duerVoice',
      miIntro: '/package-mine/guideline/index?type=miVoice',
    },
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {},
})
