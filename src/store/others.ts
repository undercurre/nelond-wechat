import { observable, runInAction } from 'mobx-miniprogram'

export const othersStore = observable({
  isInit: false,
  defaultPage: '', // 默认首页 'index' || 'remoter' || 'mine'

  setIsInit(value: boolean) {
    runInAction(() => {
      this.isInit = value
    })
  },

  setDefaultPage(value: string) {
    runInAction(() => {
      this.defaultPage = value
    })
  },
})

export const othersBinding = {
  store: othersStore,
  fields: ['isInit'],
  actions: [],
}
