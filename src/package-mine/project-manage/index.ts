import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceStore, projectBinding, projectStore, spaceStore } from '../../store/index'
import { emitter } from '../../utils/index'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
  },

  computed: {},

  lifetimes: {
    ready: async function () {
      console.log('project manage ==== ready')
      projectStore.updateProjectInfo()
      projectBinding.store.updateHomeMemberList()

      emitter.on('projectInfoEdit', () => {
        projectStore.updateProjectInfo()
        projectBinding.store.updateHomeMemberList()
      })

      emitter.on('invite_user_house', () => {
        projectStore.updateProjectInfo()
      })
    },
    detached: function () {
      emitter.off('projectInfoEdit')
      emitter.off('invite_user_house')
    },
  },

  methods: {
    /**
     * 用户点击展示/隐藏项目选择
     */
    async handleShowHomeSelectMenu() {
      const query = wx.createSelectorQuery()
      query.select('#homeName').boundingClientRect((res) => {
        this.setData({
          selectHomeMenu: {
            x: `${res.left + 10}px`,
            y: `${res.bottom + 10}px`,
            isShow: !this.data.selectHomeMenu.isShow,
          },
          'dropdownMenu.isShow': false,
        })
      })
      query.exec()
    },

    hideMenu() {
      this.setData({
        'selectHomeMenu.isShow': false,
      })
    },

    toPage(e: { currentTarget: { dataset: { url: string; auth: string; param: string } } }) {
      console.log('e.currentTarget.dataset', e.currentTarget)
      const { url } = e.currentTarget.dataset

      // 拦截未有空间的情况
      if (!spaceStore.spaceList?.length || !deviceStore.deviceList?.length) {
        Toast('请先添加空间和设备')
        return
      }

      // 如果用户已经登录
      wx.navigateTo({ url })
    },
  },
})
