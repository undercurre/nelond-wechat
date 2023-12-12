import { observable, runInAction } from 'mobx-miniprogram'
import { querySpaceList } from '../apis/index'
import { deviceStore } from './device'
import { homeStore } from './home'
import { IApiRequestOption } from '../utils/index'

export const roomStore = observable({
  /**
   * 当前家庭的房间列表
   */
  roomList: [] as Space.SpaceInfo[],
  /**
   * 选择进入了哪个房间，在roomList中的index
   */
  currentSpaceIndex: 0,
  /** 全屋设备，对应房间id作为key，房间的设备列表作为key */
  roomDeviceList: {} as Record<string, Device.DeviceItem[]>,

  get currentRoom(): Space.SpaceInfo {
    return this.roomList?.length ? this.roomList[this.currentSpaceIndex] : ({} as Space.SpaceInfo)
  },

  /**
   * 更新房间开灯数量
   * ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
   */
  updateRoomCardLightOnNum() {
    const list = {} as Record<string, Device.DeviceItem[]>
    deviceStore.allRoomDeviceList
      .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
      .forEach((device) => {
        if (list[device.spaceId]) {
          list[device.spaceId].push(device)
        } else {
          list[device.spaceId] = [device]
        }
      })

    runInAction(() => {
      roomStore.roomDeviceList = list
      roomStore.roomList = [...roomStore.roomList]
    })
  },

  async updateSpaceList(options?: IApiRequestOption) {
    const res = await querySpaceList(homeStore.currentProjectId, '0', options)
    if (res.success) {
      runInAction(() => {
        roomStore.roomList = res.result
        console.log('updateSpaceList', roomStore.roomList)
      })
    }
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentSpaceIndex', 'roomDeviceList', 'currentRoom'],
  actions: [],
}
