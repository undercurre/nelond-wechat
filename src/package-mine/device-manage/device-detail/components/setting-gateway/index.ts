import { ComponentWithComputed } from 'miniprogram-computed'
import { checkWifiSwitch, isRelease } from '../../../../../utils/index'
import { controlDevice, uploadDeviceLog } from '../../../../../apis/index'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
    isManager: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowChannelList: false,
    columns: [...new Array(16)].map((_item, index) => index + 11),
    isRelease: isRelease(),
  },

  computed: {
    channelText(data) {
      if (!data.deviceInfo.channel) {
        return ''
      }

      const panId = data.deviceInfo.panId?.toString(16).toUpperCase()

      return `${data.deviceInfo.channel}(0x${panId})`
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleActionSheet() {
      if (!this.data.isRelease && this.data.isManager) {
        this.setData({ isShowChannelList: !this.data.isShowChannelList })
      }
    },

    async onSelectChannel(event: WechatMiniprogram.CustomEvent) {
      console.log(event.detail)
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
      // 预校验wifi开关是否打开
      if (!checkWifiSwitch()) {
        return
      }

      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${this.data.deviceInfo.sn}`,
      })
    },

    async uploadDeviceLog() {
      const res = await uploadDeviceLog({
        deviceId: this.data.deviceInfo.deviceId,
      })
      Toast(res.success ? '上传成功' : '上传失败')
    },
  },
})
