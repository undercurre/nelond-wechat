import { getRect } from '../../utils/index'

Component({
  externalClasses: ['custom-class'],
  /**
   * 组件的属性列表
   */
  properties: {
    // disabled: Boolean,
    power: {
      type: Boolean,
      value: false,
    },
    vertical: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  observers: {},
  lifetimes: {
    attached() {},
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async handleOnOffChange(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.value === this.data.power) {
        return
      }
      const { width } = await getRect(this, '#slider')

      if (this.data.vertical) {
        this.animate(
          '#slider',
          [
            {
              top: e.currentTarget.dataset.value ? '96rpx' : '0',
            },
            {
              top: e.currentTarget.dataset.value ? '0' : '96rpx',
            },
          ],
          100,
          () => {
            //先设置原style，再清除动画样式避免样式造成闪烁问题
            this.setData({
              power: e.currentTarget.dataset.value,
            })
            this.triggerEvent('change', this.data.power)
            this.clearAnimation('#slider', () => {})
          },
        )
      } else {
        this.animate(
          '#slider',
          [
            {
              left: e.currentTarget.dataset.value ? width + 'px' : '0',
            },
            {
              left: e.currentTarget.dataset.value ? '0' : width + 'px',
            },
          ],
          100,
          () => {
            this.setData({
              power: e.currentTarget.dataset.value,
            })
            this.triggerEvent('change', this.data.power)
            this.clearAnimation('#slider', () => {})
          },
        )
      }
    },
  },
})
