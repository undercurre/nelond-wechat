import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { checkWifiSwitch, getCurrentPageParams, isAndroid, storage, strUtil } from '../../utils/index'
import { defaultImgDir } from '../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    type: '', // bind: 绑定网关，changeWifi： 更改wifi
    isShowPw: false, // 是否展示密码明文
    isShowWifiTips: false,
    hasShowWifiTips: false,
    isShowWifiList: false,
    isRequestSystemWifiList: false,
    selectWifi: {
      SSID: '',
      pw: '',
    },
    wifiInfo: {
      SSID: '',
      pw: '',
    },
    cacheWifiList: [] as Array<{ SSID: string; pw: string }>,
    systemWifiList: [] as WechatMiniprogram.WifiInfo[],
    _wifiSwitchInterId: 0,
  },

  computed: {
    wifiList(data) {
      const list = data.cacheWifiList.map((item) => ({
        ...item,
        signalStrength: 100,
        frequency: 2.4,
      }))

      data.systemWifiList.forEach((item) => {
        const wifiInfo = list.find((lisItem) => item.SSID === lisItem.SSID)

        if (wifiInfo) {
          wifiInfo.frequency = item.frequency
          wifiInfo.signalStrength = isAndroid() ? item.signalStrength : item.signalStrength * 100
        } else {
          list.push({
            ...item,
            pw: '',
          })
        }
      })

      return list
    },
    pageTitle(data) {
      let title = ''

      if (data.type === 'changeWifi') {
        title = '重新联网'
      } else {
        title = '连接项目Wi-Fi'
      }

      return title
    },
  },

  lifetimes: {
    ready() {
      if (checkWifiSwitch()) {
        this.initWifi()
      } else {
        this.data._wifiSwitchInterId = setInterval(() => {
          const systemSetting = wx.getSystemSetting()

          if (systemSetting.wifiEnabled) {
            Dialog.close()
            clearInterval(this.data._wifiSwitchInterId)
            this.data._wifiSwitchInterId = 0
            this.initWifi()
          }
        }, 1500)
      }

      const pageParams = getCurrentPageParams()

      console.log('ready', pageParams)

      const cacheWifiInfo = storage.get('selected_home_wifi') as { SSID: string; pw: string }

      const cacheWifiList = storage.get('cacheWifiList', []) as Array<{ SSID: string; pw: string }>

      this.setData({
        type: pageParams.type || 'bind',
        wifiInfo: cacheWifiInfo || {
          SSID: '',
          pw: '',
        },
        cacheWifiList: cacheWifiList,
      })
    },
    detached() {
      if (this.data._wifiSwitchInterId) {
        clearInterval(this.data._wifiSwitchInterId)
      }

      wx.offGetWifiList()
    },
  },

  pageLifetimes: {
    show() {
      this.setData({
        isRequestSystemWifiList: false,
      })
    },
  },

  methods: {
    toggleWifiTips() {
      this.setData({
        hasShowWifiTips: true,
        isShowWifiTips: !this.data.isShowWifiTips,
      })
    },
    onChange(event: WechatMiniprogram.CustomEvent) {
      const { value } = event.detail

      console.log('onChange', event)

      this.setData({
        'wifiInfo.SSID': value.SSID,
      })
    },

    async initWifi() {
      const startRes = await wx.startWifi()

      console.log('startRes', startRes)

      wx.onGetWifiList((res) => {
        console.log('onGetWifiList-wifi-connect', res)
        const wifiList = res.wifiList.filter((item) => {
          // 过滤5G信号wifi,仅安卓端有效
          if (item.frequency && item.frequency > 5000) {
            return false
          }
          return (
            item.SSID &&
            !item.SSID.includes('midea_16') &&
            this.data.systemWifiList.findIndex((foundItem) => item.SSID === foundItem.SSID) < 0
          ) // 过滤空的ssid的wifi以及网关热点
        })

        if (!wifiList.length) {
          return
        }

        this.setData({
          isRequestSystemWifiList: false,
          systemWifiList: this.data.systemWifiList.concat(wifiList),
        })
      })

      // 若当前没有选择wifi，默认回填当前连接的wifi
      if (!this.data.wifiInfo.SSID) {
        wx.getConnectedWifi({
          success: (res) => {
            // 过滤网关热点
            if (!res.wifi.SSID?.includes('midea_16')) {
              this.setData({
                'wifiInfo.SSID': res.wifi.SSID,
              })
            }
          },
        })
      }
    },

    toggleWifi() {
      if (!checkWifiSwitch()) {
        return
      }

      const hasList = this.data.cacheWifiList.length > 0 || this.data.systemWifiList.length > 0

      if (hasList) {
        this.toggleWifiListPopup()
        return
      }

      this.getWifiList()
    },

    toggleWifiListPopup() {
      this.setData({
        isShowWifiList: !this.data.isShowWifiList,
      })
    },

    async getWifiList() {
      if (isAndroid() || this.data.hasShowWifiTips) {
        this.setData({
          isRequestSystemWifiList: true,
        })
        const wifiListRes = await wx.getWifiList().catch((err) => {
          this.setData({
            isRequestSystemWifiList: false,
          })

          console.log('getWifiList-catch', err)
        })

        console.log('getWifiList', wifiListRes)

        this.setData({
          isShowWifiList: true,
        })
      } else {
        this.toggleWifiTips()
      }
    },

    selectWifi(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset
      const item = this.data.wifiList[index]

      this.setData({
        selectWifi: {
          SSID: item.SSID,
          pw: item.pw,
        },
      })
    },

    confirmWifi() {
      this.setData({
        isShowWifiList: false,
        wifiInfo: {
          SSID: this.data.selectWifi.SSID,
          pw: this.data.selectWifi.pw,
        },
      })
    },

    changeWifiName(e: WechatMiniprogram.CustomEvent) {
      console.log('changeWifiName', e)
      this.setData({
        'wifiInfo.SSID': e.detail.value,
      })
    },

    changePw(e: WechatMiniprogram.CustomEvent) {
      console.log('changeWifiName', e)
      this.setData({
        'wifiInfo.pw': e.detail.value,
      })
    },

    togglePw() {
      this.setData({
        isShowPw: !this.data.isShowPw,
      })
    },

    next() {
      const pageParams = getCurrentPageParams()

      const { SSID, pw } = this.data.wifiInfo

      const cacheWifiList = this.data.cacheWifiList

      const index = cacheWifiList.findIndex((item) => item.SSID === SSID)

      if (index >= 0) {
        cacheWifiList[index].pw = pw
      } else {
        cacheWifiList.push({
          SSID,
          pw,
        })
      }

      storage.set('cacheWifiList', cacheWifiList)

      storage.set('selected_home_wifi', this.data.wifiInfo) // 记住输入过的wifi信息，下次自动回填

      if (!pageParams.apSSID && pageParams.sn) {
        pageParams.apSSID = `midea_16_${(pageParams.sn as string).substr(-8, 4)}`
      }

      wx.redirectTo({
        url: strUtil.getUrlWithParams('/package-distribution/link-gateway/index', {
          ...pageParams,
          wifiSSID: SSID,
          wifiPassword: pw,
          type: this.data.type,
        }),
      })
    },
  },
})
