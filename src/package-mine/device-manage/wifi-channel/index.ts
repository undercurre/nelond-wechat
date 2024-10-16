import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { controlDevice } from '../../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import { delay, hideLoading, showLoading } from '../../../utils/index'

const REC_CHANNEL = ['11', '15', '20', '25']

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    channel: '',
    currentChannel: '',
    panId: '',
    contentHeight: 0,
    recList: REC_CHANNEL,
    channelList: [] as string[],
    showMore: false,
  },

  computed: {
    channelText(data) {
      if (!data.channel) {
        return ''
      }
      return `${data.channel}（0x${data.panId}）`
    },
    moreIconStyle(data) {
      const { showMore } = data
      return `transform: rotate(${showMore ? 0 : -90}deg)`
    },
  },

  methods: {
    onLoad({ deviceId, channel, panId }: { deviceId: string; channel: string; panId: string }) {
      console.log({ channel, panId })
      this.setData({
        currentChannel: channel,
        channel,
        panId,
        deviceId,
        recList: REC_CHANNEL.filter((item) => item !== channel),
        channelList: [...new Array(16)]
          .map((_, index) => String(index + 11))
          .filter((item) => !REC_CHANNEL.includes(item) && item !== channel),
      })

      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          console.log(res)
          if (res[0]?.height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    checkChannel(e: WechatMiniprogram.CustomEvent<never, never, { value: string }>) {
      this.setData({
        currentChannel: e.currentTarget.dataset.value,
      })
    },
    toConfirm() {
      Dialog.confirm({
        title: '确定切换信道',
        message:
          '切换信道前，请确保所有设备已上电并处于在线状态。切换信道后，部分设备可能会永久离线，需要手动重新配网。请谨慎操作！',
        showCancelButton: true,
      })
        .then(async () => {
          showLoading()
          const res = await controlDevice({
            deviceId: this.data.deviceId,
            deviceType: 1,
            method: 'networkAnalysis',
            topic: '/zigbeeInfo',
            inputData: [
              {
                mode: 'updateChannel',
                channel: this.data.currentChannel,
              },
            ],
          })

          if (!res.success) {
            Toast('切换失败')
            hideLoading()
            return
          }
          await delay(2000) // 上报较慢，延迟提示
          hideLoading()

          Toast('切换成功')

          wx.navigateBack()
        })
        .catch(() => {})
    },
    toggleMore() {
      this.setData({
        showMore: !this.data.showMore,
      })
    },
  },
})
