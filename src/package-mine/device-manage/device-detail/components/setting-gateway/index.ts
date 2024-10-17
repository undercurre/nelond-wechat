import { ComponentWithComputed } from 'miniprogram-computed'
import {
  checkWifiSwitch,
  emitter,
  hideLoading,
  isRelease,
  showLoading,
  strUtil,
  WSEventType,
} from '../../../../../utils/index'
import { controlDevice, gatewayBackup, uploadDeviceLog } from '../../../../../apis/index'
import { PRODUCT_ID, isNative } from '../../../../../config/index'
import Toast from '@vant/weapp/toast/toast'
import { projectStore } from '../../../../../store/index'

let st = 0

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
    canEditDevice: {
      type: Boolean,
      observer() {},
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isNative: isNative(),
    isShowChannelList: false,
    columns: [...new Array(16)].map((_item, index) => index + 11),
    isRelease: isRelease(),
  },

  computed: {
    isD3(data) {
      return data.deviceInfo.productId === PRODUCT_ID.D3
    },
    // 是否host设备
    isHost(data) {
      return data.deviceInfo.productId === PRODUCT_ID.host
    },
    channelText(data) {
      if (!data.deviceInfo.channel) {
        return ''
      }

      const panId = data.deviceInfo.panId?.toString(16).toUpperCase()

      return `${data.deviceInfo.channel}（0x${panId}）`
    },
    /**
     * 是否无线网络
     * @param connectType  0、有线以太网 1、wifi无线网络
     * @returns boolean
     */
    hasSSID(data) {
      return data.deviceInfo.connectType === 1
    },
    wifiSettingTips(data) {
      return data.hasSSID ? data.deviceInfo.wifiName : '当前为有线连接'
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleActionSheet() {
      // app环境开放
      if ((!this.data.isRelease || this.data.isNative) && this.data.canEditDevice) {
        this.setData({ isShowChannelList: !this.data.isShowChannelList })
      }
    },

    async onSelectChannel(event: WechatMiniprogram.CustomEvent) {
      const { value } = event.detail

      this.toggleActionSheet()

      const res = await controlDevice({
        deviceId: this.data.deviceInfo.deviceId,
        deviceType: 1,
        method: 'networkAnalysis',
        topic: '/zigbeeInfo',
        inputData: [
          {
            mode: 'updateChannel',
            channel: value,
          },
        ],
      })

      Toast(res.success ? '切换成功' : '切换失败')
    },

    toChangeWifi() {
      // 预校验，是否使用WIFI连接，以及wifi开关是否打开
      if (!this.data.hasSSID || !checkWifiSwitch()) {
        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/pages/wifi-connect/index', {
          type: 'changeWifi',
          sn: this.data.deviceInfo.sn,
        }),
      })
    },
    toChangeChannel() {
      if (!this.data.canEditDevice) return

      const panId = this.data.deviceInfo.panId?.toString(16).toUpperCase()

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/device-manage/wifi-channel/index', {
          channel: this.data.deviceInfo.channel,
          panId,
          deviceId: this.data.deviceInfo.deviceId,
        }),
      })
    },

    async uploadDeviceLog() {
      const res = await uploadDeviceLog(
        {
          deviceId: this.data.deviceInfo.deviceId,
        },
        { loading: true },
      )
      Toast(res.success ? '上传成功' : '上传失败')
    },

    async backup() {
      if (st) return // 已在备份中

      showLoading()
      const res = await gatewayBackup({
        deviceId: this.data.deviceInfo.deviceId,
        projectId: projectStore.currentProjectId,
      })
      if (!res.success) {
        Toast('备份失败')
      }

      const WAITING = 60000
      st = setTimeout(() => {
        clearTimeout(st)
        st = 0
        Toast('备份失败')
        hideLoading()
      }, WAITING)

      emitter.on('wsReceive', async (e) => {
        if (e.result.eventType === WSEventType.gateway_backup_result) {
          clearTimeout(st)
          st = 0
          Toast(e.result.eventData.result === 0 ? '备份成功' : '备份失败')
          hideLoading()
        }
      })
    },
  },

  lifetimes: {
    detached() {
      emitter.off('wsReceive')
      clearTimeout(st)
      st = 0
    },
  },
})
