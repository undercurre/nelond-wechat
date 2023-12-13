import {
  setNavigationBarAndBottomBarHeight,
  // startWebsocketService,
  closeWebSocket,
  setCurrentEnv,
  Logger,
  isConnect,
  initHomeOs,
  networkStatusListen,
  removeNetworkStatusListen,
  verifyNetwork,
  isLogined,
  getCurrentPageUrl,
} from './utils/index'
import svgs from './assets/svg/index'
import { deviceStore, projectStore, othersStore, userStore } from './store/index'
import { reaction } from 'mobx-miniprogram'
import homOs from 'js-homos'
import mqtt from './lib/mqtt.min.js' // 暂时只能使用4.2.1版本，高版本有bug，判断错运行环境

// TODO 统一配置和管理 storage key
App<IAppOption>({
  async onLaunch() {
    // 加载svg数据
    this.globalData.svgs = svgs

    // 设备运行环境
    setCurrentEnv()

    // 获取状态栏、顶部栏、底部栏高度
    setNavigationBarAndBottomBarHeight()

    homOs.init({ mqttLib: mqtt, isDebug: true })

    // 如果用户已经登录，开始请求数据[用户][项目列表、全屋空间、全屋设备]
    if (isLogined()) {
      try {
        userStore.setIsLogin(true)
        const start = Date.now()
        console.log('开始时间', start / 1000)
        await Promise.all([userStore.updateUserInfo(), projectStore.spaceInit()])
        console.log('加载完成时间', Date.now() / 1000, '用时', (Date.now() - start) / 1000 + 's')
      } catch (e) {
        Logger.error('appOnLaunch-err:', e)
      }
    } else {
      othersStore.setIsInit(false)
    }

    // 监听houseId变化，切换websocket连接,切换成对应项目的sock连接
    reaction(
      () => projectStore.currentProjectDetail.projectId,
      async () => {
        // closeWebSocket()
        // startWebsocketService()
        // await projectStore.updateLocalKey()
        // initHomeOs()
      },
    )

    // 监听内存不足告警事件
    wx.onMemoryWarning(function () {
      Logger.debug('onMemoryWarningReceive')
    })
  },

  async onShow() {
    // 监听网络状态
    networkStatusListen()
    await verifyNetwork() // 可能网络状态会不变更，先主动查一次

    const { firstOnShow } = this.globalData
    this.globalData.firstOnShow = false

    // 用户热启动app，建立ws连接，并且再更新一次数据
    Logger.log('app-onShow, isConnect:', isConnect(), 'isLogined', isLogined())

    // 非登录状态，终止下面逻辑，且发现当前非主包页面（当前主包页面均可不需要登录访问），强制跳转登录
    if (!isLogined()) {
      return
    }

    initHomeOs()

    if (!isConnect()) {
      return
    }

    // 以下逻辑需要网络连接
    // startWebsocketService()

    // 首次进入有onLaunch不必加载
    // homOS本地控制要求场景数据保持尽可能实时，需要小程序回到前台刷新场景和设备列表数据
    if (!firstOnShow) {
      deviceStore.updateallDeviceList(projectStore.currentProjectId, { isDefaultErrorTips: false })
      projectStore.updateProjectInfo({ isDefaultErrorTips: false })
    }

    // 全屋场景数据加载
    // sceneStore.updateAllRoomSceneList(projectStore.currentProjectId, { isDefaultErrorTips: false })
  },

  onHide() {
    Logger.log('app-onHide')
    // 用户最小化app，断开ws连接
    closeWebSocket()

    // 退出HomOS sdk登录态，断开局域网连接
    homOs.logout()

    // 取消监听网络状态
    removeNetworkStatusListen()
  },

  onError(msg: string) {
    const pageUrl = getCurrentPageUrl()

    Logger.error(`【${pageUrl}】app-onError`, msg)
  },

  globalData: {
    firstOnShow: true,
  },
})
