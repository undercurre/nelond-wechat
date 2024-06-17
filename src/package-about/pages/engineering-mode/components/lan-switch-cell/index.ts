import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { mzaioDomain, getEnv } from '../../../../../config/index'
import {
  isAndroid,
  logout,
  setCurrentEnv,
  storage,
  resetCurrentEnv,
  delay,
  WifiSocket,
} from '../../../../../utils/index'

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
    lanIP: '192.168.31.139',
    port: '80',
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
    /**
     * 局域网模式需要提前检查相机、蓝牙等授权，需要前置授权，无网环境wx.getSetting()调用失败，无法校验
     */
    async checkAuthLan() {
      const settingRes = await wx.getSetting().catch((err) => err)

      let isAllAuth = true // 是否已全部授权

      console.log('settingRes', settingRes)

      let res = await wx
        .authorize({
          scope: 'scope.userLocation',
        })
        .catch((err) => err)

      if (!res.errMsg.includes('ok')) {
        isAllAuth = false
      }

      console.log('userLocation', res)

      res = await wx
        .authorize({
          scope: 'scope.bluetooth',
        })
        .catch((err) => err)

      if (!res.errMsg.includes('ok')) {
        isAllAuth = false
      }
      console.log('bluetooth', res)

      res = await wx
        .authorize({
          scope: 'scope.camera',
        })
        .catch((err) => err)

      if (!res.errMsg.includes('ok')) {
        isAllAuth = false
      }
      console.log('camera', res)

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

      if (isAndroid()) {
        // 无法访问互联网的情况下，wx.getWifiList()调用不成功,猜测微信存在查询外网接口信息的流程，堵塞流程，
        // 需在可访问外网时先调用一次，后面即使断网，再次调用getWifiList也能正常调用
        wx.getWifiList().catch((err) => console.error('getWifiList', err))

        // 蓝牙权限同理,相机权限需要通过页面组件方式预授权
        const openBleRes = await wx
          .openBluetoothAdapter({
            mode: 'central',
          })
          .catch((err: WechatMiniprogram.BluetoothError) => err)

        console.log('openBleRes', openBleRes)
      }

      return isAllAuth
    },
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
      try {
        wx.showLoading({
          title: '加载中',
        })
        // 通过抛出异常中断逻辑
        await this.checkAuthLan()

        wx.hideLoading()

        this.setData({
          ishowPopup: false,
          isLanOn: true,
        })

        const dialogRes = await Dialog.confirm({
          title: '已切换到局域网模式，请连接到内部无线局域网，才能正常使用',
          cancelButtonText: '跳过',
          confirmButtonText: '去连接',
        }).catch(() => false)

        console.log('dialogRes', dialogRes)

        if (dialogRes) {
          if (isAndroid()) {
            const wifiClient = new WifiSocket({ ssid: '' })

            await wifiClient.connectWifi()

            wifiClient.close()
          } else {
            wx.getWifiList().catch((err) => console.error('getWifiList', err))
          }
        }

        Toast('切换成功')

        logout(false) // 切换局域网模式，需要重新登录

        mzaioDomain.Lan = `${this.data.lanIP}:${this.data.port}`
        storage.set('mzaioDomainLan', mzaioDomain.Lan)
        setCurrentEnv('Lan')

        await delay(1000) // 强行延时，等toast提示完成
        wx.reLaunch({ url: '/pages/login/index' }) // 切换成功，跳转登录
      } catch (error) {
        wx.hideLoading()
        error && Toast(error)
      }
    },

    getCameraError(event: WechatMiniprogram.CustomEvent) {
      console.error('getCameraError', event)
    },

    initCameraDone(event: WechatMiniprogram.CustomEvent) {
      console.log('initCameraDone', event)
    },
  },
})
