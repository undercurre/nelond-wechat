import { observable, runInAction } from 'mobx-miniprogram'
import { projectStore } from './index'
import { queryDeviceOtaUpdateList } from '../apis/index'

export const otaStore = observable({
  otaProductList: [] as Ota.OtaProduct[],
  otaUpdateList: [] as Ota.OtaUpdate[],

  get deviceVersionInfoMap(): Record<string, Ota.OtaUpdate> {
    return Object.fromEntries(this.otaUpdateList.map((info: Ota.OtaUpdate) => [info.deviceId, info]))
  },

  async updateList() {
    const res = await queryDeviceOtaUpdateList(projectStore.currentProjectDetail.projectId)

    if (res.success) {
      runInAction(() => {
        otaStore.otaUpdateList = res.result.otaUpdateList
        otaStore.otaProductList = res.result.otaProductList
      })
    }

    return res
  },
})

export const otaBinding = {
  store: otaStore,
  fields: ['otaProductList', 'otaUpdateList'],
  actions: [],
}
