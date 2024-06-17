import { ComponentWithComputed } from 'miniprogram-computed'
import { sceneImgDir } from '../../../../config/index'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  computed: {
    linkDesc(data) {
      if (data.item?.data?.linkName) {
        return '已关联：' + data.item.data.linkName
      }
      return '暂未关联开关'
    },
    sceneName(data) {
      if (data.item?.data?.sceneName?.length > 10) {
        return data.item.data.sceneName.slice(0, 11) + '...'
      } else {
        return data.item.data.sceneName
      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    tapAnimate: false,
    sceneImgDir: sceneImgDir(),
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleExecScene(e: WechatMiniprogram.TouchEvent) {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        tapAnimate: true,
      })
      setTimeout(() => {
        this.setData({
          tapAnimate: false,
        })
      }, 700)
      this.triggerEvent('exec', e.currentTarget.dataset.item)
    },
    handleToSetting(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('toSetting', e.currentTarget.dataset.item)
    },
  },
})
