import { observable, runInAction } from 'mobx-miniprogram'
import { querySpaceList } from '../apis/index'
import { deviceStore } from './device'
import { projectStore } from './project'
import { IApiRequestOption } from '../utils/index'

export const spaceStore = observable({
  /**
   * 当前项目的空间列表
   */
  spaceList: [] as Space.SpaceInfo[],
  /**
   * 选择进入了哪个空间，在roomList中的index
   */
  currentSpaceIndex: 0,
  /** 全屋设备，对应空间id作为key，空间的设备列表作为key */
  spaceDeviceList: {} as Record<string, Device.DeviceItem[]>,

  get currentSpace(): Space.SpaceInfo {
    return this.spaceList?.length ? this.spaceList[this.currentSpaceIndex] : ({} as Space.SpaceInfo)
  },

  /**
   * 更新空间开灯数量
   * ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
   */
  updateRoomCardLightOnNum() {
    const list = {} as Record<string, Device.DeviceItem[]>
    deviceStore.allDeviceList
      .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
      .forEach((device) => {
        if (list[device.spaceId]) {
          list[device.spaceId].push(device)
        } else {
          list[device.spaceId] = [device]
        }
      })

    runInAction(() => {
      spaceStore.spaceDeviceList = list
      spaceStore.spaceList = [...spaceStore.spaceList]
    })
  },

  async updateSpaceList(options?: IApiRequestOption) {
    const res = await querySpaceList(projectStore.currentProjectId, '0', options)
    if (res.success) {
      runInAction(() => {
        spaceStore.spaceList = res.result
        console.log('updateSpaceList', spaceStore.spaceList)
      })
    }
  },
})

export const spaceBinding = {
  store: spaceStore,
  fields: ['spaceList', 'currentSpaceIndex', 'spaceDeviceList', 'currentSpace'],
  actions: [],
}
