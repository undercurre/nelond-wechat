import { delay, hideLoading, IApiRequestOption, Logger, mzaioRequest, showLoading } from '../utils/index'
import { PRO_TYPE } from '../config/index'
import homOs from 'js-homos'
import { deviceStore } from '../store/index'

/**
 * 设备管理-根据项目id/空间id查询设备
 */
export async function queryDevice(projectId: string, spaceId: string, options?: IApiRequestOption) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: options?.isDefaultErrorTips ?? true,
    url: '/v1/cl/device/wx/queryDeviceInfoByProjectId',
    data: {
      projectId,
      spaceId,
    },
  })
}

/**
 * 全屋设备开或者关 TODO 暂不需要此功能
 * 1：开 0：关
 */
export async function allDevicePowerControl(
  data: { projectId: string; onOff: number },
  options?: { loading?: boolean },
) {
  // // TODO 判断是否局域网控制
  // if (homOs.isHostConnected()) {
  //   const localRes = await homOs.houseControl({
  //     projectId: data.projectId,
  //     power: data.onOff,
  //   })

  //   Logger.log('localRes', localRes)

  //   if (localRes.success) {
  //     return localRes
  //   } else {
  //     Logger.error('局域网调用失败，改走云端链路')
  //   }
  // }

  return await mzaioRequest.post<IAnyObject>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/deviceControlByHouseId',
    data: data,
  })
}

/**
 * 设备控制-根据项目id空间id查询空间的子设备
 */
export async function querySubDeviceList(
  data: { projectId: string; spaceId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.DeviceItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/querySubDeviceInfoByRoomId',
    data,
  })
}

/**
 * 设备管理-根据设备Id获取设备明细
 * roomId可选，传入roomId可减少云端查询步骤
 */
export async function queryDeviceInfoByDeviceId(
  data: { deviceId: string; spaceId?: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.DeviceItem>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/queryDeviceInfoByDeviceId',
    data,
  })
}

/**
 * 查询设备在线离线状态
 * @param data deviceType 设备类型（1:网关 2:子设备 3:wifi
 * @param options
 */
export async function queryDeviceOnlineStatus(
  data: { deviceType: '1' | '2' | '3'; sn?: string; deviceId?: string },
  options?: { loading?: boolean },
) {
  // 	"onlineStatus": 在线离线状态(0:离线1:在线
  return await mzaioRequest.post<{ deviceId: string; onlineStatus: number }>({
    log: false,
    loading: options?.loading ?? false,
    isDefaultErrorTips: false,
    url: '/v1/cl/device/queryDeviceOnlineStatus',
    data,
  })
}

/**
 * 查询子设备是否已入网
 * @param data devIds 设备
 * @param options
 */
export async function queryBindDevIdIsSuccess(data: { devIds: string[] }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<string[]>({
    log: false,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/queryBindDevIdIsSuccess',
    data,
  })
}

/**
 * 查询子设备是否已入网
 * @param data
 * @param options
 */
export async function isDeviceOnline(data: { devIds: string[] }) {
  const deviceStatusRes = await queryBindDevIdIsSuccess(data)

  return deviceStatusRes.success && deviceStatusRes.result.length === 0
}

/**
 * 配网-绑定
 */
export async function bindDevice(
  data: {
    projectId?: string
    spaceId?: string
    sn?: string
    deviceId?: string
    deviceName: string
    nonce?: string // 随机验证码
  },
  options?: { loading?: boolean },
) {
  const res = await mzaioRequest.post<{ deviceId: string; isBind: boolean; msg: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/bindDevice',
    data,
  })

  await delay(1500) // 延迟1.5s，防止绑定后台逻辑还没执行完毕

  return res
}

/**
 * 设备控制-下发命令
 */
