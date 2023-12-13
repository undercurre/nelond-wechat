import { IApiRequestOption, mzaioRequest } from '../utils/index'
import { userBinding } from '../store/index'

/**
 * 查询项目列表
 */
export async function queryProjectList(options?: IApiRequestOption) {
  return await mzaioRequest.post<{
    content: Project.IProjectItem[]
    size: number
    totalPages: number
    totalElements: number
    empty: boolean
  }>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: options?.isDefaultErrorTips ?? true,
    url: '/v1/mzgd/cl/user/project/query',
  })
}

/**
 * 查询项目信息
 */
export async function queryProjectInfo({ projectId = '' }, options?: IApiRequestOption) {
  return await mzaioRequest.post<Project.IProjectDetail>({
    isDefaultErrorTips: false,
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/project/queryDetail',
    data: {
      projectId,
    },
  })
}

/**
 * 新增美智用户项目
 */
export async function saveOrUpdateUserHouseInfo(
  params: {
    projectId?: string
    projectName: string
    userLocationInfo: string
  },
  options?: { loading?: boolean },
) {
  if (params.projectId === '') {
    delete params.projectId
  }

  return await mzaioRequest.post<Project.IProjectDetail>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/saveOrUpdateUserHouseInfo',
    data: params,
  })
}

/**
 * 删除或解散项目
 */
export async function delUserHouse(projectId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/delUserHouse',
    data: {
      projectId,
    },
  })
}

/**
 * 退出项目
 */
export async function quitUserHouse(projectId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/quitUserHouse',
    data: {
      projectId,
      userId: userBinding.store.userInfo.userId,
    },
  })
}

/**
 * 转让项目
 * type 项目变更类型 1：项目转让 2：工程移交
 */
export async function changeUserHouse(
  params: { type: number; projectId: string; changeUserId: string; shareId?: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/changeUserHouse',
    data: {
      ...params,
    },
  })
}

/**
 * 查询项目成员列表
 */
export async function queryHouseUserList({ projectId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Project.HomeMemberInfo>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/queryHouseUserList',
    data: {
      projectId,
      pageSize: 50,
    },
  })
}

/**
 * 更新项目成员权限
 * 项目成员权限，创建者：1 管理员：2 游客：3
 */
export async function updateHouseUserAuth({ userId = '', auth = 3, projectId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/updateHouseUserAuth',
    data: {
      userId,
      houseUserAuth: auth,
      projectId,
    },
  })
}

/**
 * 删除项目成员
 */
export async function deleteHouseUser({ projectId = '', userId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/house/delHouseUser',
    data: {
      projectId,
      userId,
    },
  })
}

/**
 * 邀请项目成员
 */
export async function inviteHouseUser({ projectId = '', auth = 3, shareId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/inviteHouseUser',
    data: {
      projectId,
      houseUserAuth: auth,
      shareId,
    },
  })
}

/**
 * 获取分享连接ID
 */
export async function getShareId({ projectId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<{ shareId: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/getShareId',
    data: {
      projectId,
    },
  })
}
