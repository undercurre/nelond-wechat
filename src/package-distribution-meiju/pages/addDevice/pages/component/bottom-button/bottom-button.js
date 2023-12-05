// author:lisin date:2021/10/19
Component({
  externalClasses: ['bottom-button2', 'confirm', 'cancle'],
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    // title: {
    //   type: String,
    //   value: ''
    // },
    buttomButonData: {
      type: Object,
      value: {},
    },
    brand: {
      type: String,
      value: '',
    },
  },
  options: {
    addGlobalClass: true,
  },
  data: {
    // 这里是一些组件内部数据
    isClickConfirm: false,
  },
  methods: {
    //自定义事件
    clickCancel(e) {
      //取消
      console.log('kkkkkk', e.target.dataset.tap, this.properties.buttomButonData)
      this.triggerEvent('clickActiveCancel', '')
      this.properties.buttomButonData.success({
        cancel: true, //cancel
      })
    },
    clickConfirm(e) {
      if (!this.properties.buttomButonData.isClickConfirm) {
        //确定
        this.properties.buttomButonData.success({
          confirm: true,
        })
      }
      setTimeout(() => {
        this.properties.buttomButonData.success({
          confirm: false,
        })
      }, 2000)
    },
  },
  /*组件生命周期*/
  lifetimes: {
    created() {},
    attached() {
      console.log('在组件实例进入页面节点树时执行')
      // this.setData({
      //     desc: desc
      // })
    },
    ready() {
      console.log('在组件在视图层布局完成后执行')
    },
    moved() {
      console.log('在组件实例被移动到节点树另一个位置时执行')
    },
    detached() {
      console.log('在组件实例被从页面节点树移除时执行')
    },
    error() {
      console.log('每当组件方法抛出错误时执行')
    },
    /*组件所在页面的生命周期 */
    pageLifetimes: {
      show: function () {
        // 页面被展示
        console.log('页面被展示')
      },
      hide: function () {
        // 页面被隐藏
        console.log('页面被隐藏')
      },
      resize: function (size) {
        // 页面尺寸变化
        console.log('页面尺寸变化')
      },
    },
  },
})
