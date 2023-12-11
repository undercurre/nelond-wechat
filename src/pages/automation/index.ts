import { storage } from '../../utils/storage'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import {
  autosceneBinding,
  deviceStore,
  homeBinding,
  homeStore,
  roomStore,
  sceneBinding,
  sceneStore,
  userBinding,
} from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { strUtil } from '../../utils/strUtil'
import { execScene, updateSceneSort } from '../../apis/index'
import { emitter } from '../../utils/index'
import { sceneImgDir, defaultImgDir } from '../../config/index'
// import { reaction } from 'mobx-miniprogram'
// import { emitter } from '../../utils/index'

// pages/login/index.ts
ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [autosceneBinding, userBinding, sceneBinding, homeBinding] }),
    pageBehaviors,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    // 用于存储一键场景列表
    listData: [] as IAnyObject[],
    sceneImgDir,
    defaultImgDir,
    hasAutoScene: true,
    // autoSceneList: [] as AutoScene.AutoSceneItem[],

    urls: {
      automationEditYijian: '/package-automation/automation-edit-yijian/index',
      automationLog: '/package-automation/automation-log/index',
      automationAdd: '/package-automation/automation-add/index',
    },
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    tabClientTop:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      31 +
      32 +
      'px',

    tabIndex: 0, // 当前为一键场景/日程/自动场景
    active: '',
    scrollTop: 0,
    selectedRoomId: '',
  },
  computed: {
    roomTab() {
      const tempRoomList = roomStore.roomList.map((item) => {
        return {
          roomId: item.roomId,
          roomName: item.roomName,
        }
      })
      return tempRoomList
    },
  },
  methods: {
    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },
    onYijianRoomChange(event: { detail: { name: string } }) {
      this.data.selectedRoomId = event.detail.name
      this.setData({
        selectedRoomId: event.detail.name,
      })
      this.updateList()
    },
    onLoad() {
      //更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }
      // 监听houseId变化，重新请求对应家庭的自动化列表
      // reaction(
      //   () => homeStore.currentHomeDetail.houseId,
      //   () => {
      //     autosceneBinding.store.updateAllRoomAutoSceneList()
      //   },
      // )
      // emitter.on('scene_add', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // emitter.on('scene_del', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // emitter.on('scene_upt', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // emitter.on('scene_enabled', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      console.log(roomStore.currentRoom, roomStore.currentRoomIndex)

      // 加载一键场景列表
      sceneBinding.store.updateAllRoomSceneList()
      // 加载自动化列表
      autosceneBinding.store.updateAllRoomAutoSceneList()
    },
    // onShow() {
    //   this.setData({
    //     selectedRoomId: roomStore.currentRoom.roomId,
    //     active: roomStore.currentRoomIndex,
    //   })
    // },
    // onUnload() {
    //   emitter.off('scene_add')
    //   emitter.off('scene_del')
    //   emitter.off('scene_upt')
    //   emitter.off('scene_enabled')
    // },
    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },

    updateList() {
      if (this.data.selectedRoomId === '') {
        this.data.selectedRoomId = roomStore.roomList[0].roomId
      }
      const listData = [] as IAnyObject[]
      const deviceMap = deviceStore.allRoomDeviceMap

      sceneStore.allRoomSceneList
        .filter((item) => item.roomId === this.data.selectedRoomId)
        .forEach((scene: Scene.SceneItem) => {
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
            sceneIcon: scene.sceneIcon,
          })
        })
      this.setData({
        listData,
      })

      // 防止场景为空，drag为null·
      if (listData.length) {
        const drag = this.selectComponent('#yijian')
        if (drag) drag.init()
      }
    },

    async execYijianScene(e: { detail: Scene.SceneItem }) {
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
          url: strUtil.getUrlWithParams(this.data.urls.automationEditYijian, { yijianSceneId: e.detail.sceneId }),
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

    changeAutoSceneEnabled(e: { currentTarget: { dataset: { isenabled: '0' | '1'; sceneid: string } } }) {
      const { isenabled, sceneid } = e.currentTarget.dataset
      const isEnabled = isenabled === '0' ? '1' : '0'
      autosceneBinding.store.changeAutoSceneEnabled({ sceneId: sceneid, isEnabled })
    },
    toEditAutoScene(e: { currentTarget: { dataset: { autosceneid: string } } }) {
      const { autosceneid } = e.currentTarget.dataset

      wx.navigateTo({
        url: strUtil.getUrlWithParams(this.data.urls.automationAdd, { autosceneid }),
      })
    },
    toEditYijianScene(e: { currentTarget: { dataset: { sceneid: string } } }) {
      const { sceneid } = e.currentTarget.dataset

      wx.navigateTo({
        url: strUtil.getUrlWithParams(this.data.urls.automationEditYijian, { yijianSceneId: sceneid }),
      })
    },
    //阻止事件冒泡
    stopPropagation() {},

    // 场景类型变更
    handleSceneType(e: { detail: { checkedIndex: number } }) {
      this.setData({
        tabIndex: e.detail.checkedIndex,
      })
      // this.setData({
      //   // 修改switch标记
      //   isYijian: !this.data.isYijian,
      // })
      this.updateList()
    },
    onUnload() {
      emitter.off('sceneEdit')
    },
  },
  lifetimes: {
    ready() {
      this.setData({
        selectedRoomId: roomStore.currentRoom.roomId,
        active: roomStore.currentRoom.roomId,
      })
      this.updateList()
      sceneBinding.store.updateAllRoomSceneList().then(() => {
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
})