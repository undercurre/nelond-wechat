// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { projectBinding, userBinding } from '../../store/index'
import { storage } from '../../utils/storage'
import { emitter } from '../../utils/eventBus'
import { ShareImgUrl } from '../../config/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditRole: false,
    memberList: [] as object[],
    actionList: [
      {
        key: 'SET_ADMIN',
        text: '设为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'CEL_ADMIN',
        text: '取消管理员',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'DEL_MEM',
        text: '移除该成员',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'BE_MEM',
        text: '成为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'BE_VIS',
        text: '成为访客',
        label: '仅可使用设备与场景',
        isCheck: false,
        isShow: false,
      },
    ],
    curClickUserItem: null as any,
    curOptionItem: null as any,
    curUser: { userHouseAuth: 3 } as Project.UserItem,
    isNeedShare: false,
    isAdmin: false,
    isVisitor: false,
    popupTitle: '权限管理',
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {
      this.initData()

      emitter.on('invite_user_house', () => {
        this.initData()
      })
    },
    moved: function () {},
    detached: function () {
      emitter.off('invite_user_house')
    },
  },

  methods: {
    async initData() {
      await projectBinding.store.updateHomeMemberList()
      this.updateView()
    },
    updateView() {
      if (projectBinding.store.userList.length === 0) return
      const curUserName = userBinding.store.userInfo.userName
      const result: object[] = []
      const list = projectBinding.store.userList.sort((a, b) => {
        return a.userHouseAuth - b.userHouseAuth
      })
      if (list) {
        const curUser = list.find((item: Project.UserItem) => {
          return item.userName === curUserName
        })
        if (curUser) {
          result.push({
            icon: curUser.headImageUrl,
            iconText: curUser.userName.slice(0, 1),
            name: curUser.userName,
            role: curUser.roleName,
            id: curUser.userId,
            roleCode: curUser.userHouseAuth,
            isCanEdit: false,
          })
          this.setData({
            curUser: curUser,
            isAdmin: curUser.userHouseAuth === 2,
            isVisitor: curUser.userHouseAuth === 3,
          })
        }
        list.forEach((item: Project.UserItem) => {
          if (curUser?.userId !== item.userId) {
            const isCanEdit = this.canIEditOther(curUser?.userHouseAuth, item.userHouseAuth)
            result.push({
              icon: item.headImageUrl,
              iconText: item.userName.slice(0, 1),
              name: item.userName,
              role: item.roleName,
              id: item.userId,
              roleCode: item.userHouseAuth,
              isCanEdit: isCanEdit,
            })
          }
        })
        this.setData({ memberList: result })
      }
    },
    canIEditOther(mySelf = 0, other: number) {
      //创建者：1 管理员：2 游客：3
      if (mySelf === other) return false
      if (mySelf === 1) return true
      return false
    },
    onUserItemClick(data: any) {
      const item = data.currentTarget.dataset.item
      if (!item.isCanEdit) return
      this.configPopupRoleOption(this.data.curUser.userHouseAuth, item.roleCode)
      this.setData({
        isEditRole: true,
        curClickUserItem: item,
        isNeedShare: false,
      })
    },
    configPopupRoleOption(mySelf: number, other: number) {
      //创建者：1 管理员：2 游客：3
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        if (mySelf === 1) {
          if (other === 2 && (item.key === 'CEL_ADMIN' || item.key === 'DEL_MEM')) {
            item.isCheck = false
            item.isShow = true
          } else if (other === 3 && (item.key === 'SET_ADMIN' || item.key === 'DEL_MEM')) {
            item.isCheck = false
            item.isShow = true
          } else {
            item.isCheck = false
            item.isShow = false
          }
        } else if (mySelf == 2) {
          if (other === 3 && (item.key === 'SET_ADMIN' || item.key === 'DEL_MEM')) {
            item.isCheck = false
            item.isShow = true
          } else {
            item.isCheck = false
            item.isShow = false
          }
        } else {
          item.isCheck = false
          item.isShow = false
        }
      })
      this.setData({
        actionList: actionList,
        popupTitle: '权限管理',
      })
    },
    configPopupInviteOption() {
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        if (item.key === 'BE_MEM' || item.key === 'BE_VIS') {
          item.isCheck = false
          item.isShow = true
        } else {
          item.isCheck = false
          item.isShow = false
        }
      })
      this.setData({
        actionList: actionList,
        popupTitle: '邀请成员',
      })
    },
    clearOptionList() {
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        item.isCheck = false
        item.isShow = false
      })
      this.setData({ actionList: actionList })
    },
    setPopupOptionPick(key: string) {
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        if (item.key === key) {
          item.isCheck = true
        } else {
          item.isCheck = false
        }
      })
      this.setData({ actionList: actionList })
    },
    hidePopup() {
      this.setData({
        isEditRole: false,
        curClickUserItem: null,
        curOptionItem: null,
      })
      setTimeout(() => {
        this.clearOptionList()
      }, 300)
    },
    onPopupClick(data: any) {
      const item = data.currentTarget.dataset.item
      this.setData({ curOptionItem: item })
      this.setPopupOptionPick(item.key)
    },
    onShareAppMessage() {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          const type = storage.get('invite_type', '3')
          const time = new Date()
          resolve({
            title: '邀请你加入我的项目',
            path:
              '/pages/index/index?type=' +
              type +
              '&projectId=' +
              projectBinding.store.currentProjectId +
              '&time=' +
              time.valueOf() +
              '&shareId=' +
              projectBinding.store.shareId,
            imageUrl: ShareImgUrl(),
          })
        }, 500)
      })
      return {
        title: '邀请你加入我的项目',
        path: '/pages/index/index?type=visitor',
        imageUrl: ShareImgUrl(),
        promise,
      }
    },
  },
})
