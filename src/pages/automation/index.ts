import { storage } from '../../utils/storage'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import {
  autosceneBinding,
  deviceStore,
  projectBinding,
  projectStore,
  sceneBinding,
  sceneStore,
  userBinding,
  userStore,
  // spaceStore,
  // autosceneStore,
} from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { strUtil } from '../../utils/strUtil'
import { execScene, updateSceneSort } from '../../apis/index'
import { emitter } from '../../utils/index'
import { sceneImgDir, defaultImgDir } from '../../config/index'
// import { runInAction } from 'mobx-miniprogram'
// import { reaction } from 'mobx-miniprogram'
// import { emitter } from '../../utils/index'

// pages/login/index.ts
ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [autosceneBinding, userBinding, sceneBinding, projectBinding] }),
    pageBehaviors,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    // 用于存储一键场景列表
    listData: [] as IAnyObject[],
    // 用于存储以时间点为条件触发的自动场景
    // scheduleList:[] as AutoScene.AutoSceneItem[],
    // 用于存储以传感器为条件触发的自动场景
    // autoSceneList:[] as AutoScene.AutoSceneItem[],
    sceneImgDir: sceneImgDir(),
    defaultImgDir: defaultImgDir(),
    hasAutoScene: true,
    // autoSceneList: [] as AutoScene.AutoSceneItem[],

    urls: {
      automationEditYijian: '/package-automation/automation-add/index',
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

    // 可滚动区域高度
    scrollViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      (storage.get<number>('navigationBarHeight') as number) -
      128 * (storage.get<number>('divideRpxByPx') as number),

    tabIndex: 0, // 当前为一键场景/日程/自动场景
    scrollTop: 0,
    currentSpaceQueue: [] as Space.allSpace[],
    currentSpaceId: '',
  },
  computed: {
    tabBarHeight(data) {
      if (data.currentSpaceQueue.length === 4) {
        return 208
      } else {
        return 128
      }
    },
  },
  methods: {
    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },
    onShow() {
      sceneBinding.store.updateAllRoomSceneList().then(() => {
        this.updateList()
      })
      autosceneBinding.store.updateAllRoomAutoSceneList()
      // spaceStore.updateAllSpaceList()
    },
    onLoad() {
      //更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }
      // 监听houseId变化，重新请求对应项目的自动化列表
      // reaction(
      //   () => projectStore.currentHomeDetail.houseId,
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
      // console.log(spaceStore.currentSpace, spaceStore.currentSpaceIndex)

      // 加载一键场景列表
      // sceneBinding.store.updateAllRoomSceneList()
      // 加载自动化列表
      // autosceneBinding.store.updateAllRoomAutoSceneList()
    },
    // onShow() {
    //   this.setData({
    //     currentSpaceId: spaceStore.currentSpace.spaceId,
    //   })
    // },
    // onUnload() {
    //   emitter.off('scene_add')
    //   emitter.off('scene_del')
    //   emitter.off('scene_upt')
    //   emitter.off('scene_enabled')
    // },
    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      if (e.currentTarget.dataset.url.includes('automation-add/index') && !userStore.isManager) {
        Toast('您当前身份为项目使用者，无法创建场景')
        return
      }
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },
    // updateScheduleList(){
    //   this.setData({
    //     scheduleList:autosceneStore.allRoomAutoSceneListComputed.filter((scene) => scene.timeConditions[0].time !== '')
    //   })
    // },
    // updateAutoSceneList(){
    //   this.setData({
    //     autoSceneList:autosceneStore.allRoomAutoSceneListComputed.filter((scene) => scene.timeConditions[0].time === '')
    //   })
    // },
    updateList() {
      if (this.data.currentSpaceId === '') {
        return
      }
      const listData = [] as IAnyObject[]
      const deviceMap = deviceStore.allDeviceMap

      sceneStore.allRoomSceneList
        .filter((item) => item.spaceId === this.data.currentSpaceId && item.sceneCategory === '0')
        .forEach((scene: Scene.SceneItem) => {
          let linkName = ''
          if (scene.deviceConditions?.length > 0) {
            const device = deviceMap[scene.deviceConditions[0].deviceId]
            const switchName =
              device.switchInfoDTOList.find(
                (switchItem) => switchItem.switchId === scene.deviceConditions[0].controlEvent[0].modelName.toString(),
              )?.switchName ?? ''

            const { deviceName } = device
            if (switchName.length + deviceName.length > 12) {
              linkName =
                switchName.slice(0, 4) +
                '...' +
                switchName.slice(-2) +
                '|' +
                deviceName.slice(0, 2) +
                '...' +
                deviceName.slice(-2)
            } else {
              linkName = `${switchName} | ${deviceName}`
            }
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

    toEditYijianScene(e: { detail: Scene.SceneItem }) {
      if (userStore.isManager) {
        wx.navigateTo({
          url: strUtil.getUrlWithParams(this.data.urls.automationEditYijian, {
            yijianSceneId: e.detail.sceneId,
            selectedSpaceInfo: JSON.stringify(this.data.currentSpaceQueue),
            spaceid: this.data.currentSpaceId,
          }),
        })
      } else {
        Toast('您当前身份为项目使用者，无法编辑场景')
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
      projectStore.updateSpaceCardList()
      this.updateList()
    },

    changeAutoSceneEnabled(e: { currentTarget: { dataset: { isenabled: '0' | '1'; sceneid: string } } }) {
      if (!userStore.isManager) {
        Toast('您当前身份为项目使用者，无法编辑场景')
        return
      }
      const { isenabled, sceneid } = e.currentTarget.dataset
      const isEnabled = isenabled === '0' ? '1' : '0'
      autosceneBinding.store.changeAutoSceneEnabled({ sceneId: sceneid, isEnabled })
    },
    toEditAutoScene(e: { currentTarget: { dataset: { autosceneid: string } } }) {
      if (userStore.isManager) {
        const { autosceneid } = e.currentTarget.dataset
        wx.navigateTo({
          url: strUtil.getUrlWithParams(this.data.urls.automationAdd, { autosceneid }),
        })
      } else {
        Toast('您当前身份为项目使用者，无法编辑场景')
      }
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
    onSpaceSelect(e: { detail: Space.allSpace[] }) {
      console.log('onSpaceSelect', e.detail)
      this.setData({
        currentSpaceQueue: e.detail,
        currentSpaceId: e.detail[e.detail.length - 1]?.spaceId,
      })
      this.updateList()
    },
  },
  lifetimes: {
    ready() {
      // this.setData({
      //   currentSpaceId: spaceStore.currentSpace.spaceId,
      // })
      // this.updateList()
      // 加载自动化列表
      // autosceneBinding.store.updateAllRoomAutoSceneList().then(() => {
      //   // this.updateScheduleList()
      //   // this.updateAutoSceneList()
      // })
      // 加载一键场景列表
      // sceneBinding.store.updateAllRoomSceneList().then(() => {
      //   this.updateList()
      // })
      emitter.off('sceneEdit')
      emitter.on('sceneEdit', () => {
        sceneStore.updateAllRoomSceneList().then(() => {
          this.updateList()
        })
      })
    },
  },
})
