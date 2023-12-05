import { storage } from '../../../utils/index'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    type: '',
    doc: '',
    title: '',
    url: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(e: { type: string; title: string }) {
      const doc = this.data[e.type]
      if (doc) {
        this.setData({
          title: e.title,
          doc,
          type: 'doc',
        })
      }
    },
    handleImgTap() {
      wx.previewMedia({
        sources: [
          {
            url: this.data.url,
            type: 'image',
          },
        ],
        showmenu: true,
      })
    },
  },
})
