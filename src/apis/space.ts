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
 * 新增空间信息
 * @param pid 当前空间pid
 * @param cid 新空间是否有子节点的标志：创建父级1 创建子级0
 */
export async function addSpace(
  data: {
    projectId: string
    pid: string
    cid: string
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
    spaceId: string
    spaceName: string
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
export async function delSpace(spaceId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/space/del',
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
