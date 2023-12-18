import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { projectBinding, spaceBinding, userBinding, userStore } from '../../store/index'
import { emitter, getCurrentPageParams } from '../../utils/index'
import { delSpace, updateSpace } from '../../apis/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    editType: '',
    spaceInfo: {
      spaceId: '',
      spaceName: '',
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
        },
      })
    },
  },

  methods: {
    editSpace() {
      if (!userStore.isManager) {
        return
      }

      this.setData({
        isEdit: true,
      })
    },
    async toUpdateSpace(e: { detail: string }) {
      this.setData({
        spaceName: e.detail,
      })
    },

    async saveSpaceInfo() {
      const { spaceId, spaceName } = this.data.spaceInfo
      if (!spaceName) {
        return
      }
      const res = await updateSpace({
        spaceId,
        spaceName,
      })

      if (res.success) {
        // TODO 优化返回后更新
        spaceBinding.store.updateSpaceList()
        emitter.emit('projectInfoEdit')
        this.goBack()
      } else {
        Toast('保存失败')
      }
    },

    async delSpace() {
      // 由于顶层空间分不同级别，故此限制应该去掉
      // if (spaceBinding.store.spaceList.length === 1) {
      //   Toast('请至少保留一个空间')
      //   return
      // }

      const dialogRes = await Dialog.confirm({
        title: '确定删除该空间？',
      }).catch(() => {
        return 'cancel'
      })

      if (dialogRes === 'cancel') {
        return
      }

      const res = await delSpace(this.data.spaceInfo.spaceId)

      if (res.success) {
        spaceBinding.store.updateSpaceList()
        emitter.emit('projectInfoEdit')

        wx.navigateBack()
      } else {
        Toast(res.msg)
      }
    },
  },
})
