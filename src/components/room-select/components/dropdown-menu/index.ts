Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    x: {
      type: String,
      value: '0',
    },
    y: {
      type: String,
      value: '0',
    },
    isShow: {
      type: Boolean,
      value: false,
      observer: function (newVal: boolean) {
        console.log(this.data)
        if (newVal) {
          this.setData({
            isRender: true,
          })
          this.showAnimate()
        } else {
          this.hideAnimate()
        }
      },
    },
    list: {
      type: Array,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isRender: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleRoomSelect(e: { currentTarget: { dataset: { id: string } } }) {
      this.triggerEvent('select', e.currentTarget.dataset.id)
    },
    hideAnimate() {
      this.animate(
        '#menu',
        [
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '240rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '240rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
        () => {
          this.setData({
            isRender: false,
          })
        },
      )
    },
    showAnimate() {
      this.animate(
        '#menu',
        [
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '240rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '240rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
      )
    },
  },
})
