import { IApiRequestOption, mzaioRequest } from '../utils/index'

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
    data: {
      pageSize: 999,
    },
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
 * 查询项目成员列表
 */
export async function queryHouseUserList({ projectId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Project.UserItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/user/project/queryProjectUserList',
    data: {
      projectId,
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
