import { ComponentWithComputed } from 'miniprogram-computed'
import { getEnv, mzaioDomain } from '../../../config/index'

ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    webviewSrc: '',
  },

  methods: {
    onLoad(e: { url: string }) {
      const domain = mzaioDomain[getEnv()]

      this.setData({
        webviewSrc: `${domain}${e.url}`,
      })
    },
  },
})
