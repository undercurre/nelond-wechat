import { observable, runInAction } from 'mobx-miniprogram'
import { queryRoomList } from '../apis/index'
import { PRO_TYPE } from '../config/index'
import { deviceStore } from './device'
import { homeStore } from './home'
import { deviceCount, IApiRequestOption } from '../utils/index'

export const roomStore = observable({
  /**
   * 当前家庭的房间列表
   */
  roomList: [] as Room.RoomInfo[],
  /**
   * 选择进入了哪个房间，在roomList中的index
   */
  currentRoomIndex: 0,
  /** 全屋设备，对应房间id作为key，房间的设备列表作为key */
  roomDeviceList: {} as Record<string, Device.DeviceItem[]>,

  get currentRoom(): Room.RoomInfo {
    return this.roomList[this.currentRoomIndex]
  },

  get lightOnInHouse(): number {
    const { roomList } = this
    let count = 0
    roomList.forEach((room) => (count += room.lightOnCount))
    return count
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
        if (list[device.roomId]) {
          list[device.roomId].push(device)
        } else {
          list[device.roomId] = [device]
        }
      })
    roomStore.roomList.forEach((roomInfo) => {
      const roomDeviceList = list[roomInfo.roomId]
      const { lightOnCount, endCount, lightCount } = deviceCount(roomDeviceList)

      roomInfo.lightOnCount = lightOnCount
      roomInfo.endCount = endCount
      roomInfo.lightCount = lightCount
    })

    runInAction(() => {
      roomStore.roomDeviceList = list
      roomStore.roomList = [...roomStore.roomList]
    })
  },

  async updateRoomList(options?: IApiRequestOption) {
    const res = await queryRoomList(homeStore.currentHomeId, options)
    if (res.success) {
      res.result.roomInfoList.forEach((room) => {
        const roomDeviceList = roomStore.roomDeviceList[room.roomInfo.roomId]
        // 过滤一下默认场景，没灯过滤明亮柔和，没灯没开关全部过滤
        const hasSwitch = roomDeviceList?.some((device) => device.proType === PRO_TYPE.switch) ?? false
        const hasLight = roomDeviceList?.some((device) => device.proType === PRO_TYPE.light) ?? false
        if (!hasSwitch && !hasLight) {
          // 四个默认场景都去掉
          room.roomSceneList = room.roomSceneList.filter((scene) => scene.isDefault === '0')
        } else if (hasSwitch && !hasLight) {
          // 只有开关，去掉默认的明亮、柔和
          room.roomSceneList = room.roomSceneList.filter((scene) => !['2', '3'].includes(scene.defaultType))
        }

        const { lightOnCount, endCount, lightCount } = deviceCount(roomDeviceList)

        room.roomInfo.lightOnCount = lightOnCount
        room.roomInfo.endCount = endCount
        room.roomInfo.lightCount = lightCount
      })

      runInAction(() => {
        roomStore.roomList = res.result.roomInfoList.map((room) => ({
          roomId: room.roomInfo.roomId,
          groupId: room.roomInfo.groupId,
          roomIcon: room.roomInfo.roomIcon || 'drawing-room',
          roomName: room.roomInfo.roomName,
          sceneList: room.roomSceneList,
          deviceNum: room.roomInfo.deviceNum,
          lightOnCount: room.roomInfo.lightOnCount,
          endCount: room.roomInfo.endCount,
          lightCount: room.roomInfo.lightCount,
        }))
      })
    }
  },
})

export const roomBinding = {
  store: roomStore,
  fields: ['roomList', 'currentRoomIndex', 'roomDeviceList', 'currentRoom'],
  actions: [],
}
