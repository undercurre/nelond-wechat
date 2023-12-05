Component({
  externalClasses: ['back', 'header'],
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    backText: {
      type: String,
      value: '',
    },
    backTo: {
      type: String,
      value: '',
    },
    buttonColor: {
      type: String,
      value: 'black',
    },
  },
  data: {
    // 这里是一些组件内部数据
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    menuHeight: 40,
  },
  methods: {
    clickBack() {
      this.triggerEvent('clickBack')
    },
  },
})
