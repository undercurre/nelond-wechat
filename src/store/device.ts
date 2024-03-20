import { observable, runInAction } from 'mobx-miniprogram'
import { queryDevice } from '../apis/device'
import { PRO_TYPE } from '../config/index'
import { projectStore } from './project'
import { spaceStore } from './space'
import { sceneStore } from './scene'
import homOs from 'js-homos'
import { IApiRequestOption, deviceFlatten } from '../utils/index'

export const deviceStore = observable({
  /**
   * 项目所有设备列表
   */
  allDeviceList: [] as Device.DeviceItem[],

  /**
   * 当前空间设备列表
   */
  deviceList: [] as Device.DeviceItem[],

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

  // 当前空间灯组数量
  get groupCount(): number {
    const { spaceId = 0 } = spaceStore.currentSpaceTemp ?? {}
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

  get allDeviceFlattenMap(): Record<string, Device.DeviceItem> {
    return Object.fromEntries(
      deviceStore.allDeviceFlattenList.map((device: Device.DeviceItem) => [device.uniId, device]),
    )
  },
  get allDeviceFlattenList(): Device.DeviceItem[] {
    return deviceFlatten(this.allDeviceList)
  },
  /**
   * @description 空间设备列表
   * 将有多个按键的开关拍扁，保证每个设备和每个按键都是独立一个item，并且uniId唯一
   */
  get deviceFlattenList(): Device.DeviceItem[] {
    return deviceFlatten(this.deviceList)
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

  /**
   * 更新全项目设备列表
   */
  async updateAllDeviceList(projectId: string = projectStore.currentProjectId, options?: IApiRequestOption) {
    const res = await queryDevice(projectId, '0', options)

    if (!res.success) {
      console.log('加载全项目设备失败！', res)
      return
    }

    let { spaceId = 0 } = spaceStore.currentSpaceTemp ?? {}
    const children = spaceStore.allSpaceList.filter((s) => s.pid === spaceId)
    // 如果只有唯一的子空间，即公共空间，则平铺子公共空间设备列表
    if (children.length === 1) {
      spaceId = children[0].spaceId
    }

    runInAction(() => {
      deviceStore.allDeviceList = res.result

      if (spaceId && res.result?.length) {
        deviceStore.deviceList = res.result.filter((device) => device.spaceId === spaceId)
      }

      this.updateAllDeviceListLanStatus(false)
    })
  },

  /**
   * 更新当前空间设备列表
   */
  async updateSpaceDeviceList(
    projectId: string = projectStore.currentProjectId,
    spaceId: string = spaceStore.currentSpaceId,
    options?: IApiRequestOption,
  ) {
    const res = await queryDevice(projectId, spaceId, options)
    if (!res.success) {
      console.log('加载空间设备失败！', res)
      return
    }
    runInAction(() => {
      deviceStore.deviceList = res.result
      this.updateAllDeviceListLanStatus(false)
    })
  },
  /**
   * 更新全屋设备列表的局域网状态
   */
  updateAllDeviceListLanStatus(isUpdateUI = true) {
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
