import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, spaceStore } from '../../store/index'
import { SpaceLevel, spaceIcon } from '../../config/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    spaceInfo: {
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
      if (data.spaceDeviceList && data.spaceInfo && data.spaceInfo.spaceId) {
        return data.spaceDeviceList[data.spaceInfo.spaceId] ?? []
      }
      return []
    },
    desc(data) {
      const list = [] as { text: string; type: string }[]
      const { deviceCount, offlineDeviceCount, nodeCount } = (data.spaceInfo || {}) as Space.SpaceInfo
      if (nodeCount) {
        list.push({
          text: `${nodeCount} 个下级空间`,
          type: 'normal',
        })
      }
      if (deviceCount) {
        list.push({
          text: `全部设备 ${deviceCount}`,
          type: 'normal',
        })
      }
      if (offlineDeviceCount) {
        list.push({
          text: `离线 ${offlineDeviceCount}`,
          type: 'error',
        })
      }
      return list
    },
    icon(data) {
      const spaceLevel = (data.spaceInfo?.spaceLevel ?? 1) as SpaceLevel
      return spaceIcon[spaceLevel]
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
      const index = spaceStore.spaceList.findIndex((space) => space.spaceId === this.data.spaceInfo.spaceId)
      runInAction(() => {
        spaceStore.currentSpaceIndex = index
      })
      wx.navigateTo({
        url: this.data.spaceInfo.children
          ? '/package-space-control/space-list/index'
          : '/package-space-control/index/index',
      })
    },
    doNothing() {},
  },
})
