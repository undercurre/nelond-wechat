// custom-tab-bar/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../behaviors/pageBehaviors'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { projectBinding, projectStore, userBinding } from '../store/index'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, userBinding] }), pageBehavior],

  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    color: '#a2a2a2',
    selectedColor: '#1E2C46',
    list: [
      {
        text: '首页',
        selectedIcon: '/assets/img/tabbar/home-selected.png',
        unSelectedIcon: '/assets/img/tabbar/home-unselected.png',
        path: '/pages/index/index',
      },
      {
        text: '智能场景',
        selectedIcon: '/assets/img/tabbar/automation-selected.png',
        unSelectedIcon: '/assets/img/tabbar/automation-unselected.png',
        path: '/pages/automation/index',
      },
      {
        text: '我的',
        selectedIcon: '/assets/img/tabbar/mine-selected.png',
        unSelectedIcon: '/assets/img/tabbar/mine-unselected.png',
        path: '/pages/mine/index',
      },
    ],
  },
  // computed: {
  //   menuList(data: IAnyObject) {
  //     const list = data.list
  //     if (!data.isLogin || !data.isManager) {
  //       return list.filter((item: IAnyObject) => item.text !== '智能场景')
  //     }
  //     return list
  //   },
  // },

  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(data: { currentTarget: { dataset: { index: number; path: string } } }) {
      if (data.currentTarget.dataset.index === 1 && !projectStore.projectList.length) {
        Toast('请先在管理端添加或关联项目')
        return
      }
      wx.switchTab({
        url: data.currentTarget.dataset.path,
      })
    },
  },
})
