import { IApiRequestOption, mzaioRequest } from '../utils/index'
import { userBinding } from '../store/index'

/**
 * 查询家庭列表
 */
export async function getHomeList(options?: IApiRequestOption) {
  return await mzaioRequest.post<Home.IHomeItem[]>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: options?.isDefaultErrorTips ?? true,
    url: '/v1/mzgd/user/house/queryHouseList',
  })
}

/**
 * 查询美智用户家庭信息
 */
export async function queryUserHouseInfo({ houseId = '', defaultHouseFlag = true }, options?: IApiRequestOption) {
  return await mzaioRequest.post<Home.IHomeDetail>({
    isDefaultErrorTips: false,
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/queryUserHouseInfo',
    data: {
      houseId,
      defaultHouseFlag,
    },
  })
}

/**
 * 新增美智用户家庭
 */
export async function saveOrUpdateUserHouseInfo(
  params: {
    houseId?: string
    houseName: string
    userLocationInfo: string
  },
  options?: { loading?: boolean },
) {
  if (params.houseId === '') {
    delete params.houseId
  }

  return await mzaioRequest.post<Home.IHomeDetail>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/saveOrUpdateUserHouseInfo',
    data: params,
  })
}

/**
 * 更新默认家庭
 */
export async function updateDefaultHouse(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Home.IHomeDetail>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/updateDefaultHouse',
    data: {
      houseId,
      defaultHouseFlag: true,
    },
  })
}

/**
 * 删除或解散家庭
 */
export async function delUserHouse(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/delUserHouse',
    data: {
      houseId,
    },
  })
}

/**
 * 退出家庭
 */
export async function quitUserHouse(houseId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/quitUserHouse',
    data: {
      houseId,
      userId: userBinding.store.userInfo.userId,
    },
  })
}

/**
 * 转让家庭
 * type 家庭变更类型 1：家庭转让 2：工程移交
 */
export async function changeUserHouse(
  params: { type: number; houseId: string; changeUserId: string; shareId?: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/changeUserHouse',
    data: {
      ...params,
    },
  })
}

/**
 * 查询家庭成员列表
 */
export async function queryHouseUserList({ houseId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Home.HomeMemberInfo>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/queryHouseUserList',
    data: {
      houseId,
      pageSize: 50,
    },
  })
}

/**
 * 更新家庭成员权限
 * 家庭成员权限，创建者：1 管理员：2 游客：3
 */
export async function updateHouseUserAuth({ userId = '', auth = 3, houseId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/updateHouseUserAuth',
    data: {
      userId,
      houseUserAuth: auth,
      houseId,
    },
  })
}

/**
 * 删除家庭成员
 */
export async function deleteHouseUser({ houseId = '', userId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/house/delHouseUser',
    data: {
      houseId,
      userId,
    },
  })
}

/**
 * 邀请家庭成员
 */
export async function inviteHouseUser({ houseId = '', auth = 3, shareId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/inviteHouseUser',
    data: {
      houseId,
      houseUserAuth: auth,
      shareId,
    },
  })
}

/**
 * 获取分享连接ID
 */
export async function getShareId({ houseId = '' }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<{ shareId: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/user/getShareId',
    data: {
      houseId,
    },
  })
}
