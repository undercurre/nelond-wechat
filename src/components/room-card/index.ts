import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, roomStore } from '../../store/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    roomInfo: {
      type: Object,
      observer() {},
    },
    isMoving: {
      type: Boolean,
      value: false,
    },
  },

  computed: {
    deviceListComputed(data) {
      if (data.roomDeviceList && data.roomInfo && data.roomInfo.roomId) {
        return data.roomDeviceList[data.roomInfo.roomId] ?? []
      }
      return []
    },
    desc(data) {
      const list = [] as { text: string; type: string }[]
      const { deviceNum, offline, children } = data.roomInfo || {}
      if (children) {
        list.push({
          text: `${children} 个下级空间`,
          type: 'normal',
        })
      }
      if (deviceNum) {
        list.push({
          text: `全部设备 ${deviceNum}`,
          type: 'normal',
        })
      }
      if (offline) {
        list.push({
          text: `离线 ${offline}`,
          type: 'error',
        })
      }
      return list
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      const index = roomStore.roomList.findIndex((room) => room.roomId === this.data.roomInfo.roomId)
      runInAction(() => {
        roomStore.currentRoomIndex = index
      })
      wx.navigateTo({
        url: '/package-room-control/index/index',
      })
    },
    doNothing() {},
  },
})