export async function controlDevice(
  data: {
    customJson?: IAnyObject
    deviceId: string
    method: string
    deviceType?: number // 设备类型（1:网关 2:子设备 3:wifi
    topic?: string
    inputData: IAnyObject[]
  },
  option?: { loading?: boolean },
) {
  const { deviceType, inputData } = data

  // 仅子设备需要判断是否局域网控制
  if (deviceType === 2 && homOs.isSupportLan({ deviceId: inputData[0].devId })) {
    const localRes = await homOs.deviceControl({
      deviceId: inputData[0].devId,
      actions: inputData.map((item) => {
        // 由于传多余的属性，网关端会报错，需要去除多余的属性
        const deviceProperty = Object.assign({}, item)

        delete deviceProperty.modelName
        delete deviceProperty.devId

        return {
          modelName: item.modelName,
          deviceProperty,
        }
      }),
    })

    if (localRes.success) {
      return localRes
    } else {
      Logger.error('局域网调用失败，改走云端链路')
    }
  }

  return await mzaioRequest.post<IAnyObject>({
    log: true,
    isDefaultErrorTips: false,
    loading: option?.loading || false,
    url: '/v1/cl/device/down',
    data: data,
  })
}

/**
 * 下发控制设备，使用子设备属性作为标准，目前兼容控制子设备、wifi灯
 * @param data
 * @param option
 */
export async function sendDevice(
  data: {
    proType: string
    deviceType: number
    deviceId: string
    gatewayId?: string
    modelName?: string
    property: IAnyObject
  },
  option?: { loading?: boolean },
) {
  const property = data.property
  let params
  let promise

  switch (data.deviceType) {
    case 2:
      params = {
        topic: '/subdevice/control',
        deviceId: data.gatewayId as string,
        deviceType: data.deviceType,
        method: data.proType === PRO_TYPE.light ? 'lightControlNew' : 'panelSingleControlNew',
        inputData: [
          {
            devId: data.deviceId,
            modelName: data.modelName,
            ...property,
          },
        ],
      }
      promise = controlDevice(params, option)
      break

    case 3:
      if (data.proType === PRO_TYPE.light) {
        const downData = property

        params = {
          deviceId: data.deviceId,
          deviceType: data.deviceType,
          method: 'wifiLampControl',
          inputData: [downData],
        }

        promise = controlDevice(params, option)
      } else if (data.proType === PRO_TYPE.curtain) {
        const downData = property

        params = {
          deviceId: data.deviceId,
          deviceType: data.deviceType,
          method: 'wifiCurtainControl',
          inputData: [downData],
        }

        promise = controlDevice(params, option)
      } else if (data.proType === PRO_TYPE.bathHeat) {
        const downData = property

        params = {
          deviceId: data.deviceId,
          deviceType: data.deviceType,
          method: 'wifiBathHeatControl',
          inputData: [downData],
        }

        promise = controlDevice(params, option)
      } else if (data.proType === PRO_TYPE.clothesDryingRack) {
        const downData = property

        params = {
          deviceId: data.deviceId,
          deviceType: data.deviceType,
          method: 'wifiClothesDryingRackControl',
          inputData: [downData],
        }

        promise = controlDevice(params, option)
      }

      break

    case 4:
      promise = groupControl(
        {
          groupId: data.deviceId,
          controlAction: [data.property],
        },
        option,
      )

      break
  }

  return promise || { success: false }
}

/**
 * 设备控制-下发命令
 */
export async function sendCmdAddSubdevice(
  data: { deviceId: string; expire: number; buzz: 0 | 1 },
  options?: { loading?: boolean },
) {
  return await controlDevice(
    {
      deviceId: data.deviceId,
      topic: '/subdevice/add',
      method: 'subdeviceAdd',
      inputData: [
        {
          expire: data.expire,
          buzz: data.buzz,
        },
      ],
    },
    options,
  )
}

/**
 * 云端找一找接口
 * Identify 闪多少秒
 */
