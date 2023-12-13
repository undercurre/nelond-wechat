import { mzaioRequest } from '../utils/index'

/**
 * 查询美居项目列表
 * @param code，美居登录后返回的授权码，正常授权流程必传，因为暂没有二次获取项目列表的路径
 */
export async function getMeijuHomeList(code?: string) {
  return await mzaioRequest.post<{ mideaHouseList: Meiju.MeijuHome[] }>({
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/user/queryMideaUserHouseInfo',
    data: {
      code,
    },
  })
}

/**
 * 查询用户美居授权绑定关系
 * @param projectId 美居项目id
 */
export async function queryUserMideaAuthInfo(projectId: string) {
  return await mzaioRequest.post<{ mideaAuthFlag: boolean; projectName: string }>({
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/user/queryUserMideaAuthInfo',
    data: {
      projectId,
    },
  })
}

/**
 * 美居用户设备授权（同时返回美居设备列表）
 * @param mideaHouseId 美居项目id
 * @param projectId Homlux 项目id
 */
export async function bindMeiju({ projectId, mideaHouseId }: { projectId: string; mideaHouseId: string }) {
  return await mzaioRequest.post<Meiju.MeijuDevice[]>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/bindHouseRoom',
    data: { projectId, mideaHouseId },
  })
}

/**
 * 获取美居设备列表（已授权）
 */
export async function getMeijuDeviceList(projectId: string) {
  return await mzaioRequest.post<Meiju.MeijuDevice[]>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/list',
    data: { projectId },
  })
}

/**
 * 同步美居设备列表
 * @param projectId Homlux 项目id
 */
export async function syncMeijuDeviceList(projectId: string) {
  return await mzaioRequest.post<Meiju.MeijuDevice[]>({
    log: true,
    loading: true,
    url: '/v1/thirdparty/midea/device/syncMideaDevice',
    data: { projectId },
  })
}

/**
 * 查询第三方授权
 * @param projectId Homlux 项目id
 */
export async function queryUserThirdPartyInfo(
  projectId: string,
  options?: { loading?: boolean; isDefaultErrorTips?: boolean },
) {
  return await mzaioRequest.post<Meiju.AuthItem[]>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: options?.isDefaultErrorTips ?? true,
    url: '/v1/thirdparty/midea/device/queryUserThirdPartyInfo',
    data: { projectId },
  })
}

/**
 * 取消第三方授权
 * @param projectId Homlux 项目id
 */
export async function delDeviceSubscribe(projectId: string) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/delDeviceSubscribe',
    data: { projectId },
  })
}

/**
 * 查询设备配网指引
 * @param params.mode 配网模式 （0:AP，1:快连，2:声波，3:蓝牙，4:零配，5:WIFI,6:ZigBee）
 * @param params.sn8 设备型号
 * @param params.modelNumber 特殊设备型号（A0），如果存在则必传
 * @param params.type 设备品类(格式如AC)
 */
export async function queryGuideInfo(params: {
  projectId: string
  mode: string
  modelNumber?: string
  sn8?: string
  type: string
}) {
  return await mzaioRequest.post<{
    isAutoConnect: string // 上电默认连接模式(0 不启动，1 AP，2 WIFI零配)
    mainConnectTypeDesc: string // 配网介绍
    mainConnectTypeUrlList: string[] // 主配网图列表 ["http://midea-file.oss-cn-hangzhou.aliyuncs.com/2023/7/21/9/ChjOZnQUgWmtBEMMYQjf.gif"]
    modelCode: string // 设备型号（SN8）或特殊设备型号（A0）的值
    modelType: string // modelCode类型 0:A0设备型号（SN8）,1:特殊设备型号（A0）的值
    wifiFrequencyBand: string // WIFI频段：1:2.4G，2:2.4G/5G
  }>({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/queryGuideInfo',
    data: params,
  })
}

/**
 * 查询设备是否已入网
 * @param params.sn  加密后的sn； 约定采用(AES/CBC/PKCS5Padding),加密方法：AES.encrypt(sn, key,IV),并对加密结果转成16进制字符串表示； 注：加密Key由美的云为三方云分配的clientSecret做SHA256后取字节数组前16字节,其中IV通过伪随机数生成器生成，并且转成十六进制字符串后拼接在加密后的字符串前面，其中加密字符串也采用十六进制，解密的时候云端会把拼接在前面的iv变量截取下来再做解密，具体对称加密实现示例参考附录
 * @param params.randomCode  配网随机数
 * @param params.forceValidRandomCode  默认false，传true则强制校验随机数，直到匹配成功或者轮训超时,注：udpversion=2这个值才传true，其他情况都默认false
 */
export async function checkApExists(params: {
  sn: string
  randomCode: string
  forceValidRandomCode: string
  projectId: string
}) {
  return await mzaioRequest.post<{
    reqId: string // 请求ID
    available: boolean // true时为已发现设备
    applianceList: {
      verificationCode: string // 随机数验证码，用于绑定校验
      applianceCode: string // 设备虚拟ID，用于设备相关操作
    }[] // 发现的设备列表
  }>({
    log: true,
    loading: false,
    isDefaultErrorTips: false,
    url: '/v1/thirdparty/midea/device/apExists',
    data: params,
  })
}

/**
 * 绑定美的设备
 * @param params.applianceType 【品类码】 对应Android/iOS AP配网返回的参数deviceTpye【设备品类】
 */
export async function bindMideaDevice(params: {
  applianceType?: string // 【品类码】 对应Android/iOS AP配网返回的参数deviceTpye【设备品类】
  bindType?: string // 绑定类型，默认AP配网可不传，例如大屏扫码的类型为qrcode
  deviceId: string // 美居设备id
  projectId: string // homLux项目id
  spaceId: string // homLux空间id
  verificationCode?: string // 验证码，bindType不传或者为ap时必传
}) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/thirdparty/midea/device/mideaDeviceBind',
    data: params,
  })
}

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
