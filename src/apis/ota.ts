import { mzaioRequest } from '../utils/index'

/**
 * 全屋设备是否有OTA版本更新
 */
export async function queryDeviceOtaUpdateList(projectId: string) {
  return await mzaioRequest.post<{
    otaProductList: Ota.OtaProduct[]
    otaUpdateList: Ota.OtaUpdate[]
    jobStatus: number
  }>({
    log: false,
    loading: false,
    url: '/v1/cl/device/queryDeviceOtaUpdateList',
    data: {
      projectId,
    },
  })
}

export async function execOtaUpdate(
  data: { deviceOtaList: Ota.DeviceOtaUpdateReqDTO[] },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ otaProductList: Ota.OtaProduct[]; otaUpdateList: Ota.OtaUpdate[] }>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/deviceOtaUpdate',
    data,
  })
}

/**
 * 设置定时OTA任务
 * jobStatus： 1启动，0关闭
 */
export async function setOtaSchedule(data: { projectId: string; jobStatus: number }, options?: { loading: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/saveOrUpdateOtaUpdateSchedule',
    data,
  })
}
