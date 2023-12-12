import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, roomBinding } from '../../store/index'
import { emitter, getCurrentPageParams } from '../../utils/index'
import { delHouseRoom, saveHouseRoomInfo } from '../../apis/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    editType: '',
    spaceInfo: {
      spaceId: '',
      spaceName: '',
      roomIcon: '',
    },
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready() {
      const pageParams = getCurrentPageParams()

      console.log('pageParams', pageParams)

      this.setData({
        spaceInfo: {
          spaceId: pageParams.spaceId,
          spaceName: pageParams.spaceName,
          roomIcon: pageParams.roomIcon,
        },
      })
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    editRoom(event: WechatMiniprogram.CustomEvent) {
      if (!homeBinding.store.isManager) {
        return
      }

      const { type } = event.currentTarget.dataset

      this.setData({
        isEdit: true,
        editType: type,
      })
    },
    onClose() {
      this.setData({
        isEdit: false,
      })
    },

    finishAddRoom(event: WechatMiniprogram.CustomEvent) {
      this.setData({
        isEdit: false,
        spaceInfo: {
          spaceId: event.detail.spaceId,
          spaceName: event.detail.spaceName,
          roomIcon: event.detail.roomIcon,
        },
      })
    },

    async saveRoomInfo() {
      const res = await saveHouseRoomInfo({
        projectId: homeBinding.store.currentProjectId,
        spaceId: this.data.spaceInfo.spaceId,
        roomIcon: this.data.spaceInfo.roomIcon,
        spaceName: this.data.spaceInfo.spaceName,
      })

      if (res.success) {
        roomBinding.store.updateSpaceList()
        emitter.emit('homeInfoEdit')
        this.goBack()
      } else {
        Toast('保存失败')
      }
    },

    async delRoom() {
      if (roomBinding.store.roomList.length === 1) {
        Toast('请至少保留一个房间')
        return
      }

      const dialogRes = await Dialog.confirm({
        title: '确定删除该房间？',
      }).catch(() => {
        return 'cancel'
      })

      console.log('dialogRes', dialogRes)

      if (dialogRes === 'cancel') {
        return
      }

      const res = await delHouseRoom(this.data.spaceInfo.spaceId)

      if (res.success) {
        roomBinding.store.updateSpaceList()
        emitter.emit('homeInfoEdit')

        wx.navigateBack()
      } else {
        Toast(res.msg)
      }
    },
  },
})
