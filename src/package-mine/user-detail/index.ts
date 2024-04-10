import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { userBinding, userStore } from '../../store/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    showEditNamePopup: false,
  },

  computed: {},

  lifetimes: {
    ready() {},
    detached() {},
  },

  methods: {
    handleNameEditPopup() {
      this.setData({ showEditNamePopup: true })
    },
    handleNameEditCancel() {
      this.setData({ showEditNamePopup: false })
    },
    handleNameEditConfirm(e: { detail: string }) {
      userStore.editUserName(e.detail)
      this.setData({ showEditNamePopup: false })
    },
  },
})
