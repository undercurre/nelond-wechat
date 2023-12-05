import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { execScene } from '../../../../apis/scene'
import { roomBinding, roomStore } from '../../../../store/index'
import { sceneImgDir } from '../../../../config/index'

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
    showScene(data) {
      return !data.isMoving
    },
    sceneList(data) {
      return data.roomInfo.sceneList.map((scene: Scene.SceneBase) => {
        return {
          ...scene,
          sceneName: scene.sceneName.slice(0, 4),
        }
      })
    },
    deviceListComputed(data) {
      if (data.roomDeviceList && data.roomInfo && data.roomInfo.roomId) {
        return data.roomDeviceList[data.roomInfo.roomId] ?? []
      }
      return []
    },
    hasBottomPadding(data) {
      return data.roomInfo.sceneList.length > 0 && !data.isMoving
    },
    desc(data) {
      if (data.sceneList && data.deviceListComputed) {
        return data.roomInfo.lightOnCount
          ? data.roomInfo.lightOnCount + '盏灯亮起'
          : data.roomInfo.lightCount > 0
          ? '灯全部关闭'
          : ''
      }
      return ''
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneImgDir,
    sceneClickId: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleSceneTap(e: { currentTarget: { dataset: { value: string } } }) {
      if (this.data.sceneClickId) {
        return
      }
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        sceneClickId: e.currentTarget.dataset.value,
      })

      setTimeout(() => {
        this.setData({
          sceneClickId: '',
        })
      }, 1050)
      execScene(e.currentTarget.dataset.value)
    },
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
