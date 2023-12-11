// components/marvels-switch.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checkedIndex: {
      type: Number,
      value: 0,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    onSwitchChange(e: WechatMiniprogram.TouchEvent) {
      this.animate(
        '#slider',
        [
          {
            left: this.data.checkedIndex * 148 + 8 + 'rpx',
          },
          {
            left: e.currentTarget.dataset.index * 148 + 8 + 'rpx',
          },
        ],
        100,
        () => {
          //先设置原style，再清除动画样式避免样式造成闪烁问题
          this.setData({
            checkedIndex: parseInt(e.currentTarget.dataset.index),
          })
          this.triggerEvent('switchchange', { checkedIndex: this.data.checkedIndex })
          // this.triggerEvent('change', this.data.power)
          // this.clearAnimation('#slider', () => {})
        },
      )
    },
  },
})
