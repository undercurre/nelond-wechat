import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { projectBinding, projectStore, spaceBinding, spaceStore, userBinding } from '../../store/index'
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
    pname: '', // 父空间名称
    plevel: SpaceLevel.undef, // 父层级
    clevel: SpaceLevel.park, // 子层级
    showAddDialog: false,
    isEditMode: false,
    spaceInfo: {
      spaceLevel: SpaceLevel.park,
      spaceName: '',
    } as Space.SpaceInfo,
  },

  computed: {
    subTitle(data) {
      const { sList, pname } = data
      return `${pname.slice(0, 8) || '空间管理'}（${sList?.length ?? 0}）`
    },
    // 如果上级为0，则显示一层的空间列表，否则显示指定的子空间列表
    sList(data) {
      const { plevel, subSpaceList, spaceList } = data
      return plevel === SpaceLevel.undef ? spaceList : subSpaceList
    },
    // 显示空间添加按钮（可添加不同层级）
    showSpaceAdding(data) {
      const { plevel, isManager } = data
      return isManager && plevel === SpaceLevel.undef
    },
    showChildAdding(data) {
      const { plevel, isManager } = data
      return isManager && (plevel === SpaceLevel.park || plevel === SpaceLevel.building || plevel === SpaceLevel.floor)
    },
    showParentAdding(data) {
      const { plevel, pid, allSpaceList, isManager } = data
      if (!isManager) {
        return false
      }
      // 父节点为园区节点，直接返回，不能添加上级
      if (plevel === SpaceLevel.park) {
        return false
      }
      // 找到爷爷节点
      const gNode = allSpaceList?.find((s: Space.allSpace) => s.spaceId === pid)
      return gNode?.pid === '0'
    },
    // 父级按钮名称（实际上为爷爷级）
    spaceParentName(data) {
      const plevel = (data.plevel - 1) as SpaceLevel
      return (SpaceConfig[plevel]?.name ?? '') + '（上级空间）'
    },
    // 子级按钮名称
    spaceChildName(data) {
      const { clevel } = data
      return (SpaceConfig[clevel]?.name ?? '') + '（下级空间）'
    },
    // 当前添加层级名称
    spaceLevelName(data) {
      const { spaceLevel } = data.spaceInfo
      return SpaceConfig[spaceLevel].name
    },
    emptyDesc(data) {
      const { plevel } = data
      return plevel === SpaceLevel.area ? '当前为末级空间' : '尚未添加空间'
    },
    // 显示编辑按钮：管理角色；或者子空间数大于1，即拥有除公共空间外的节点
    showEditBtn(data) {
      const { isManager, sList } = data
      return isManager && sList?.length > 1
    },
  },

  methods: {
    onLoad(query: { pid: string; pname: string; plevel: Space.SpaceLevel }) {
      if (query.pid) {
        this.setData({
          pname: query.pname,
          plevel: Number(query.plevel),
          clevel: Number(query.plevel) + 1,
        })
        this.data.pid = query.pid
      }
    },
    onShow() {
      this.init()
    },

    // 加载本空间列表
    async init() {
      if (this.data.plevel === SpaceLevel.undef) {
        return
      }
      const res = await querySpaceList(projectStore.currentProjectId, this.data.pid)
      if (res.success) {
        this.setData({
          subSpaceList: res.result.map((s) => ({
            ...s,
            pid: this.data.pid, // 填充当前父节点
          })),
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
        'spaceInfo.spaceName': '',
        'spaceInfo.spaceLevel': this.data.plevel - 1, // 需要添加的空间为爷爷级
      })
    },
    async addChildDialog() {
      this.setData({
        showAddDialog: true,
        'spaceInfo.spaceName': '',
        'spaceInfo.spaceLevel': this.data.clevel,
      })
    },
    async toAddSpace(e: { detail: string }) {
      const spaceName = e.detail
      if (!spaceName) {
        Toast({
          message: '空间名称不能为空',
          zIndex: 99999,
        })
        return
      }
      if (spaceName.length > 8) {
        Toast({
          message: '空间名称不能超过8个字符',
          zIndex: 99999,
        })
        return
      }

      this.setData({
        showAddDialog: false,
      })

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
        spaceStore.updateAllSpaceList()
      } else {
        this.goBack()
      }
    },

    // 点击卡片
    handleCardTap(e: WechatMiniprogram.CustomEvent) {
      const { spaceId, spaceName, spaceLevel, publicSpaceFlag } = e.detail

      // 如果是编辑模式
      if (this.data.isEditMode) {
        // 如果是公共空间，则不能编辑
        if (publicSpaceFlag === 1) {
          return
        }
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

      // 如果是区域节点，或者是公共空间，就不用跳转到下一级了
      if ((spaceLevel === SpaceLevel.area && this.data.pid !== '0') || publicSpaceFlag === 1) {
        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/space-manage/index', {
          pid: spaceId,
          pname: spaceName,
          plevel: spaceLevel,
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
