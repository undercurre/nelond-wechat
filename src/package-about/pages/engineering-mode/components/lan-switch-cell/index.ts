import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { mzaioDomain, getEnv } from '../../../../../config/index'
import { logout, setCurrentEnv, storage, resetCurrentEnv, delay } from '../../../../../utils/index'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    ishowPopup: false,
    isLanOn: getEnv() === 'Lan',
    lanIP: '',
    port: '',
  },
  computed: {
    labelText(data) {
      return data.isLanOn ? `IP: ${data.lanIP}:${data.port}` : '局域网适用于私有化部署工程'
    },
  },

  pageLifetimes: {
    show() {
      this.setData({
        isLanOn: getEnv() === 'Lan',
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClosePopup() {
      this.setData({
        ishowPopup: false,
      })
    },
    // @ts-ignore
    async onChangeLanSwitch(event: WechatMiniprogram.CustomEvent<boolean>) {
      console.log('onChangeLanSwitch', event, event.detail.valueOf())

      const isLanOn = event.detail.valueOf()

      const dialogRes = await Dialog.confirm({
        title: `确定${isLanOn ? '打开' : '关闭'}局域网模式？`,
      }).catch(() => false)
      console.log('dialogRes', dialogRes)

      if (!dialogRes) {
        return
      }

      if (isLanOn) {
        this.setData({
          ishowPopup: true,
        })
      } else {
        Toast('切换成功')

        logout(false) // 切换局域网模式，需要重新登录
        this.setData({
          isLanOn: false,
        })
        resetCurrentEnv() // 退出局域网模式，重置当前环境设置
      }
    },

    async confirmOpenLan() {
      this.setData({
        ishowPopup: false,
        isLanOn: true,
      })

      Toast('切换成功')

      logout(false) // 切换局域网模式，需要重新登录

      mzaioDomain.Lan = 'test.meizgd.com'
      storage.set('mzaioDomainLan', mzaioDomain.Lan)
      setCurrentEnv('Lan')

      await delay(1000) // 强行延时，等toast提示完成
      wx.reLaunch({ url: '/pages/login/index' }) // 切换成功，跳转登录
    },
  },
})
