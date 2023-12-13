import { mzaioRequest } from '../utils/index'

/**
 * 查询确权状态
 * 设备确权状态值  0 已确权 1 待确权  2 未确权  3 不支持确权
 */
export async function queryAuthGetStatus(params: {
  deviceId: string // 美居设备id
  projectId: string
}) {
  return await mzaioRequest.post<{
    status: number // 确权状态：0 已确权\n1 待确权\n2 未确权\n3 不支持确权
  }>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/queryAuthGetStatus',
    data: params,
  })
}

/**
 * 设备确权
 */
export async function confirmDeviceAuth(params: {
  deviceId: string // 美居设备id
  projectId: string
}) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/deviceAuthConfirm',
    data: params,
  })
}

/**
 * 查询设备确权指引信息
 */
export async function queryDeviceSpecifiedInfo(params: {
  deviceId: string // 美居设备id
  projectId: string
}) {
  return await mzaioRequest.post<{
    confirmDesc: string // 确权指引描述
    confirmImgUrl: string // 确权指引图片url
    modelCode: string //
    modelType: string
    type: string // 设备品类
  }>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/queryDeviceSpecifiedInfo',
    data: params,
  })
}
