import { observable, runInAction } from 'mobx-miniprogram'
import { homeStore } from './index'
import { queryDeviceOtaUpdateList } from '../apis/index'

export const otaStore = observable({
  otaProductList: [] as Ota.OtaProduct[],
  otaUpdateList: [] as Ota.OtaUpdate[],
  jobStatus: 0,

  get deviceVersionInfoMap(): Record<string, Ota.OtaUpdate> {
    return Object.fromEntries(this.otaUpdateList.map((info: Ota.OtaUpdate) => [info.deviceId, info]))
  },

  async updateList() {
    const res = await queryDeviceOtaUpdateList(homeStore.currentProjectDetail.projectId)
    if (res.success) {
      runInAction(() => {
        otaStore.otaUpdateList = res.result.otaUpdateList
        otaStore.otaProductList = res.result.otaProductList
        otaStore.jobStatus = res.result.jobStatus
      })
      return true
    }
    return false
  },
})

export const otaBinding = {
  store: otaStore,
  fields: ['otaProductList', 'otaUpdateList'],
  actions: [],
}
