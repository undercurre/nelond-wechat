import { observable, runInAction } from 'mobx-miniprogram'

export const othersStore = observable({
  isInit: false,

  setIsInit(value: boolean) {
    runInAction(() => {
      this.isInit = value
    })
  },
})

export const othersBinding = {
  store: othersStore,
  fields: ['isInit'],
  actions: [],
}
