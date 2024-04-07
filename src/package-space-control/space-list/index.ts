import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction, toJS } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { othersBinding, spaceBinding, userBinding, spaceStore, projectStore, projectBinding } from '../../store/index'
import { storage, strUtil } from '../../utils/index'
import { SpaceConfig, SpaceLevel, defaultImgDir } from '../../config/index'
import { querySpaceList } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, spaceBinding, userBinding, projectBinding] }),
    pageBehavior,
  ],
  data: {
    title: '',
    subTitle: '',
    subSpaceList: [] as Space.SpaceInfo[],
    pid: '0',
    plevel: SpaceLevel.undef, // 父层级
    pname: '',
    defaultImgDir,
    navigationBarAndStatusBarHeight:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    // 状态栏高度
    statusBarHeight: storage.get('statusBarHeight') + 'px',
    // 可滚动区域高度
    scrollViewHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('navigationBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      90 + // 开关、添加按钮
      'px',
    _system: storage.get('system') as string,
    loading: true,
    _scrolledWhenMoving: false, // 拖拽时，被动发生了滚动
    _isFirstShow: true, // 是否首次加载
    _from: '', // 页面进入来源
  },
  computed: {},
  methods: {
    // 生命周期或者其他钩子
    async onLoad(query: { pid: string; pname: string; plevel: Space.SpaceLevel }) {
      if (query.pname && query.plevel) {
        this.setData({
          title: query.pname,
          subTitle: SpaceConfig[query.plevel].name,
        })
        this.data.pid = query.pid
        this.data.plevel = query.plevel
        this.data.pname = query.pname
      }
      // 加载本空间列表。只要有兄弟节点就显示公共空间
      const res = await querySpaceList(projectStore.currentProjectId, query.pid, { loading: true })
      if (res.success) {
        const hasSibling = res.result?.length > 1
        this.setData({
          subSpaceList: res.result.filter((space) => space.publicSpaceFlag !== 1 || hasSibling),
        })
      }
    },
    onShow() {
      console.log('onShow', toJS(spaceStore.currentSpaceSelect))
    },
    onUnload() {
      runInAction(() => spaceStore.currentSpaceSelect.pop())
    },

    goToSpaceManage() {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/space-manage/index', {
          pid: this.data.pid,
          pname: this.data.pname,
          plevel: this.data.plevel,
        }),
      })
    },

    // 点击卡片
    handleCardTap(e: { detail: Space.SpaceInfo }) {
      const { spaceId, nodeCount, spaceName, spaceLevel, publicSpaceFlag } = e.detail

      // 只少于等于一个子空间，则进入设备列表页；否则进入下级空间列表页
      const link = nodeCount < 2 ? '/package-space-control/index/index' : '/package-space-control/space-list/index'
      const childPublicSpace = spaceStore.allSpaceList.find((s) => s.pid === spaceId && s.publicSpaceFlag === 1)

      // 更新当前选中空间
      const hasOnlyChildren = nodeCount === 1 // 有且仅有1个下级空间
      runInAction(() => {
        spaceStore.currentSpaceSelect.push({
          ...e.detail,
          pid: this.data.pid,
        })
        spaceStore.setCurrentSpaceTemp({
          ...e.detail,
          pid: this.data.pid,
        } as Space.SpaceInfo)

        // 如果只有一个子空间，且该空间为公共空间，则同时push公共空间
        if (hasOnlyChildren && childPublicSpace) {
          spaceStore.currentSpaceSelect.push(childPublicSpace)
          spaceStore.setCurrentSpaceTemp(childPublicSpace as unknown as Space.SpaceInfo)
        }
      })

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
