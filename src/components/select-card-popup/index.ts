import { ComponentWithComputed } from 'miniprogram-computed'
import { roomStore } from '../../store/index'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 弹窗标题
     */
    title: {
      type: String,
    },

    /**
     * 弹窗标题
     */
    titleLeftBtnText: {
      type: String,
      value: '',
    },
    /**
     * 展示的列表
     * cardType 是 switch light 传入 Device.DeviceItem[]
     * cardType 是 scene 传入 Scene.SceneItem[]
     */
    list: {
      type: Array,
    },
    /**
     * 选中的设备的uniId
     * 灯：deviceId ；开关：deviceId:switchId
     */
    selectList: {
      type: Array,
    },

    // 默认显示的房间数据
    defaultRoomId: {
      type: String,
      value: '',
    },

    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (!value) return
        if (this.data.roomListComputed.length) {
          let roomSelect = roomStore.currentRoom?.roomId

          if (this.data.roomListComputed.findIndex((item) => item.roomId === roomSelect) < 0) {
            roomSelect = this.data.roomListComputed[0].roomId
          }

          if (this.data.selectList.length) {
            let selectItem = { roomId: '' }
            this.data.selectList.forEach((id: string) => {
              if (selectItem === undefined || !selectItem.roomId) {
                selectItem = this.data.list.find(
                  (item: Device.DeviceItem & Scene.SceneItem) => item.sceneId === id || item.uniId === id,
                )
              }
            })

            if (selectItem && selectItem.roomId) {
              roomSelect = selectItem.roomId
            } else {
              roomSelect = this.data.roomListComputed[0].roomId
            }
          }
          if (this.data.defaultRoomId) {
            roomSelect = this.data.defaultRoomId
          }
          this.setData({
            roomSelect,
          })
        }
      },
    },
    /** 展示类型：light switch scene */
    cardType: {
      type: String,
      value: 'device',
    },
    showCancel: {
      type: Boolean,
      value: true,
    },
    cancelText: {
      type: String,
      value: '上一步',
    },
    showConfirm: {
      type: Boolean,
      value: true,
    },
    confirmText: {
      type: String,
      value: '确定',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '',
    offlineDevice: {} as Device.DeviceItem,
  },

  computed: {
    roomListComputed(data) {
      const roomList = [] as Room.RoomInfo[]
      // 从roomList遍历，保证房间顺序， 仅显示list的数据所在的房间列表
      roomStore.roomList.forEach((room) => {
        const isIncludes = data.list.some((item: { roomId: string }) => {
          if (item.roomId === room.roomId) {
            return true
          }
          return false
        })
        if (isIncludes) {
          roomList.push(room)
        }
      })
      return roomList
    },
    listComputed(data) {
      if (data.list) {
        return data.list.filter((item: Scene.SceneItem | Device.DeviceItem) => item.roomId === data.roomSelect)
      }
      return []
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(e: { detail: { uniId?: string; sceneId?: string } }) {
      this.triggerEvent('select', e.detail.sceneId || e.detail.uniId)
    },
    handleOfflineTap(e: { detail: { uniId?: string; sceneId?: string } }) {
      this.triggerEvent('handleOfflineTap', e.detail.sceneId || e.detail.uniId)
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm')
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        roomSelect: e.currentTarget.dataset.item.roomId,
      })
    },
    blank() {},
    clickTitleLeftBtn() {
      this.triggerEvent('clickTitleLeftBtn')
    },
  },
})