export async function findDevice(
  {
    gatewayId,
    devId,
    modelName = 'wallSwitch1',
    Identify = 3,
  }: { gatewayId: string; devId: string; modelName?: string; Identify?: number },
  options?: { loading?: boolean },
) {
  return await controlDevice(
    {
      topic: '/subdevice/control',
      deviceId: gatewayId,
      method: 'deviceFindNew',
      inputData: [
        {
          devId,
          modelName,
          Identify,
        },
      ],
    },
    options,
  )
}

/**
 * 云端获取网关下的传感器列表（未绑定到项目的）
 * @param gatewayId
 */
export async function getUnbindSensor(data: { gatewayId: string }, option?: { loading?: boolean }) {
  return await mzaioRequest.post<Device.ISubDevice[]>({
    log: true,
    loading: option?.loading || false,
    url: '/v1/cl/device/getUnbindSensor',
    data,
  })
}

/**
 * 检查ota版本
 */
export async function checkOtaVersion(deviceId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/checkOtaVersion',
    data: {
      deviceId,
    },
  })
}

/**
 * 设备管理-修改设备的名称、按键名称、所在空间
 * type:0 修改设备名字，传入设备名称
 * 1：修改空间
 * 2：同时修改设备名字、空间
 * 3：修改开关名字
 */
export async function editDeviceInfo(
  data: {
    deviceId: string
    deviceName?: string
    projectId?: string
    spaceId?: string
    type?: string
    switchId?: string
    switchName?: string
    deviceType?: number
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/update',
    data,
  })
}

/**
 * 批量编辑设备(开关)
 * @param data
 * @param options
 */
export async function batchUpdate(
  data: {
    deviceInfoUpdateVoList: Device.DeviceInfoUpdateVo[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ isSuccess: boolean }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/batchUpdate',
    data,
  })
}

/**
 * 设备管理-删除单个设备
 * 网关需要传sn，子设备传子设备的deviceId代替sn
 */
export async function deleteDevice(
  data: { deviceId: string; deviceType: number; sn: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/delDevice',
    data,
  })
}

/**
 * 批量查询设备是否已删除
 */
export async function queryDelDevIdIsSuccess(data: { devIds: string[] }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<string[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/queryDelDevIdIsSuccess',
    data,
  })
}

/**
 * 等待删除单个设备结果
 * 仅子设备：增加删除接口调用后，轮询网关上报的删除ack结果来判断删除最终结果
 */
export async function waitingDeleteDevice(
  data: { deviceId: string; deviceType: number; sn: string },
  options?: { loading?: boolean },
) {
  options = options || { loading: true }

  options.loading && showLoading('正在删除')

  let delRes = await deleteDevice(data)

  // 仅子设备删除需要判断是否收到设备上报的删除ack判断
  if (data.deviceType !== 2 || !delRes.success) {
    options.loading && hideLoading()
    return delRes
  }

  for (let i = 0, times = 4; i < times; i++) {
    await delay(1000)

    delRes = await queryDelDevIdIsSuccess({ devIds: [data.deviceId] })

    if (delRes.success && delRes.result.length === 0) {
      break
    }
  }
  options.loading && hideLoading()

  return {
    success: delRes.success && (delRes.result as string[]).length === 0,
  }
}

/**
 * 批量编辑设备（包括灯组）
 * @param data
 * @param options
 */
export async function batchDeleteDevice(
  data: {
    deviceBaseDeviceVoList: Device.DeviceBaseDeviceVo[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/batchDelDevice',
    data,
  })
}

/**
 * 等待批量删除设备结果
 * 仅子设备：增加删除接口调用后，轮询网关上报的删除ack结果来判断删除最终结果
 */
