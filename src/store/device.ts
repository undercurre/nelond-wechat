import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllDevice } from '../apis/device'
import { PRO_TYPE, getModelName } from '../config/index'
import { projectStore } from './project'
import { spaceStore } from './space'
import { sceneStore } from './scene'
import homOs from 'js-homos'
import { IApiRequestOption } from '../utils'

export const deviceStore = observable({
  /**
   * 全屋设备
   */
  allDeviceList: [] as Device.DeviceItem[],

  get deviceList(): Device.DeviceItem[] {
    const { spaceId = 0 } = spaceStore.currentSpace ?? {}
    return this.allDeviceList.filter((device) => device.spaceId === spaceId)
  },
  /**
   * deviceId -> device 映射
   */
  get deviceMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(deviceStore.deviceList.map((device: Device.DeviceItem) => [device.deviceId, device]))
  },

  get allRoomDeviceMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(deviceStore.allDeviceList.map((device: Device.DeviceItem) => [device.deviceId, device]))
  },

  get deviceFlattenMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(deviceStore.deviceFlattenList.map((device: Device.DeviceItem) => [device.uniId, device]))
  },

  /**
   * @description 空间设备列表
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get deviceFlattenList(): Device.DeviceItem[] {
    const { spaceId = 0 } = spaceStore.currentSpace ?? {}
    return this.allRoomDeviceFlattenList.filter((device) => device.spaceId === spaceId)
  },

  // 当前空间灯组数量
  get groupCount(): number {
    const { spaceId = 0 } = spaceStore.currentSpace ?? {}
    const groups = this.allDeviceList.filter((device) => device.spaceId === spaceId && device.deviceType === 4)
    return groups.length
  },

  // 空间所有灯的亮度计算
  get lightStatusInRoom(): { brightness: number; colorTemperature: number } {
    let sumOfBrightness = 0,
      sumOfColorTemp = 0,
      count = 0
    this.deviceFlattenList.forEach((device) => {
      const { proType, deviceType, mzgdPropertyDTOList, onLineStatus } = device

      // 只需要灯需要参与计算，过滤属性数据不完整的数据，过滤灯组，过滤不在线设备，过滤未开启设备
      if (
        proType !== PRO_TYPE.light ||
        deviceType === 4 ||
        onLineStatus !== 1 ||
        mzgdPropertyDTOList?.light?.power !== 1
      ) {
        return
      }

      sumOfBrightness += mzgdPropertyDTOList.light?.brightness ?? 0
      sumOfColorTemp += mzgdPropertyDTOList.light?.colorTemperature ?? 0
      count++
    })

    if (count === 0) {
      return { brightness: 0, colorTemperature: 0 }
    }

    return { brightness: sumOfBrightness / count, colorTemperature: sumOfColorTemp / count }
  },

  /**
   * 在灯组中的灯ID
   */
  // get lightsInGroup() {
  //   const list = [] as string[]
  //   deviceStore.deviceList.forEach((device) => {
  //     if (device.deviceType === 4) {
  //       list.push(...device.groupDeviceList!.map((device) => device.deviceId))
  //     }
  //   })
  //   return list
  // },

  get allRoomDeviceFlattenMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(
      deviceStore.allRoomDeviceFlattenList.map((device: Device.DeviceItem) => [device.uniId, device]),
    )
  },
  get allRoomDeviceFlattenList(): Device.DeviceItem[] {
    const list = [] as Device.DeviceItem[]
    this.allDeviceList.forEach((device) => {
      // 过滤属性数据不完整的数据
      // if (!device.mzgdPropertyDTOList) {
      //   return
      // }
      // 开关面板需要前端拆分处理
      if (device.proType === PRO_TYPE.switch) {
        device.switchInfoDTOList?.forEach((switchItem) => {
          list.push({
            ...device,
            property: device.mzgdPropertyDTOList[switchItem.switchId],
            mzgdPropertyDTOList: {
              [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
            },
            switchInfoDTOList: [switchItem],
            uniId: `${device.deviceId}:${switchItem.switchId}`,
            orderNum: switchItem.orderNum,
          })
        })
      }
      // 包括 PRO_TYPE.light PRO_TYPE.sensor在内，所有非网关、可显示的设备都用这种方案插值
      else if (device.proType !== PRO_TYPE.gateway) {
        const modelName = getModelName(device.proType, device.productId)
        list.push({
          ...device,
          uniId: device.deviceId,
          property: device.mzgdPropertyDTOList[modelName],
          mzgdPropertyDTOList: {
            [modelName]: device.mzgdPropertyDTOList[modelName],
          },
          orderNum: device.deviceType === 4 ? -1 : device.orderNum, // 灯组强制排前面
        })
      }
    })

    // 排序算法：灯组类型靠前；再按orderNum升序；再按设备id升序
    return list.sort(
      (a, b) => (b.deviceType === 4 ? 1 : -1) || a.orderNum - b.orderNum || parseInt(a.deviceId) - parseInt(b.deviceId),
    )
  },

  /**
   * 关联场景关系映射(deviceActions的关联)
   * switchUniId -> sceneId  开关  -》 所属的场景列表
   */
  get switchSceneActionMap(): Record<string, string[]> {
    const map = {} as Record<string, string[]>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceActions?.forEach((action) => {
        if (action.proType === PRO_TYPE.switch) {
          action.controlAction.forEach((controlData) => {
            if (map[`${action.deviceId}:${controlData.modelName}`]) {
              if (!map[`${action.deviceId}:${controlData.modelName}`].includes(scene.sceneId)) {
                map[`${action.deviceId}:${controlData.modelName}`].push(scene.sceneId)
              }
            } else {
              map[`${action.deviceId}:${controlData.modelName}`] = [scene.sceneId]
            }
          })
        }
      })
    })
    return map
  },

  /**
   * 关联场景关系映射(deviceConditions的关联)，
   * switchUniId -> sceneId  开关 -》 关联的场景
   */
  get switchSceneConditionMap(): Record<string, string> {
    const map = {} as Record<string, string>
    sceneStore.allRoomSceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[`${condition.deviceId}:${condition.controlEvent[0].modelName}`] = scene.sceneId
      })
    })
    return map
  },

  async updateallDeviceList(projectId: string = projectStore.currentProjectId, options?: IApiRequestOption) {
    const res = await queryAllDevice(projectId, '0', options)
    if (res.success) {
      const list = {} as Record<string, Device.DeviceItem[]>
      res.result
        ?.sort((a, b) => a.deviceId.localeCompare(b.deviceId))
        .forEach((device) => {
          if (list[device.spaceId]) {
            list[device.spaceId].push(device)
          } else {
            list[device.spaceId] = [device]
          }
        })
      runInAction(() => {
        spaceStore.spaceDeviceList = list
        deviceStore.allDeviceList = res.result

        this.updateallDeviceListLanStatus(false)
      })
    } else {
      console.log('加载全屋设备失败！', res)
    }
  },

  /**
   * 更新全屋设备列表的局域网状态
   */
  updateallDeviceListLanStatus(isUpdateUI = true) {
    const allDeviceList = deviceStore.allDeviceList.map((item) => {
      const { deviceId, updateStamp } = item

      const canLanCtrl =
        item.deviceType === 4
          ? homOs.isSupportLan({ groupId: deviceId, updateStamp })
          : homOs.isSupportLan({ deviceId })

      return {
        ...item,
        canLanCtrl,
      }
    })

    if (!isUpdateUI) {
      deviceStore.allDeviceList = allDeviceList
      return
    }

    runInAction(() => {
      deviceStore.allDeviceList = allDeviceList
    })
  },
})

export const deviceBinding = {
  store: deviceStore,
  fields: ['deviceList', 'allDeviceList', 'deviceFlattenList'],
  actions: [],
}
