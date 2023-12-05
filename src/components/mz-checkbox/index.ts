// components/mz-checkbox/index.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checked: {
      type: Boolean,
      value: false,
    },
    disabled: {
      type: Boolean,
      value: false,
    },
    iconSize: {
      type: String,
      value: '16px',
    },
    label: {
      type: String,
      value: '',
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
    onChange(event: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('change', event.detail)
    },
  },
})
