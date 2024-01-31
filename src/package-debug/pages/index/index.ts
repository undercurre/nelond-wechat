import pageBehavior from '../../../behaviors/pageBehaviors'
import { storage, setCurrentEnv, logout } from '../../../utils/index'

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
    envVersion: 'release', // 当前小程序版本，体验版or 正式环境
    curEnv: 'prod', // 当前选择的云端环境
    version: '', // 生产环境版本号
  },

  lifetimes: {
    ready() {
      const info = wx.getAccountInfoSync()

      this.setData({
        envVersion: info.miniProgram.envVersion,
        curEnv: storage.get(`${info.miniProgram.envVersion}_env`) as string,
        version: info.miniProgram.version,
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 切换云端环境，开发用
     */
    toggleEnv() {
      const envList = ['dev', 'sit', 'prod']
      wx.showActionSheet({
        itemList: envList,
        success: (res) => {
          console.log('showActionSheet', res)
          const env = envList[res.tapIndex] as 'dev' | 'sit' | 'prod'

          if (this.data.curEnv === env) {
            return
          }
          setCurrentEnv(env)

          logout()
        },
        fail(res) {
          console.log(res.errMsg)
        },
      })
    },
  },
})