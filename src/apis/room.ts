import { mzaioRequest } from '../utils/index'

export async function queryRoomList(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<{ roomInfoList: Room.RoomItem[] }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/queryRoomList',
    data: {
      houseId,
    },
  })
}

/**
 * 新增或更新房间信息
 */
export async function saveHouseRoomInfo(
  data: {
    houseId: string
    roomIcon: string
    roomId?: string
    roomName: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/saveHouseRoomInfo',
    data: data,
  })
}

/**
 * 删除房间
 */
export async function delHouseRoom(roomId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/delHouseRoom',
    data: { roomId },
  })
}

/**
 * 房间排序
 */
export async function updateRoomSort(roomSortList: Room.RoomSort[], options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/updateRoomSort',
    data: { roomSortList },
  })
}
