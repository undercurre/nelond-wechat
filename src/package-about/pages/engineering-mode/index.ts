import pageBehavior from '../../../behaviors/pageBehaviors'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { getEnv } from '../../../config/index'
import { mzaioDomain } from '../../../config/index'
import { logout, setCurrentEnv, storage, resetCurrentEnv, delay } from '../../../utils/index'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    isLanOn: getEnv() === 'Lan',
  },

  /**
   * 组件的方法列表
   */
  methods: {
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

      Toast('切换成功')

      logout(false) // 切换局域网模式，需要重新登录
      this.setData({
        isLanOn,
      })

      await delay(1000)

      if (isLanOn) {
        mzaioDomain.Lan = 'test.meizgd.com'
        storage.set('mzaioDomainLan', mzaioDomain.Lan)
        setCurrentEnv('Lan')
        wx.reLaunch({ url: '/pages/login/index' })
      } else {
        resetCurrentEnv() // 退出局域网模式，重置当前环境设置
      }
    },
  },
})
