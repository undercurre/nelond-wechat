// components/marvels-switch.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checked: {
      type: Boolean,
      value: false,
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
    onSwitchChange: function (e: { detail: { value: boolean } }) {
      this.setData({
        checked: !this.properties.checked,
      })
      const checked = e.detail.value
      this.triggerEvent('switchchange', { checked })
    },
  },
})
