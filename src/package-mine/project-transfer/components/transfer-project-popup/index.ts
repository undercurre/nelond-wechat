// package-mine/project-manage/components/transfer-project/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { projectBinding, projectStore } from '../../../../store/index'
import { changeUserHouse, queryHouseUserList } from '../../../../apis/index'
import { emitter, goHome } from '../../../../utils/index'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { defaultImgDir } from '../../../../config/index'

Component({
  options: {},

  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    defaultImgDir,
    selectIndex: -1,
    userList: [] as Project.HouseUserItem[],
  },

  lifetimes: {
    async attached() {
      await this.queryHomeUsers()

      emitter.on('homeInfoEdit', () => {
        this.queryHomeUsers()
      })
    },
    detached() {
      emitter.off('homeInfoEdit')
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async queryHomeUsers() {
      const res = await queryHouseUserList({ projectId: projectBinding.store.currentProjectId })
      if (res.success) {
        this.setData({
          userList: res.result.houseUserList.filter((item) => item.userHouseAuth !== 1), // 过滤创建者，不能转让给自己
          selectIndex: -1, // 清空选择记录
        })
      }
    },
    selectUser(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      this.setData({
        selectIndex: index,
      })
    },

    close() {
      this.triggerEvent('close')
    },

    /*
     * 确认转让项目
     * 需要二次确认
     * 转让角色后同时退出项目
     **/
    async handleConfirm() {
      this.triggerEvent('close')

      const dialog = await Dialog.confirm({
        title: '是否转让当前项目',
        context: this,
      }).catch(() => 'cancel')
      if (dialog === 'cancel') return

      const item = this.data.userList[this.data.selectIndex]

      const changeRes = await changeUserHouse({
        type: 1,
        projectId: projectBinding.store.currentProjectId,
        changeUserId: item.userId,
      })

      if (!changeRes.success) {
        Toast('转让失败')
        return
      } else {
        projectStore.updateProjectInfo()

        Toast({
          message: '转让成功',
          onClose: () => {
            goHome()
          },
        })
      }
    },
  },
})
