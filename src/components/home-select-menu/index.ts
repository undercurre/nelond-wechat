import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, homeStore } from '../../store/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    x: {
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
      observer: function (newVal: boolean) {
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
    reverseArrow: false,
  },

  computed: {
    sortedHomeList(data) {
      if (!data.projectList?.length) {
        return []
      }
      const list = (data.projectList as Project.IProjectItem[]).map((item) => ({
        ...item,
        projectName: item.projectName?.length > 6 ? item.projectName.slice(0, 6) + '...' : item.projectName,
        selected: item.projectId === homeStore.currentProjectId,
      }))

      return list
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleHomeTap(e: { currentTarget: { dataset: { value: string } } }) {
      const projectId = e.currentTarget.dataset.value

      homeStore.setProjectId(projectId)

      console.log('handleHomeTap', e)
      this.triggerEvent('select', { projectId })
      await homeStore.homeInit()
      this.triggerEvent('afterSelected', { projectId })
    },
    hideAnimate() {
      this.animate(
        '#menu',
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
        },
      )
    },
    showAnimate() {
      this.animate(
        '#menu',
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
    scrollToLower() {
      this.setData({
        reverseArrow: true,
      })
    },
    scrollToUpper() {
      this.setData({
        reverseArrow: false,
      })
    },
    black() {},
  },
})
