// author:lisin date:2021/10/19
Component({
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    // title: {
    //   type: String,
    //   value: ''
    // },
    customDialog: {
      type: Object,
      value: {
        show: true,
        title: '默认标题',
        content: '默认内容',
        cancelText: '取消',
        cancelColor: '#000000',
        confirmColor: '#488FFF',
        confirmText: '确认',
        success(res) {
          console.log('点击了', res)
          // if (res.type == 'cancel') {

          // }
        },
        fail() {},
      },
    },
    closeImg: {
      type: String,
      value: '',
    },
  },
  options: {
    addGlobalClass: true,
    psw: '',
  },
  data: {
    // 这里是一些组件内部数据
  },
  methods: {
    //自定义事件
    clickCancel(e) {
      //取消
      console.log('kkkkkk', e.target.dataset.tap, this.properties.customDialog)
      this.triggerEvent('clickActiveCancel', '')
      this.properties.customDialog.success({
        cancel: true, //cancel
      })
      this.setData({
        //关闭
        ['customDialog.show']: false,
      })
    },
    clickConfirm() {
      //重试
      this.properties.customDialog.success({
        comfirm: true,
        confirm: true,
        psw: this.data.psw,
      })
      this.setData({
        //关闭
        ['customDialog.show']: false,
      })
    },
    clickClose() {
      this.properties.customDialog.success({
        cancel: true, //cancel
      })
      this.setData({
        //关闭
        ['customDialog.show']: false,
      })
    },
    getPsw(e) {
      let psw = e.detail.value
      console.log(psw)
      this.setData({
        psw: psw,
      })
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
