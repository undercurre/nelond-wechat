import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { spaceBinding, deviceBinding } from '../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [spaceBinding, deviceBinding] })],
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
      if (data.spaceList) {
        return [
          { spaceId: '0', spaceName: '全屋' },
          ...(data.spaceList as Space.SpaceInfo[]).map((space) => ({
            spaceId: space.spaceId,
            spaceName: space.spaceName,
          })),
        ]
      }
      return []
    },
    currentRoomName(data: IAnyObject) {
      if (data.roomSelectMenuList) {
        return (data.roomSelectMenuList as { spaceId: string; spaceName: string }[]).find(
          (space) => space.spaceId === data.roomSelect,
        )?.spaceName
      }
      return ''
    },
    deviceListCompited(data: IAnyObject) {
      if (data.roomSelect === '0') {
        return data.allDeviceList
      } else {
        return data.deviceList
      }
    },
  },

  lifetimes: {
    async ready() {
      // await spaceBinding.store.updateSpaceList()
      // if (this.data.roomSelect === '0') {
      //   deviceBinding.store.updateAllDeviceList()
      // }
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
      deviceBinding.store.updateAllDeviceList()
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
