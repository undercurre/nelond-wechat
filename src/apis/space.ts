import { mzaioRequest } from '../utils/index'

/**
 * 查询项目空间
 * @param projectId
 * @param options
 * @returns
 */
export async function querySpaceList(projectId: string, pid = '0', options?: { loading?: boolean }) {
  return await mzaioRequest.post<Space.SpaceInfo[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/space/queryList',
    data: {
      projectId,
      pid,
    },
  })
}

/**
 * 新增或更新空间信息
 */
export async function saveHouseRoomInfo(
  data: {
    projectId: string
    roomIcon: string
    spaceId?: string
    spaceName: string
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
 * 删除空间
 */
export async function delHouseRoom(spaceId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/delHouseRoom',
    data: { spaceId },
  })
}

/**
 * 空间排序
 */
export async function updateRoomSort(roomSortList: Space.RoomSort[], options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/updateRoomSort',
    data: { roomSortList },
  })
}
