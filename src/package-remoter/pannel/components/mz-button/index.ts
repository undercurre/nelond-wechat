import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  properties: {
    img: {
      type: String,
      value: '',
    },
    imgActive: {
      type: String,
      value: '',
    },
    icon: {
      type: String,
      value: '',
    },
    iconActive: {
      type: String,
      value: '',
    },
    imgWidth: {
      type: String,
      value: '304rpx',
    },
    imgHeight: {
      type: String,
      value: '112rpx',
    },
    type: {
      type: String,
      value: 'custom',
    },
    hasFeedback: {
      type: Boolean,
      value: true,
    },
    text: {
      type: String,
      value: '',
    },
    /**
     * 文字宽度
     * 仅当横向排版时生效
     */
    textWidth: {
      type: String,
      value: '',
    },
    textColor: {
      type: String,
      value: '#555659',
    },
    textSize: {
      type: String,
      value: '32rpx',
    },
    /**
     * 文字及图标排版方向
     * row: 横向
     * col: 竖向
     */
    dir: {
      type: String,
      value: 'row',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {
    btnStyle(data) {
      return `
        width: ${data.imgWidth};
        height: ${data.imgHeight};
      `
    },
    textStyle(data) {
      const _match = String.prototype.match.call(data.textSize, /^\d+/)
      const _textWidth = data.textWidth || (_match ? Number(_match![0]) * data.text.length + 'rpx' : '32rpx')
      const widthStyle = data.dir === 'row' ? 'margin-left: 32rpx;' : ''
      return `${widthStyle}
        width: ${_textWidth};
        color: ${data.textColor};
        font-size: ${data.textSize};
      `
    },
  },

  methods: {
    handleTouchStart() {
      if (wx.vibrateShort && this.data.hasFeedback) wx.vibrateShort({ type: 'heavy' })

      // 预留逻辑，暂时未被调用
      // const innerAudioContext = wx.createInnerAudioContext()
      // innerAudioContext.autoplay = true
      // innerAudioContext.src =
      //   '/package-remoter/assets/tick.wav'
      // innerAudioContext.onPlay(() => {
      //   console.log('开始播放')
      // })
      // innerAudioContext.onError((res) => {
      //   console.log(res.errMsg)
      //   console.log(res.errCode)
      // })
    },
  },
})
