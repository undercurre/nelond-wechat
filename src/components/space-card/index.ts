import { ComponentWithComputed } from 'miniprogram-computed'
import { SpaceLevel, SpaceConfig } from '../../config/index'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    spaceInfo: {
      type: Object,
      observer() {},
    },
    // 是否空间管理页
    isManagePage: {
      type: Boolean,
      value: false,
    },
    // 是否编辑模式
    isEditMode: {
      type: Boolean,
      value: false,
    },
  },

  computed: {
    title(data) {
      const { spaceName } = data.spaceInfo
      return spaceName.length > 8 ? spaceName.slice(0, 6) + '...' + spaceName.slice(-2) : spaceName
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
    showEditIcon(data) {
      const { isEditMode, spaceInfo } = data
      return isEditMode && spaceInfo.publicSpaceFlag === 0
    },
    hasArrow(data) {
      const { isManagePage } = data
      const { spaceLevel, publicSpaceFlag, pid } = data.spaceInfo
      return (
        !isManagePage ||
        (spaceLevel !== SpaceLevel.area && publicSpaceFlag === 0) ||
        (spaceLevel === SpaceLevel.area && pid === '0')
      )
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
