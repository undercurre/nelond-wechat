import Toast from '@vant/weapp/toast/toast'
import { login, getCaptcha } from '../../apis/index'
import { projectStore, othersStore, userStore } from '../../store/index'
import { storage, showLoading, hideLoading, Logger } from '../../utils/index'
import { defaultImgDir, UNACTIVATED, CAPTCHA_VALID_TIME } from '../../config/index'
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
    validTime: CAPTCHA_VALID_TIME, // 验证码60秒过期
    _mobilePhone: '',
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
            await this.toLogin({
              code: this.data._code,
              jsCode: this.data._jsCode,
            })

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

      await this.toLogin({
        captcha: this.data.captchaInput,
      })

      hideLoading()
    },

    captchaChange(e: { detail: string }) {
      this.setData({
        captchaInput: e.detail,
      })
    },

    reduceValidTime() {
      setTimeout(() => {
        this.setData({
          validTime: this.data.validTime - 1,
        })
        if (this.data.validTime > 0) {
          this.reduceValidTime()
        }
      }, 1000)
    },

    /**
     * 登录逻辑
     */
    async toLogin(data: { jsCode?: string; code?: string; captcha?: string }) {
      const res = await login(data)
      // 如果返回未激活状态，则自动调用获取验证码的接口
      if (res.success && res.code === UNACTIVATED) {
        this.setData({
          needCaptcha: true,
        })
        this.data._mobilePhone = res.result?.mobilePhone
        this.queryCaptcha()
      }
      // 登录成功
      else if (res.success && res.result) {
        console.log('login res', res)

        storage.set('token', res.result.token, null)
        storage.set('roleList', res.result.roleList, null)
        storage.set('userName', res.result.userName, null)
        storage.set('mobilePhone', res.result.mobilePhone, null)

        userStore.setUserInfo(res.result)

        if (!res.result.roleList?.length) {
          Toast('无项目权限，请联系管理员')
          return
        }
        othersStore.setIsInit(false)
        projectStore.spaceInit()
        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        Toast('登录失败！')
      }
    },

    queryCaptcha() {
      getCaptcha({ mobilePhone: this.data._mobilePhone })
      this.setData({
        validTime: CAPTCHA_VALID_TIME,
      })
      this.reduceValidTime()
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
