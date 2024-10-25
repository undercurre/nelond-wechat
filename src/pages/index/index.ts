import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  othersBinding,
  spaceBinding,
  userBinding,
  projectStore,
  projectBinding,
  othersStore,
  spaceStore,
} from '../../store/index'
import { storage, strUtil } from '../../utils/index'
import { ossDomain } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, spaceBinding, userBinding, projectBinding] }),
    pageBehavior,
  ],
  data: {
    ossDomain,
    navigationBarAndStatusBarHeight:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    // 状态栏高度
    statusBarHeight: storage.get('statusBarHeight') + 'px',
    // 可滚动区域高度
    scrollViewHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      90 - // 开关、添加按钮
      (storage.get('navigationBarHeight') as number),
    _system: storage.get('system') as string,
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    addMenu: {
      right: '0px',
      y: '0px',
      isShow: false,
    },
    allOnBtnTap: false,
    allOffBtnTap: false,
    showAddNewRoom: false,
    showHomeSelect: false,
    loading: true,
    _isFirstShow: true, // 是否首次加载
    _from: '', // 页面进入来源
  },
  computed: {
    // 项目是否有内容
    hasDevice(data) {
      return data.userInfo?.roleList?.length && data.projectList?.length
    },
  },
  watch: {
    isInit(data) {
      // 如果已初始化，但仍在loading
      if (this.data.loading && data) {
        this.setData({ loading: !data })
      }
    },
  },

  methods: {
    // 生命周期或者其他钩子
    onLoad(query: { from?: string }) {
      this.data._from = query.from ?? ''
      // 更新tabbar状态
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0,
        })
      }
      if (othersStore.isInit) {
        this.setData({
          loading: false,
        })
      }
    },
    onHide() {
      // 隐藏之前展示的下拉菜单
      this.hideMenu()
    },
    async onShow() {
      // 回到首页，清空之前选择过的空间记录
      spaceStore.setCurrentSpace()

      if (!this.data._isFirstShow) {
        projectStore.updateSpaceCardList()
      }
      this.data._isFirstShow = false

      if (!othersStore.isInit) {
        this.setData({
          loading: true,
        })
      }
    },
    onReady() {
      this.checkUpdate()
    },

    checkUpdate() {
      const updateManager = wx.getUpdateManager()

      updateManager.onUpdateReady(function () {
        Dialog.confirm({
          title: '更新提示',
          message: '新版本已经准备好，是否重启应用？',
          confirmButtonText: '马上重启',
        })
          .then(() => updateManager.applyUpdate())
          .catch(() => {})
      })
    },

    // 收起所有菜单
    hideMenu() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
    },

    /**
     * 用户切换项目
     */
    handleHomeSelect() {
      this.setData({
        'selectHomeMenu.isShow': false,
        'addMenu.isShow': false,
      })
    },
    /**
     * 用户点击展示/隐藏项目选择
     */
    handleShowHomeSelectMenu() {
      const diffData = {} as IAnyObject
      diffData.selectHomeMenu = {
        x: '28rpx',
        y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 8 + 'px',
        isShow: !this.data.selectHomeMenu.isShow,
      }

      // 关闭已打开的其他菜单
      if (!this.data.selectHomeMenu.isShow && this.data.addMenu.isShow) {
        diffData['addMenu.isShow'] = false
      }

      this.setData(diffData)
    },
    /**
     * 隐藏添加空间popup
     */
    handleHideAddNewRoom() {
      this.setData({
        showAddNewRoom: false,
      })
    },

    showAddMenu() {
      this.setData({
        addMenu: {
          right: '25rpx',
          y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 50 + 'px',
          isShow: !this.data.addMenu.isShow,
        },
        'selectHomeMenu.isShow': false,
      })
    },

    // 点击卡片
    handleCardTap(e: { detail: Space.SpaceInfo }) {
      const { spaceId, nodeCount, spaceName, spaceLevel, publicSpaceFlag } = e.detail

      // 子公共空间
      const childPublicSpace = spaceStore.allSpaceList.find((s) => s.pid === spaceId && s.publicSpaceFlag === 1)

      // 有且仅有1个公共子空间
      const hasOnlyPublicChild = nodeCount === 1 && childPublicSpace

      // 无子空间，或者只有一个子公共空间，进入设备页；否则进入下级空间列表页
      const link =
        hasOnlyPublicChild || !nodeCount
          ? '/package-space-control/index/index'
          : '/package-space-control/space-list/index'

      if (hasOnlyPublicChild || !nodeCount) {
        runInAction(() => {
          // 如果只有一个子空间，且该空间为公共空间，则同时push公共空间
          if (hasOnlyPublicChild) {
            spaceStore.setCurrentSpace(childPublicSpace.spaceId)
          } else {
            spaceStore.setCurrentSpace(spaceId)
          }
        })
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams(link, {
          pid: spaceId,
          pname: publicSpaceFlag === 1 ? this.data.pname : spaceName,
          plevel: spaceLevel,
        }),
      })
    },
  },
})
