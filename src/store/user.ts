import { observable, runInAction } from 'mobx-miniprogram'
import { queryUserInfo } from '../apis/index'
import { UserRole } from '../config/index'

export const userStore = observable({
  userInfo: {
    userId: '',
    nickName: '',
    mobilePhone: '',
    headImageUrl: '',
    userName: '',
    wxId: '',
    sex: 0,
    roleId: '',
    roleName: '',
  } as User.UserInfo,
  isLogin: false,

  // 是否创建者
  get isCreator() {
    const { roleId } = this.userInfo
    return roleId === UserRole.SuperAdmin || roleId === UserRole.Creator
  },

  // 是否管理员权限+
  get isManager() {
    const { roleId } = this.userInfo
    return roleId === UserRole.SuperAdmin || roleId === UserRole.Creator || roleId === UserRole.Admin
  },

  logout() {
    runInAction(() => {
      this.userInfo = {
        userId: '',
        nickName: '',
        mobilePhone: '',
        headImageUrl: '',
        userName: '',
        wxId: '',
        sex: 0,
        roleId: UserRole.UnDef,
        roleName: '',
      }
      this.isLogin = false
    })
  },

  setIsLogin(value: boolean) {
    runInAction(() => {
      this.isLogin = value
    })
  },

  async updateUserInfo() {
    const res = await queryUserInfo()
    if (res.success) {
      runInAction(() => {
        res.result.nickName = res.result.nickName ?? '用户' + res.result.mobilePhone.slice(-4)
        userStore.userInfo = res.result
      })
      return
    } else {
      return Promise.reject('获取用户信息失败')
    }
  },
})

export const userBinding = {
  store: userStore,
  fields: ['userInfo', 'isLogin', 'isManager'],
  actions: ['updateUserInfo'],
}
