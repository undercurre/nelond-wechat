Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    conditionList: [
      {
        id: 0,
        icon: '/package-automation/assets/imgs/automation/and.png',
        title: '满足所有条件才执行操作',
        desc: '',
        key: 'all',
      },
      {
        id: 1,
        icon: '/package-automation/assets/imgs/automation/or.png',
        title: '满足任一条件才执行操作',
        desc: '',
        key: 'some',
      }
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },

    onConditionClicked(e: { currentTarget: { dataset: { key: string } } }) {
      console.log('conditionClicked', e)
      this.triggerEvent('conditionClicked', e.currentTarget.dataset.key)
    },
    blank() {},
  },
})
