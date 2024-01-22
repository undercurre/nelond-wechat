import { ComponentWithComputed } from 'miniprogram-computed'
import { projectBinding, spaceStore, userBinding } from '../../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, userBinding] })],
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    right: {
      type: String,
      value: '0',
    },
    y: {
      type: String,
      value: '0',
    },
    isShow: {
      type: Boolean,
      value: false,
      observer(newVal: boolean) {
        if (newVal) {
          this.setData({
            isRender: true,
          })
          this.showAnimate()
        } else {
          this.hideAnimate()
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isRender: false,
  },

  computed: {
    menuList(data) {
      const list = []
      if (data.isManager) {
        list.push(
          {
            title: '添加设备',
            key: 'device',
            icon: 'add',
            url: '/package-distribution/choose-device/index',
          },
          {
            title: '创建场景',
            key: 'auto',
            icon: 'auto',
            url: '/package-automation/automation-add/index',
          },
        )
      }

      return list
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async addMenuTap(e: { currentTarget: { dataset: { url: string } } }) {
      const res = await wx.getNetworkType()
      if (res.networkType === 'none') {
        Toast('当前无法连接网络\n请检查网络设置')
        this.hideAnimate()
        return
      }
      if (!spaceStore.spaceList.length) {
        Toast('请先添加空间')
        this.hideAnimate()
        return
      }
      const url = e.currentTarget.dataset.url
      this.hideAnimate(() => wx.navigateTo({ url }))
    },
    hideAnimate(callback?: () => void) {
      this.animate(
        '#addMenu',
        [
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
        () => {
          this.setData({
            isRender: false,
          })
          if (callback) {
            callback()
          }
        },
      )
    },
    showAnimate() {
      this.animate(
        '#addMenu',
        [
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
      )
    },
    black() {},
  },
})
