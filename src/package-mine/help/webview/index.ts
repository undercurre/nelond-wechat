import { ComponentWithComputed } from 'miniprogram-computed'
import { getEnv } from '../../../config/index'

ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    webviewSrc: '',
    domainMap: {
      dev: 'https://test.meizgd.com',
      sit: 'https://mzaio.meizgd.com',
      prod: 'https://mzaio.meizgd.com',
    },
  },

  methods: {
    onLoad(e: { url: string }) {
      const domain = this.data.domainMap[getEnv()]

      this.setData({
        webviewSrc: `${domain}${e.url}`,
      })
    },
  },
})
