import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
import { RegMobile } from '@midea/reg-awsome'
import { login, getCaptcha, loginByMz } from '../../apis/index'
import { projectStore, othersStore, userStore } from '../../store/index'
import { storage, showLoading, hideLoading, Logger } from '../../utils/index'
import { defaultImgDir, UNACTIVATED, CAPTCHA_VALID_TIME, isLan, isNative, PROJECT_TYPE } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isLan: false,
    isAgree: false,
    marginTop: 0,
    defaultImgDir: defaultImgDir(),
    needCaptcha: false, // 是否需要验证码登录
    captchaInput: '',
    validTime: -1, // 验证码60秒过期， -1代表还没发送过短信
    isShowPw: false,
    mobilePhone: '',
    pw: '',
    _jsCode: '', // 暂存微信登录码
    _code: '', // 暂存微信获取手机的动态令牌
  },

  computed: {
    // 获取验证码按钮文案
    smsBtnText(data) {
      return data.validTime > 0 ? `${data.validTime}s` : '获取验证码'
    },
    // 是否使用手动登录
    isManualLogin(data) {
      return data.isLan || isNative()
    },
  },

  pageLifetimes: {
    show() {
      this.setData({
        isLan: isLan(),
      })
    },
  },

  methods: {
    onLoad() {
      const navigationBarAndStatusBarHeight =
        (storage.get<number>('statusBarHeight') as number) + (storage.get<number>('navigationBarHeight') as number)
      this.setData({
        marginTop: 200 - navigationBarAndStatusBarHeight,
      })
    },

    togglePw() {
      this.setData({
        isShowPw: !this.data.isShowPw,
      })
    },

    async handleLoginTap() {
      console.debug('handleLoginTap')
      if (!this.data.isAgree) {
        Toast('请同意协议')
        return
      }
    },

    handleLoginClick(e: { detail: { code: string } }) {
      console.debug('handleLoginClick', e)
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
      try {
        if (this.data.isManualLogin) {
          if (!RegMobile.reg.test(this.data.mobilePhone)) {
            throw '请输入正确的手机号码'
          }
        }

        if (isNative()) {
          // IOS，获取 wifi 信息必须要用户授权 location 权限。暂时通过getLocation接口触发获取位置权限逻辑
          const locationRes = await wx
            .getLocation({
              type: 'wgs84',
            })
            .catch((err) => err)

          Logger.log('locationRes', locationRes)
        }

        const res = this.data.isManualLogin
          ? await loginByMz({ mobilePhone: this.data.mobilePhone, password: this.data.pw })
          : await login(data)
        // 如果返回未激活状态，则自动调用获取验证码的接口
        if (res.success && res.code === UNACTIVATED) {
          this.setData({
            needCaptcha: true,
          })
          this.data.mobilePhone = res.result?.mobilePhone || ''
          this.queryCaptcha()
        }
        // 登录成功
        else if (res.success && res.result) {
          console.log('login res', res)

          storage.set('token', res.result.token, null)
          storage.set(
            'roleList',
            res.result.roleList.filter((r) => r.projectType === PROJECT_TYPE),
            null,
          )
          storage.set('userName', res.result.userName, null)
          storage.set('mobilePhone', res.result.mobilePhone, null)

          userStore.setUserInfo(res.result)

          if (!res.result.roleList?.length) {
            Toast('无项目权限，请联系管理员')
            return
          }
          othersStore.setIsInit(false)
          await projectStore.spaceInit()

          if (!projectStore.projectList?.length) {
            hideLoading()

            Toast('请先在管理端添加或关联项目')
            return
          }
          wx.switchTab({
            url: '/pages/index/index',
          })
        } else {
          Toast('登录失败！')
        }
      } catch (err) {
        err && Toast(err)
        Logger.log('toLogin-catch', err)
      }
    },

    async queryCaptcha() {
      const res = await getCaptcha({ mobilePhone: this.data.mobilePhone })

      console.log('queryCaptcha', res)
      this.setData({
        validTime: CAPTCHA_VALID_TIME,
      })
      this.reduceValidTime()
    },

    onAgreeClick(event: { detail: boolean }) {
      this.setData({
        isAgree: event.detail,
      })
    },
  },
})
