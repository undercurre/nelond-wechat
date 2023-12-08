import Toast from '@vant/weapp/toast/toast'
import { login, getCaptcha } from '../../apis/index'
import { homeStore, othersStore, userStore } from '../../store/index'
import { storage, showLoading, hideLoading, Logger } from '../../utils/index'
import { defaultImgDir } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'

// pages/login/index.ts
Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    marginTop: 0,
    defaultImgDir,
    needCaptcha: false, // 是否需要验证码登录
    captchaInput: '',
    _jsCode: '', // 暂存微信登录码
    _code: '', // 暂存微信获取手机的动态令牌
  },

  methods: {
    onLoad() {
      const navigationBarAndStatusBarHeight =
        (storage.get<number>('statusBarHeight') as number) + (storage.get<number>('navigationBarHeight') as number)
      this.setData({
        marginTop: 200 - navigationBarAndStatusBarHeight,
      })
    },

    handleLoginTap() {
      if (!this.data.isAgree) {
        Toast('请同意协议')
        return
      }
    },

    handleLoginClick(e: { detail: { code: string } }) {
      if (!e.detail.code) {
        Toast('取消登录')
        return
      }

      this.data._code = e.detail.code

      showLoading()

      wx.login({
        success: async (res) => {
          console.log('login', res, e)
          if (res.code) {
            this.data._jsCode = res.code
            const params = {
              code: this.data._code,
              jsCode: this.data._jsCode,
            }
            await this.login(params)

            hideLoading()
          } else {
            Toast('登录失败！')
            console.log('登录失败！' + res.errMsg)
            hideLoading()
          }
        },
        fail(err) {
          Logger.error('wx.login-error', err)
          hideLoading()
        },
      })
    },

    async handleLoginWithCaptcha() {
      if (!this.data._jsCode || !this.data._code) {
        Toast('登录失败！')
        return
      }

      showLoading()

      const params = {
        captcha: this.data.captchaInput,
        jsCode: this.data._jsCode,
      }
      await this.login(params)

      hideLoading()
    },

    captchaChange(e: { detail: string }) {
      this.setData({
        captchaInput: e.detail,
      })
    },

    /**
     * @param data.code 微信登录动态令牌
     * @param data.jsCode 获取手机的动态令牌
     */
    async login(data: { jsCode: string; code?: string }) {
      const loginRes = await login(data)
      if (loginRes.success && loginRes.code === 8843) {
        getCaptcha({ mobilePhone: loginRes.result?.mobilePhone })
        this.setData({
          needCaptcha: true,
        })
      } else if (loginRes.success && loginRes.result) {
        console.log('loginRes', loginRes)
        storage.set('token', loginRes.result.token, null)

        await userStore.updateUserInfo()
        userStore.setIsLogin(true)
        othersStore.setIsInit(false)
        homeStore.homeInit()
        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        Toast('登录失败！')
      }
    },

    onAgreeClick(event: { detail: boolean }) {
      console.log('onAgreeClick', event)

      this.setData({
        isAgree: event.detail,
      })
    },

    toPage(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-protocol/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },
  },
})
