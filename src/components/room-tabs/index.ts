import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding, deviceStore } from '../../store/index'

type SimRoomInfo = Pick<Space.SpaceInfo, 'spaceId' | 'spaceName'>

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否包括网关
    showGateway: {
      type: Boolean,
      value: false,
    },
    // 设备列表，名称区别于 deviceList
    sDeviceList: {
      type: Array,
    },
    // 是否显示专门的“离线”页签
    showOfflineTab: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '0',
  },
  computed: {
    /**
     * @description 包括待选设备的房间列表
     * 默认塞入全部设备
     */
    roomMenuList(data) {
      const list = data.sDeviceList ? data.sDeviceList : deviceStore.allRoomDeviceList
      const deviceList: Device.DeviceItem[] = data.showGateway
        ? list
        : list.filter((device: Device.DeviceItem) => device.deviceType === 2)
      const roomList: SimRoomInfo[] = []

      deviceList.forEach(({ spaceId, spaceName }) => {
        if (roomList.findIndex((room) => room.spaceId === spaceId) === -1) {
          roomList.push({
            spaceId,
            spaceName,
          })
        }
      })
      if (data.showOfflineTab) {
        return [{ spaceId: '0', spaceName: '全屋' }, ...roomList, { spaceId: '-1', spaceName: '离线' }]
      } else {
        return [{ spaceId: '0', spaceName: '全屋' }, ...roomList]
      }
    },
  },

  lifetimes: {},

  /**
   * 组件的方法列表
   */
  methods: {
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      const roomSelect = e.currentTarget.dataset.item.spaceId
      this.setData({ roomSelect })
      this.triggerEvent('roomSelect', roomSelect)
    },
  },
})
