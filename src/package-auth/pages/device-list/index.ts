import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { bindMeiju, getMeijuDeviceList, syncMeijuDeviceList, delDeviceSubscribe } from '../../../apis/index'
import { delay } from '../../../utils/index'
import { defaultImgDir } from '../../../config/index'
import { homeStore, homeBinding } from '../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    deviceList: [] as Meiju.MeijuDevice[],
    listHeight: 0,
  },

  computed: {},

  methods: {
    /**
     * @param query.homeId 上一页选择的美居家庭id
     */
    async onLoad(query: { homeId: string }) {
      console.log('device list onload', query, this.data.currentHomeId)
      // 带 homeId，未绑定
      if (query?.homeId) {
        const res = await bindMeiju({ mideaHouseId: query.homeId, houseId: this.data.currentHomeId })

        if (res.success) {
          const deviceList = res.result
          this.setData({
            deviceList,
          })
          homeStore.updateRoomCardList()
        } else {
          Toast(res.msg)
        }
      }
      // 不带 homeId，从第三方列表页直接进入
      else {
        const res = await getMeijuDeviceList(this.data.currentHomeId)
        if (res.success) {
          const deviceList = res.result
          this.setData({
            deviceList,
          })
          homeStore.updateRoomCardList()
        } else {
          Toast(res.msg)
        }
      }

      await delay(500)
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              listHeight: res[0].height - 20,
            })
          }
        })
    },

    async syncMeijuDevice() {
      const res = await syncMeijuDeviceList(this.data.currentHomeId)
      if (res.success) {
        const deviceList = res.result
        this.setData({
          deviceList,
        })
        homeStore.updateRoomCardList()
        Toast('同步成功')
      } else {
        Toast(res.msg)
      }
    },

    async debindMeiju() {
      const dialogRes = await Dialog.confirm({
        title: '取消授权后，美居家庭的设备将从HOMLUX家庭移除，请谨慎操作。',
      }).catch(() => 'cancel')

      if (dialogRes === 'cancel') return

      const res = await delDeviceSubscribe(this.data.currentHomeId)
      if (res.success) {
        Toast('已解除绑定')

        homeStore.updateRoomCardList()
        await delay(1500)

        wx.switchTab({
          url: '/pages/index/index',
        })
      } else {
        Toast(res.msg)
      }
    },
  },
})
