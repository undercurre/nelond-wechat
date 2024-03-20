import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { projectBinding } from '../../store/project'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {},

  computed: {},

  lifetimes: {
    ready() {},
    detached() {},
  },

  methods: {},
})
