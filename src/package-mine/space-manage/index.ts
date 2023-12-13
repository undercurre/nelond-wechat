import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { projectBinding, spaceBinding } from '../../store/index'
import { strUtil } from '../../utils/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isAddRoom: false,
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    editRoom(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = spaceBinding.store.spaceList[index]

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/space-detail/index', {
          spaceId: item.spaceId,
          spaceName: item.spaceName,
          // roomIcon: item.roomIcon,
        }),
      })
    },

    addRoom() {
      if (spaceBinding.store.spaceList.length >= 50) {
        Toast('一个项目中最多创建50个空间')
        return
      }

      this.setData({
        isAddRoom: true,
      })
    },

    hideAddRoom() {
      this.setData({
        isAddRoom: false,
      })
    },
  },
})