export async function waitingBatchDeleteDevice(
  data: {
    deviceBaseDeviceVoList: Device.DeviceBaseDeviceVo[]
  },
  options?: { loading?: boolean },
) {
  options = options || { loading: true }

  options.loading && showLoading('正在删除')

  const subDeviceList = data.deviceBaseDeviceVoList.filter((item) => item.deviceType === '2') // 删除的子设备列表
  let delRes = await batchDeleteDevice(data)

  // 仅子设备删除需要判断是否收到设备上报的删除ack判断
  if (subDeviceList.length === 0 || !delRes.success) {
    options.loading && hideLoading()
    return delRes
  }

  for (let i = 0, times = Math.ceil(4 + subDeviceList.length / 4); i < times; i++) {
    await delay(1000)

    delRes = await queryDelDevIdIsSuccess({ devIds: subDeviceList.map((item) => item.deviceId) })

    if (delRes.success && (delRes.result as string[]).length === 0) {
      break
    }
  }
  options.loading && hideLoading()

  return {
    success: delRes.success && (delRes.result as string[]).length === 0,
  }
}

/**
 * 保存设备顺序
 *
 */
export async function saveDeviceOrder(data: Device.OrderSaveData, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/saveDeviceNum',
    data,
  })
}

/**
 * 设备替换
 * 需要在前端验证设备是否可替换
 */
export async function deviceReplace(
  data: {
    newDevId: string
    oldDevId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/deviceReplace',
    data,
  })
}

/**
 * 获取设备（传感器）日志
 */
export async function getSensorLogs(
  data: {
    projectId?: string
    deviceId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.Log[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/querySensorLog',
    data,
  })
}

/**
 * 上传设备（网关）日志
 */
export async function uploadDeviceLog(
  data: {
    deviceId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.Log[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/uploadDeviceLog',
    data,
  })
}

/**
 * 根据sn去查设备的mac、图片、品类
 */
export async function checkDevice(
  data: {
    dsn?: string
    mac?: string
    productId?: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.MzgdProTypeDTO>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: false,
    url: '/v1/cl/device/checkDevice',
    data,
  })
}

/**
 * 批量校验设备的mac
 */
export async function batchCheckDevice(
  data: {
    deviceCheckSubDeviceVoList: { mac: string }[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.MzgdProTypeDTO[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/batchCheckDevice',
    data,
  })
}

/**
 * 批量设备的基本产品信息
 */
export async function batchGetProductInfoByBPid(
  data: {
    mzgdBluetoothVoList: { proType: string; bluetoothPid: string }[]
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<
    {
      proType: string
      bluetoothPid: string
      productIcon: string
      productName: string
      modelId: string
      switchNum: number
    }[]
  >({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/batchGetProductInfoByBPid',
    data,
  })
}

/**
 * 根据面板ID和面板开关获取关联的灯
 */
export async function getRelLampInfo(
  data: { primaryDeviceId: string; primarySwitchId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ lampRelList: Device.IMzgdLampRelGetDTO[] }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/getRelLampInfo',
    data,
  })
}

/**
 * 根据面板ID和面板开关获取主动、被动的面板开关
 */
export async function getRelDeviceInfo(
  data: { primaryDeviceId: string; primarySwitchId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{
    primaryRelDeviceInfo: Device.IMzgdRelGetDTO[]
    secondRelDeviceInfo: Device.IMzgdRelGetDTO[]
  }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/getRelDeviceInfo',
    data,
  })
}

/**
 * 编辑面板和灯关联
 * @param lampDevices 关联设备ID:格式 deviceId, 灯Id,逗号分隔 )
 * @param primaryDeviceId
 * @param primarySwitchId
 */
export async function editLampAndSwitchAssociated(
  data: { lampDevices: string; primaryDeviceId: string; primarySwitchId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/editLampAndSwitchAssociated',
    data,
  })
}

/**
 * 删除面板和灯关联
 */
export async function delLampAndSwitchAssociated(
  data: { deviceId: string; switchId: string; relIds: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/delLampAndSwitchAssociated',
    data,
  })
}

/**
 * 编辑面板和面板关联
 * @param secondSwitchs 关联设备ID:格式 deviceId-switch, 逗号分隔
 */
