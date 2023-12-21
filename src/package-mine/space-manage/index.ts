import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { projectBinding, projectStore, spaceBinding, userBinding } from '../../store/index'
import { strUtil } from '../../utils/index'
import { SpaceConfig, SpaceLevel, defaultImgDir } from '../../config/index'
import { addSpace, querySpaceList } from '../../apis/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    subSpaceList: [] as Space.SpaceInfo[],
    pid: '0',
    plevel: SpaceLevel.undef, // 父层级
    clevel: SpaceLevel.park, // 子层级
    rootAsGrandpa: false, // 爷爷节点即根节点
    showAddDialog: false,
    isEditMode: false,
    spaceInfo: {
      spaceLevel: SpaceLevel.park,
      spaceName: '',
    } as Space.SpaceInfo,
  },

  computed: {
    subTitle(data) {
      const { sList, plevel } = data
      return `${SpaceConfig[plevel]?.name ?? '空间'}管理（${sList?.length ?? 0}）`
    },
    sList(data) {
      const { plevel, subSpaceList, spaceList } = data
      return plevel === SpaceLevel.undef ? spaceList : subSpaceList
    },
    showParkAdding(data) {
      const { plevel } = data
      console.log('plevel', plevel)
      return plevel === SpaceLevel.undef
    },
    showChildAdding(data) {
      const { plevel } = data
      return plevel !== SpaceLevel.undef
    },
    showParentAdding(data) {
      const { clevel, rootAsGrandpa } = data
      return rootAsGrandpa === true && (clevel === SpaceLevel.floor || clevel === SpaceLevel.area)
    },
    // 父级按钮名称（实际上为爷爷级）
    spaceParentName(data) {
      const plevel = (data.plevel - 1) as SpaceLevel
      return SpaceConfig[plevel]?.name ?? ''
    },
    // 子级按钮名称
    spaceChildName(data) {
      const { clevel } = data
      return SpaceConfig[clevel]?.name ?? ''
    },
    // 当前添加层级名称
    spaceLevelName(data) {
      const { spaceLevel } = data.spaceInfo
      return SpaceConfig[spaceLevel].name
    },
  },

  methods: {
    onLoad(query: { pid: string; pname: string; plevel: Space.SpaceLevel; rootAsGrandpa: string }) {
      if (query.pid) {
        this.setData({
          plevel: Number(query.plevel),
          clevel: Number(query.plevel) + 1,
          rootAsGrandpa: query.rootAsGrandpa === 'true',
        })
        this.data.pid = query.pid
      }
    },
    onShow() {
      this.init()
    },

    // 加载本空间列表
    async init() {
      const res = await querySpaceList(projectStore.currentProjectId, this.data.pid)
      if (res.success) {
        this.setData({
          subSpaceList: res.result,
        })
      }
    },
    editRoom(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = spaceBinding.store.spaceList[index]

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/space-detail/index', {
          spaceId: item.spaceId,
          spaceName: item.spaceName,
          // roomIcon: item.roomIcon,
        }),
      })
    },

    addSpacePage() {
      if (spaceBinding.store.spaceList.length >= 50) {
        Toast('一个项目中最多创建50个空间')
        return
      }

      wx.navigateTo({
        url: '/package-mine/space-new/index',
      })
    },

    onClose() {
      this.setData({
        showAddDialog: false,
      })
    },
    async addParentDialog() {
      this.setData({
        showAddDialog: true,
        'spaceInfo.spaceLevel': this.data.plevel - 1, // 需要添加的空间为爷爷级
      })
    },
    async addChildDialog() {
      this.setData({
        showAddDialog: true,
        'spaceInfo.spaceLevel': this.data.clevel,
      })
    },
    async toAddSpace(e: { detail: string }) {
      const spaceName = e.detail
      if (!spaceName) {
        return
      }
      const { spaceLevel } = this.data.spaceInfo
      const isCreateChild = spaceLevel === this.data.clevel
      const res = await addSpace({
        projectId: projectStore.currentProjectId,
        pid: this.data.pid,
        cid: isCreateChild ? '0' : '1',
        spaceName,
        spaceLevel,
      })
      if (!res.success) {
        Toast({ message: '新增失败', zIndex: 9999 })
        return
      }

      if (isCreateChild) {
        this.init()
      } else {
        this.goBack()
      }
    },

    // 点击卡片
    handleCardTap(e: WechatMiniprogram.CustomEvent) {
      const { spaceId, spaceName, spaceLevel } = e.detail

      // 如果是编辑模式
      if (this.data.isEditMode) {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-mine/space-detail/index', {
            spaceId,
            spaceName,
          }),
        })
        // 重置为非编辑模式
        this.setData({
          isEditMode: false,
        })
        return
      }

      // 如果是区域节点，就不用跳转到下一级了
      if (spaceLevel === SpaceLevel.area) {
        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/space-manage/index', {
          pid: spaceId,
          pname: spaceName,
          plevel: spaceLevel,
          rootAsGrandpa: this.data.pid === '0',
        }),
      })
    },

    toEditMode() {
      this.setData({
        isEditMode: !this.data.isEditMode,
      })
    },
  },
})
