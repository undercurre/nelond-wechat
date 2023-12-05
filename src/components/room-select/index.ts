import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding } from '../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '0',
    roomSelectMenu: {
      x: '0px',
      y: '45px',
      isShow: false,
    },
  },

  computed: {
    roomSelectMenuList(data: IAnyObject) {
      if (data.roomList) {
        return [
          { roomId: '0', roomName: '全屋' },
          ...(data.roomList as Room.RoomInfo[]).map((room) => ({
            roomId: room.roomId,
            roomName: room.roomName,
          })),
        ]
      }
      return []
    },
    currentRoomName(data: IAnyObject) {
      if (data.roomSelectMenuList) {
        return (data.roomSelectMenuList as { roomId: string; roomName: string }[]).find(
          (room) => room.roomId === data.roomSelect,
        )?.roomName
      }
      return ''
    },
    deviceListCompited(data: IAnyObject) {
      if (data.roomSelect === '0') {
        return data.allRoomDeviceList
      } else {
        return data.deviceList
      }
    },
  },

  lifetimes: {
    async ready() {
      await roomBinding.store.updateRoomList()
      if (this.data.roomSelect === '0') {
        deviceBinding.store.updateAllRoomDeviceList()
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleRoomSelect(e: { detail: string }) {
      console.log('roomSelect: ', e.detail)
      this.setData({
        roomSelect: e.detail,
      })
      this.hideSelectRoomMenu()
      deviceBinding.store.updateAllRoomDeviceList()
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
