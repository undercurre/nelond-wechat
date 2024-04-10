import { ComponentWithComputed } from 'miniprogram-computed'
// import { spaceStore } from '../../store/index'

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

    // 默认显示的空间数据
    defaultSpaceId: {
      type: String,
      value: '',
    },

    show: {
      type: Boolean,
      value: false,
      //TODO: 待确认是否需要此部分逻辑，需要的话方案需更改
      // observer(value) {
      //   if (!value) return
      //   if (this.data.roomListComputed.length) {
      //     let roomSelect = spaceStore.currentSpace?.spaceId

      //     if (this.data.roomListComputed.findIndex((item) => item.spaceId === roomSelect) < 0) {
      //       roomSelect = this.data.roomListComputed[0].spaceId
      //     }

      //     if (this.data.selectList.length) {
      //       let selectItem = { spaceId: '' }
      //       this.data.selectList.forEach((id: string) => {
      //         if (selectItem === undefined || !selectItem.spaceId) {
      //           selectItem = this.data.list.find(
      //             (item: Device.DeviceItem & Scene.SceneItem) => item.sceneId === id || item.uniId === id,
      //           )
      //         }
      //       })

      //       if (selectItem && selectItem.spaceId) {
      //         roomSelect = selectItem.spaceId
      //       } else {
      //         roomSelect = this.data.roomListComputed[0].spaceId
      //       }
      //     }
      //     if (this.data.defaultSpaceId) {
      //       roomSelect = this.data.defaultSpaceId
      //     }
      //     this.setData({
      //       roomSelect,
      //     })
      //   }
      // },
    },
    /** 展示类型：light switch scene sensor*/
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
    // roomListComputed(data) {
    //   const spaceList = [] as Space.SpaceInfo[]
    //   // 从roomList遍历，保证空间顺序， 仅显示list的数据所在的空间列表
    //   spaceStore.spaceList.forEach((space) => {
    //     const isIncludes = data.list.some((item: { spaceId: string }) => {
    //       if (item.spaceId === space.spaceId) {
    //         return true
    //       }
    //       return false
    //     })
    //     if (isIncludes) {
    //       spaceList.push(space)
    //     }
    //   })
    //   return spaceList
    // },
    listComputed(data) {
      if (data.list) {
        return data.list.filter((item: Scene.SceneItem | Device.DeviceItem) => item.spaceId === data.roomSelect)
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
    handleRoomSelect(e: { detail: Space.allSpace[] }) {
      if (!e.detail?.length) {
        return
      }

      this.setData({
        roomSelect: e.detail[e.detail.length - 1].spaceId,
      })
    },
    blank() {},
    clickTitleLeftBtn() {
      this.triggerEvent('clickTitleLeftBtn')
    },
  },
})
