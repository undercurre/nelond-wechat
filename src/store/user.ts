import { observable, runInAction } from 'mobx-miniprogram'
import { queryUserInfo } from '../apis/index'

export const userStore = observable({
  userInfo: {
    userId: '',
    nickName: '',
    mobilePhone: '',
    headImageUrl: '',
    name: '',
    wxId: '',
    sex: 0,
  } as User.UserInfo,
  isLogin: false,

  logout() {
    runInAction(() => {
      this.userInfo = {
        userId: '',
        nickName: '',
        mobilePhone: '',
        headImageUrl: '',
        name: '',
        wxId: '',
        sex: 0,
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
  fields: ['userInfo', 'isLogin'],
  actions: ['updateUserInfo'],
}
