Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    actionList: [
      {
        id: 0,
        icon: '/package-automation/assets/imgs/automation/device.png',
        title: '设备',
        desc: '执行空间内的设备动作',
        key: 'device',
      },
      // {
      //   id: 1,
      //   icon: '/package-automation/assets/imgs/automation/scene.png',
      //   title: '场景',
      //   desc: '执行空间内的场景',
      //   key: 'scene',
      // },
      // {
      //   id: 3,
      //   icon: '/package-automation/assets/imgs/automation/stopwatch.png',
      //   title: '延时',
      //   desc: '延迟一段时间',
      //   key: 'delay',
      // },
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
      console.log('actionClicked', e)
      this.triggerEvent('actionClicked', e.currentTarget.dataset.key)
    },
    blank() {},
  },
})
