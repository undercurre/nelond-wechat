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
 * 查询项目空间
 * @param projectId
 * @param options
 * @returns
 */
export async function queryAllSpaceByProjectId(projectId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Space.allSpace[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/project/queryAllSpaceByProjectId',
    data: {
      projectId,
    },
  })
}
/**
 * 新增空间信息
 */
export async function addSpace(
  data: {
    projectId: string
    pid: string
    spaceName: string
    spaceLevel: Space.SpaceLevel
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/space/add',
    data,
  })
}

/**
 * 编辑空间信息
 */
export async function updateSpace(
  data: {
    projectId: string
    pid: string
    spaceId: string
    spaceName: string
    spaceLevel: Space.SpaceLevel
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/space/update',
    data,
  })
}

/**
 * 删除空间
 */
export async function delHouseRoom(spaceId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/delHouseRoom',
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
    url: '/v1/mzgd/cl/user/updateRoomSort',
    data: { roomSortList },
  })
}
