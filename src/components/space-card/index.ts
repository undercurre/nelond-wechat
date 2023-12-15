import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { spaceBinding } from '../../store/index'
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
      const { isManage } = data
      const { spaceLevel } = data.spaceInfo
      return !isManage || spaceLevel !== SpaceLevel.area
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
      this.triggerEvent('cardtap', this.data.spaceInfo)
    },
    doNothing() {},
  },
})
