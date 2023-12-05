Component({
  options: {},

  /**
   * 组件的属性列表
   */
  properties: {
    radio: {
      type: String,
      value: '1',
    },
    week: {
      type: String,
      observer(value) {
        this.data.weekList.forEach((item) => {
          if (value.indexOf(item.key) !== -1) {
            this.setData({
              [`weekList[${Number(item.key) - 1}].checked`]: true,
            })
          } else {
            this.setData({
              [`weekList[${Number(item.key) - 1}].checked`]: false,
            })
          }
        })
      },
    },
  },
  /**
   * 用于监听 properties 和 data 的变化
   */
  observers: {},

  /**
   * 组件的初始数据
   */
  data: {
    periodList: [
      { radio: '0', title: '仅一次' },
      { radio: '1', title: '每天' },
      { radio: '2', title: '法定工作日' },
      { radio: '3', title: '法定节假日' },
      { radio: '4', title: '自定义' },
    ],
    weekList: [
      { title: '日', key: '1', checked: false },
      { title: '一', key: '2', checked: false },
      { title: '二', key: '3', checked: false },
      { title: '三', key: '4', checked: false },
      { title: '四', key: '5', checked: false },
      { title: '五', key: '6', checked: false },
      { title: '六', key: '7', checked: false },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClick(event: { currentTarget: { dataset: { radio: string } } }) {
      const { radio } = event.currentTarget.dataset
      this.setData({
        radio,
      })
      if (radio === '1') {
        this.triggerEvent('weekChange', '1,2,3,4,5,6,7')
      }
      this.triggerEvent('periodChange', radio)
    },

    weekSelect(event: { currentTarget: { dataset: { index: number } } }) {
      const { index } = event.currentTarget.dataset
      this.setData({
        [`weekList[${index}].checked`]: !this.data.weekList[index].checked,
      })
      const weekList: string[] = []
      this.data.weekList.forEach((item) => {
        if (item.checked) {
          weekList.push(item.key)
        }
      })
      this.triggerEvent('weekChange', weekList.join(','))
    },
  },
})
