// package-room-control/scene-list/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { deviceStore, homeBinding, homeStore, sceneBinding, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { execScene, updateSceneSort } from '../../apis/scene'
import { storage, emitter, strUtil } from '../../utils/index'
import { defaultImgDir } from '../../config/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [sceneBinding, homeBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    contentHeight: 0,
    isRefresh: false,
    listData: [] as IAnyObject[],
    pageMetaScrollTop: 0,
    scrollTop: 0,
  },

  computed: {},

  lifetimes: {
    ready() {
      sceneStore.updateAllRoomSceneList().then(() => {
        this.updateList()
      })
      emitter.off('sceneEdit')
      emitter.on('sceneEdit', () => {
        sceneStore.updateAllRoomSceneList().then(() => {
          this.updateList()
        })
      })
    },
  },

  methods: {
    onUnload() {
      emitter.off('sceneEdit')
    },

    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },

    updateList() {
      const listData = [] as IAnyObject[]
      const deviceMap = deviceStore.allRoomDeviceMap

      sceneStore.sceneList.forEach((scene: Scene.SceneItem) => {
        let linkName = ''
        if (scene.deviceConditions?.length > 0) {
          const device = deviceMap[scene.deviceConditions[0].deviceId]
          const switchName = device.switchInfoDTOList.find(
            (switchItem) => switchItem.switchId === scene.deviceConditions[0].controlEvent[0].modelName.toString(),
          )?.switchName

          linkName = `${switchName} | ${device.deviceName}`
        }

        listData.push({
          ...scene,
          dragId: scene.sceneId,
          linkName,
          sceneIcon: scene.sceneIcon + '-gray',
        })
      })
      this.setData({
        listData,
      })

      // 防止场景为空，drag为null·
      if (listData.length) {
        const drag = this.selectComponent('#drag')
        drag.init()
      }
    },

    async onPullDownRefresh() {
      try {
        await sceneStore.updateAllRoomSceneList()
      } finally {
        this.setData({
          isRefresh: false,
        })
      }
      wx.stopPullDownRefresh()
    },

    async handleExecScene(e: { detail: Scene.SceneItem }) {
      const res = await execScene(e.detail.sceneId)
      if (res.success) {
        Toast('执行成功')
      } else {
        Toast('执行失败')
      }
    },

    toSetting(e: { detail: Scene.SceneItem }) {
      if (this.data.isCreator || this.data.isAdmin) {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-room-control/scene-edit/index', { sceneId: e.detail.sceneId }),
        })
      } else {
        Toast('您当前身份为访客，无法编辑场景')
      }
    },

    async handleSortEnd(e: { detail: { listData: Scene.SceneItem[] } }) {
      console.log('handleSortEnd', e)
      const sceneSortList = [] as { orderNum: number; sceneId: string }[]
      e.detail.listData.forEach((item, index) => {
        if (item.orderNum != index) {
          sceneSortList.push({
            orderNum: index,
            sceneId: item.sceneId,
          })
        }
      })
      if (sceneSortList.length === 0) {
        return
      }
      await updateSceneSort({ sceneSortList })
      await sceneStore.updateAllRoomSceneList()
      homeStore.updateRoomCardList()
      this.updateList()
    },
  },
})
