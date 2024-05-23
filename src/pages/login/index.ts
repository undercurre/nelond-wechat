import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { ComponentWithComputed } from 'miniprogram-computed'
import { RegMobile } from '@midea/reg-awsome'
import { login, getCaptcha, loginByMz } from '../../apis/index'
import { projectStore, othersStore, userStore } from '../../store/index'
import { storage, showLoading, hideLoading, Logger } from '../../utils/index'
import { defaultImgDir, UNACTIVATED, CAPTCHA_VALID_TIME, getEnv } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { WifiSocket } from '../../utils/index'

let hasToastLan = false // 是否已经提示用户切换内网

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isLan: false,
    isAgree: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    marginTop: 0,
    defaultImgDir,
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
  },

  pageLifetimes: {
    show() {
      this.setData({
        isLan: getEnv() === 'Lan',
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
        if (this.data.isLan) {
          // 通过抛出异常中断逻辑
          await this.checkAuthLan()

          // 每次进入小程序仅弹一次提示
          if (hasToastLan) {
            this.toastLinkLanWifi()
            return
          }

          if (!RegMobile.reg.test(this.data.mobilePhone)) {
            throw '请输入正确的手机号码'
          }
        }

        const res = this.data.isLan
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
      console.log('onAgreeClick', event)

      this.setData({
        isAgree: event.detail,
      })
    },

    toPage(e: WechatMiniprogram.TouchEvent) {
      wx.navigateTo({
        url: '/package-about/pages/protocol-show/index?protocal=' + e.currentTarget.dataset.value,
      })
    },

    /**
     * 局域网模式需要提前检查相机、蓝牙等授权
     */
    async checkAuthLan() {
      const settingRes = await wx.getSetting().catch((err) => err)

      let isAllAuth = true // 是否已全部授权

      console.log('settingRes', settingRes)

      if (!settingRes.authSetting['scope.userFuzzyLocation']) {
        const res = await wx
          .authorize({
            scope: 'scope.userFuzzyLocation',
          })
          .catch((err) => err)

        if (!res.errMsg.includes('ok')) {
          isAllAuth = false
        }

        console.log('userFuzzyLocation', res)
      }

      if (!settingRes.authSetting['scope.bluetooth']) {
        const res = await wx
          .authorize({
            scope: 'scope.bluetooth',
          })
          .catch((err) => err)

        console.log('bluetooth', res)
      }

      if (!settingRes.authSetting['scope.camera']) {
        const res = await wx
          .authorize({
            scope: 'scope.camera',
          })
          .catch((err) => err)

        console.log('camera', res)
      }

      if (!isAllAuth) {
        Dialog.alert({
          message: '请授权使用蓝牙、相机、地理位置权限，否则无法正常使用小程序功能',
          showCancelButton: true,
          cancelButtonText: '返回',
          confirmButtonText: '去设置',
          confirmButtonOpenType: 'openSetting',
        }).catch(() => {})
      }

      if (!isAllAuth) {
        throw null
      }

      return isAllAuth
    },

    /**
     * 提示连接局域网
     */
    async toastLinkLanWifi() {
      hasToastLan = true
      const dialogRes = await Dialog.confirm({
        title: '已切换到局域网模式，请连接到内部无线局域网，才能正常使用',
        cancelButtonText: '取消',
        confirmButtonText: '去连接',
      }).catch(() => false)

      console.log('dialogRes', dialogRes)

      if (dialogRes) {
        const wifiClient = new WifiSocket({ ssid: '' })

        wifiClient.connectWifi()
      }
    },
  },
})
