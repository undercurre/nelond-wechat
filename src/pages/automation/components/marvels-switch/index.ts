// components/marvels-switch.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checkedIndex: {
      type: Number,
      value: 0,
      observer(newVal) {
        this.setData({
          left: newVal * 148 + 8,
        })
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    left: 8,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onSwitchChange(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        checkedIndex: parseInt(e.currentTarget.dataset.index),
      })
      this.triggerEvent('switchchange', { checkedIndex: this.data.checkedIndex })
    },
  },
})
