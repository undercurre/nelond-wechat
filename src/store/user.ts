import { observable, runInAction } from 'mobx-miniprogram'
import { UserRole } from '../config/index'
import { updateUserInfo } from '../apis/user'
import { storage } from '../utils/index'

export const userStore = observable({
  userInfo: {
    mobilePhone: '',
    userName: '',
    token: '',
    roleList: [],
  } as User.UserInfo,
  isLogin: false,

  // 是否总管
  get SuperAdmin() {
    const { roleId } = this.userInfo.roleList[0] ?? {}
    return roleId === UserRole.SuperAdmin
  },

  // 是否管理员权限+，代理商管理员|1 项目管理员|2
  get isManager() {
    const { roleId } = this.userInfo.roleList[0] ?? {}
    return roleId === UserRole.Creator || roleId === UserRole.Admin
  },

  logout() {
    runInAction(() => {
      this.userInfo = {
        mobilePhone: '',
        userName: '',
        token: '',
        roleList: [],
      } as User.UserInfo
      this.isLogin = false
    })
  },

  setIsLogin(value: boolean) {
    runInAction(() => {
      this.isLogin = value
    })
  },

  setUserInfo(userInfo: User.UserInfo) {
    this.setIsLogin(true)

    runInAction(() => {
      userStore.userInfo = userInfo
    })
  },

  async editUserName(userName: string) {
    const res = await updateUserInfo({ userName })
    if (!res.success) {
      console.log('修改用户名称失败！', res)
      return
    }

    // FIXME: 更新名称居然要整个对象更新才会刷新页面
    runInAction(() => {
      userStore.userInfo = {
        ...userStore.userInfo,
        userName,
      }
    })

    storage.set('userName', userName, null)
  },
})

export const userBinding = {
  store: userStore,
  fields: ['userInfo', 'isLogin', 'isManager'],
  actions: [],
}
