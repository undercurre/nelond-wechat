import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding, deviceStore, spaceStore, otaStore } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../behaviors/pageBehaviors'
import { emitter, WSEventType } from '../../utils/eventBus'
import { queryDeviceInfoByDeviceId } from '../../apis/index'
import { runInAction } from 'mobx-miniprogram'
import { PRO_TYPE, SCREEN_PID, defaultImgDir } from '../../config/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    roomSelect: '0',
    listHeight: 0,
    roomSelectMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
  },

  computed: {
    deviceListCompited(data) {
      const list = data.allDeviceList?.length ? [...data.allDeviceList] : []
      const rst = list
        .sort((a, b) => a.orderNum - b.orderNum)
        // 过滤智慧屏按键
        .filter(
          (d) => (d.proType === PRO_TYPE.switch && !SCREEN_PID.includes(d.productId)) || d.proType !== PRO_TYPE.switch,
        )
      if (data.roomSelect === '0') {
        return rst
      } else if (data.roomSelect === '-1') {
        return rst.filter((d) => !d.onLineStatus)
      } else {
        return rst.filter((d: Device.DeviceItem) => d.spaceId === data.roomSelect)
      }
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      // 进入时再清理一次防止上一次清理失败
      emitter.off('wsReceive')
      emitter.off('deviceEdit')
      // 防止boundingClientRect获取错误数据
      setTimeout(() => {
        wx.createSelectorQuery()
          .select('#content')
          .boundingClientRect()
          .exec((res) => {
            if (res[0] && res[0].height) {
              this.setData({
                listHeight: res[0].height,
              })
            }
          })
        wx.createSelectorQuery()
          .select('#selectRoomBtn')
          .boundingClientRect()
          .exec((res) => {
            if (res[0]) {
              this.setData({
                roomSelectMenu: {
                  x: '20rpx',
                  y: res[0].bottom + 20 + 'px',
                  isShow: false,
                },
              })
            }
          })
      }, 500)
      this.loadData()
      // 状态更新推送
      emitter.on('deviceEdit', async () => {
        // if (this.data.roomSelect === '0') {
        await deviceBinding.store.updateallDeviceList()

        // 预防修改空间时，造成当前选中空间为空
        setTimeout(() => {
          if (!this.data.deviceListCompited.length) {
            this.setData({
              roomSelect: roomBinding.store.spaceList[0].spaceId,
            })
          }
        }, 100)
        //   return
        // } else if (this.data.roomSelect) {
        //   deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
        // }
      })
      emitter.on('wsReceive', async (e) => {
        // 设备相关的消息推送根据条件判断是否刷新
        if (
          typeof e.result.eventData === 'object' &&
          WSEventType.device_online_status === e.result.eventType &&
          e.result.eventData.spaceId &&
          (e.result.eventData.spaceId === this.data.roomSelect || this.data.roomSelect === '0')
        ) {
          // 如果是当前空间的设备状态发生变化，更新设备状态
          const index = deviceStore.allDeviceList.findIndex((device) => device.deviceId === e.result.eventData.deviceId)
          if (index !== -1) {
            const res = await queryDeviceInfoByDeviceId({
              deviceId: deviceStore.deviceList[index].deviceId,
              spaceId: deviceStore.deviceList[index].spaceId,
            })
            if (res.success) {
              runInAction(() => {
                deviceStore.allDeviceList[index] = res.result
                deviceStore.allDeviceList = [...deviceStore.allDeviceList]
              })
            }
          } else {
            // 可能是新绑的设备，直接更新空间
            deviceBinding.store.updateallDeviceList()
          }
        } else if (
          typeof e.result.eventData === 'object' &&
          WSEventType.device_del === e.result.eventType &&
          e.result.eventData.spaceId &&
          (e.result.eventData.spaceId === this.data.roomSelect || this.data.roomSelect === '0')
        ) {
          // 设备被删除，查空间
          // if (this.data.roomSelect === '0') {
          deviceBinding.store.updateallDeviceList()
          // } else {
          // deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
          // }
        } else if (typeof e.result.eventData === 'object' && e.result.eventType === WSEventType.room_del) {
          // await spaceStore.updateSpaceList()
          // if (this.data.roomSelect === '0') {
          deviceBinding.store.updateallDeviceList()
          if (spaceStore.spaceList.length > 0) {
            this.setData({
              roomSelect: roomBinding.store.spaceList[0].spaceId,
            })
          }
          // } else if (e.result.eventData.spaceId === this.data.roomSelect) {
          //   // 空间被删了，切到其他空间
          //   if (spaceStore.spaceList.length > 0) {
          //     this.setData({
          //       roomSelect: roomBinding.store.spaceList[0].spaceId,
          //     })
          //     deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
          //   } else {
          //     this.setData({
          //       roomSelect: '',
          //     })
          //     runInAction(() => {
          //       deviceStore.deviceList = []
          //     })
          //   }
          // }
        }
      })
    },

    onUnload() {
      emitter.off('wsReceive')
      emitter.off('deviceEdit')
    },

    async onPullDownRefresh() {
      try {
        // await spaceStore.updateSpaceList()
        // if (this.data.roomSelect) {
        //   // 查空间
        //   deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
        // } else {
        // 查全屋
        deviceBinding.store.updateallDeviceList()
        // }
      } finally {
        this.setData({
          isRefresh: false,
        })
      }
    },

    async loadData() {
      // 先加载ota列表信息，用于设备详情页展示
      otaStore.updateList()
      // await spaceStore.updateSpaceList()
      // if (this.data.roomSelect === '0') {
      deviceBinding.store.updateallDeviceList()
      //   return
      // } else if (this.data.roomSelect) {
      //   deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
      // }
    },

    handleFullPageTap(e?: { detail: { x: number; y: number } }) {
      if (e && e.detail && e.detail.x) {
        wx.createSelectorQuery()
          .select('#selectRoomBtn')
          .boundingClientRect()
          .exec((res) => {
            // 点中加按钮以外的地方都要隐藏下拉菜单
            if (
              res[0] &&
              (e.detail.x > res[0].right ||
                e.detail.x < res[0].left ||
                e.detail.y > res[0].bottom ||
                e.detail.y < res[0].top)
            ) {
              this.hideSelectRoomMenu()
            }
          })
      }
    },

    handleRoomSelect(e: { detail: string }) {
      this.setData({
        roomSelect: e.detail,
      })
      // this.hideSelectRoomMenu()
      // if (this.data.roomSelect === '0') {
      //   // 查空间
      //   deviceBinding.store.updateDeviceList(undefined, this.data.roomSelect)
      // } else {
      //   // 查全屋
      //   deviceBinding.store.updateallDeviceList()
      // }
    },

    handleCardClick(e: { currentTarget: { dataset: { deviceId: string; deviceType: number } } }) {
      const { deviceId, deviceType } = e.currentTarget.dataset
      console.log('handleCardClick', deviceId, deviceType)
      const pageName = deviceType === 4 ? 'group-detail' : 'device-detail'

      wx.navigateTo({
        url: `/package-mine/device-manage/${pageName}/index?deviceId=${deviceId}`,
      })
    },

    showSelectRoomMenu() {
      if (this.data.roomSelectMenu.isShow) {
        return this.hideSelectRoomMenu()
      }
      this.doSelectRoomArrowAnimation(true, this.data.roomSelectMenu.isShow)
      this.setData({
        'roomSelectMenu.isShow': true,
      })
    },

    hideSelectRoomMenu() {
      this.doSelectRoomArrowAnimation(false, this.data.roomSelectMenu.isShow)
      this.setData({
        'roomSelectMenu.isShow': false,
      })
    },

    doSelectRoomArrowAnimation(newValue: boolean, oldValue: boolean) {
      if (newValue === oldValue) {
        return
      }
      if (newValue) {
        this.animate(
          '#selectRoomArrow',
          [
            {
              rotateZ: 0,
            },
            {
              rotateZ: 180,
            },
          ],
          200,
        )
      } else {
        this.animate(
          '#selectRoomArrow',
          [
            {
              rotateZ: 180,
            },
            {
              rotateZ: 0,
            },
          ],
          200,
        )
      }
    },
  },
})