export async function editSwitchAndSwitchAssociated(
  data: { primaryDeviceId: string; primarySwitchId: string; secondSwitchs: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/editSwitchAndSwitchAssociated',
    data,
  })
}

/**
 * 删除面板和面板关联
 * @param relIds 面板关联Id,逗号分隔 )
 */
export async function delSwitchAndSwitchAssociated(data: { relIds: string }, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/delSwitchAndSwitchAssociated',
    data,
  })
}

/**
 * 根据项目id获取面板是否已经关联过灯
 */
export async function getLampDeviceByProjectId(data: { projectId: string }, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Array<Device.IMzgdLampDeviceInfoDTO>>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/getLampDeviceByProjectId',
    data,
  })
}

/**
 * 增加分组
 */
export async function addGroup(
  data: {
    applianceGroupDtoList: Device.GroupDTO[]
    groupName: string
    projectId: string
    spaceId: string
    userId?: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<{ groupId: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/addGroup',
    data,
  })
}

/**
 * 更新分组
 */
export async function updateGroup(
  data: {
    applianceGroupDtoList: Device.GroupDTO[]
    groupId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/uptGroup',
    data,
  })
}

/**
 * 根据分组id查询分组详情
 */
export async function queryGroup(
  data: {
    groupId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.DeviceItem>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/queryGroupByGroupId',
    data,
  })
}

/**
 * 根据空间id查询分组详情
 */
export async function queryGroupBySpaceId(
  data: {
    spaceId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<Device.DeviceItem>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/queryGroupDetailBySpaceId',
    data,
  })
}

/**
 * 解散灯组
 */
export async function delGroup(
  data: {
    groupId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/delGroup',
    data,
  })
}

/**
 * 分组重命名
 */
export async function renameGroup(
  data: {
    groupId: string
    groupName: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/groupRename',
    data,
  })
}

/**
 * 分组重控制
 */
export async function groupControl(
  data: {
    groupId: string
    controlAction: {
      power?: 0 | 1
      brightness?: number
      colorTemperature?: number
    }[]
  },
  options?: { loading?: boolean },
) {
  const { groupId, controlAction } = data

  const groupInfo = deviceStore.allDeviceList.find((item) => item.deviceId === groupId)

  // 仅子设备需要判断是否局域网控制
  if (homOs.isSupportLan({ groupId, updateStamp: groupInfo?.updateStamp })) {
    const localRes = await homOs.groupControl({
      webGroupId: groupId,
      actions: controlAction[0],
    })

    Logger.log('localRes', localRes)

    if (localRes.success) {
      return localRes
    } else {
      Logger.error('局域网调用失败，改走云端链路')
    }
  }

  return await mzaioRequest.post({
    isDefaultErrorTips: false,
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/groupControl',
    data,
  })
}

/**
 * 获取网关网络信息
 */
export async function getGwNetworkInfo(
  data: {
    deviceId: string
  },
  options?: { loading?: boolean },
) {
  options?.loading && showLoading()

  const downRes = await controlDevice({
    deviceId: data.deviceId,
    deviceType: 1,
    method: 'networkAnalysis',
    topic: '/zigbeeInfo',
    inputData: [
      {
        mode: 'getNetworkInfo',
      },
    ],
  })

  if (!downRes.success) {
    return downRes
  }

  await delay(1000)

  const deviceInfoRes = await queryDeviceInfoByDeviceId({ deviceId: data.deviceId })

  options?.loading && hideLoading()

  return deviceInfoRes
}

/**
 * 获取本地场景密钥key接口
 */
export async function queryLocalKey(
  data: {
    projectId: string
  },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<string>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/queryLocalKey',
    data,
  })
}

/**
 * 标记该网关sn是哪个平台
 */
export async function verifySn(sn: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/cl/device/verifySn',
    data: {
      sn,
      systemType: '2',
    },
  })
}
