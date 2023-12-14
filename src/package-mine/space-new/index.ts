import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { SpaceConfig, SpaceLevel } from '../../config/index'
import { addSpace } from '../../apis/index'
import { projectStore } from '../../store/index'

ComponentWithComputed({
  options: {},
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    SpaceConfig,
    spaceInfo: {
      spaceLevel: SpaceLevel.park,
      spaceName: '',
    } as Space.SpaceInfo,
  },

  computed: {
    spaceLevelList() {
      return Object.keys(SpaceConfig).map((spaceLevel) => ({
        ...SpaceConfig[spaceLevel as unknown as Space.SpaceLevel],
        spaceLevel,
      }))
    },
    spaceLevelName(data) {
      const { spaceLevel } = data.spaceInfo
      return SpaceConfig[spaceLevel].name
    },
  },

  lifetimes: {
    attached() {},
  },

  methods: {
    selectLevel(e: WechatMiniprogram.CustomEvent) {
      const { type } = e.currentTarget.dataset
      if (type !== this.data.checkedLevel) {
        this.setData({
          'spaceInfo.spaceLevel': type,
        })
      }
    },
    changeName(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        'spaceInfo.spaceName': e.detail,
      })
    },
    async toAddSpace() {
      const { spaceLevel, spaceName } = this.data.spaceInfo
      const res = await addSpace({
        projectId: projectStore.currentProjectId,
        pid: '0',
        spaceLevel,
        spaceName,
      })
      if (!res.success) {
        Toast({ message: '新增失败', zIndex: 9999 })
        return
      }

      // 刷新数据 // TODO 解耦空间和设备的更新方法
      await projectStore.updateSpaceCardList()

      this.goBack()
    },
  },
})
