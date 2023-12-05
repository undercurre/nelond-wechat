Component({
  externalClasses: ['app-name'],
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
  },
  data: {
    // 这里是一些组件内部数据
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
  },
  methods: {
    clickCancel() {
      this.triggerEvent('clickCancel')
    },
  },
})
