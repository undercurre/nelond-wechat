// import Toast from '@vant/weapp/toast/toast'

const colFir = []
const colSec = []

for (let i = 0; i <= 23; i++) {
  colFir.push(String(i).padStart(2, '0'))
}

for (let i = 0; i <= 59; i++) {
  colSec.push(String(i).padStart(2, '0'))
}

Component({
  options: {},

  /**
   * 组件的属性列表
   */
  properties: {
    colFir: {
      type: Array,
      value: colFir,
    },
    colSec: {
      type: Array,
      value: colSec,
    },
    colFirUnit: {
      type: String,
      value: '时',
    },
    colSecUnit: {
      type: String,
      value: '分',
    },
    value: {
      type: Array,
      value: [11, 0],
    },
  },
  /**
   * 用于监听 properties 和 data 的变化
   */
  observers: {},

  /**
   * 组件的初始数据
   */
  data: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  /**
   * 组件的方法列表
   */
  methods: {
    bindChange(e: { detail: { value: Array<number> } }) {
      this.triggerEvent('change', e.detail.value)
    },
  },
})
