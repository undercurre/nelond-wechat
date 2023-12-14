import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { spaceBinding, spaceStore } from '../../store/index'
import { SpaceLevel, SpaceConfig } from '../../config/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [spaceBinding] })],
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
    // 是否空间管理页
    isManage: {
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
      const spaceLevel = (data.spaceInfo?.spaceLevel ?? 1) as Space.SpaceLevel
      return SpaceConfig[spaceLevel]
    },
    hasArrow(data) {
      const { spaceLevel, isManage } = data.spaceInfo
      return !isManage || spaceLevel !== SpaceLevel.park
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
      const { spaceLevel, spaceId, spaceName, nodeCount } = this.data.spaceInfo as Space.SpaceInfo

      // 在空间管理页中
      if (this.data.isManage) {
        if (spaceLevel !== SpaceLevel.park) {
          wx.navigateTo({
            url: '/package-space-control/space-list/index',
          })
        }
        return
      }

      // 在空间展示列表中
      const index = spaceStore.spaceList.findIndex((space) => space.spaceId === spaceId)
      runInAction(() => {
        spaceStore.currentSpaceIndex = index
      })
      const link = nodeCount ? '/package-space-control/space-list/index' : '/package-space-control/index/index'
      wx.navigateTo({
        url: `${link}?pid=${spaceId}&pname=${spaceName}&plevel=${spaceLevel}`,
      })
    },
    doNothing() {},
  },
})
