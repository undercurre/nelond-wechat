import { observable, runInAction } from 'mobx-miniprogram'
import { querySpaceList, queryAllSpaceByProjectId } from '../apis/index'
import { deviceStore } from './device'
import { projectStore } from './project'
import { IApiRequestOption } from '../utils/index'

export const spaceStore = observable({
  /**
   * 当前项目的所有空间列表
   */
  allSpaceList: [] as Space.allSpace[],
  /**
   * 当前项目指定父空间下的子空间列表
   */
  spaceList: [] as Space.SpaceInfo[],

  /** 全屋设备，对应空间id作为key，空间的设备列表作为key */
  spaceDeviceList: {} as Record<string, Device.DeviceItem[]>,

  // 当前选中空间的队列 // TODO 或统一改名为 currentSpaceQueue
  currentSpaceSelect: [] as Space.allSpace[],

  // 当前选中空间队列的末端，即真正存放内容的空间
  get currentSpace(): Space.allSpace {
    return this.currentSpaceSelect.length
      ? this.currentSpaceSelect[this.currentSpaceSelect.length - 1]
      : this.allSpaceList[0] //TODO: 当选中空间队列为空时该如何返回
  },
  // 当前选中空间名称 // TODO 显示全路径名称
  get currentSpaceName(): string {
    return this.currentSpace?.spaceName ?? ''
  },

  // 当前选中空间全路径名称
  get currentSpaceNameFull(): string {
    return this.currentSpaceSelect.length
      ? this.currentSpaceSelect.map((item) => item.spaceName).join(',')
      : this.allSpaceList[0].spaceName
  },

  get hasSpace() {
    const { spaceList } = this
    return spaceList?.length
  },

  /**
   * 更新空间开灯数量
   * ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
   */
  updateRoomCardLightOnNum() {
    const list = {} as Record<string, Device.DeviceItem[]>
    deviceStore.allDeviceList
      .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
      .forEach((device) => {
        if (list[device.spaceId]) {
          list[device.spaceId].push(device)
        } else {
          list[device.spaceId] = [device]
        }
      })

    runInAction(() => {
      spaceStore.spaceDeviceList = list
      spaceStore.spaceList = [...spaceStore.spaceList]
    })
  },

  async updateSpaceList(options?: IApiRequestOption) {
    const res = await querySpaceList(projectStore.currentProjectId, '0', options)
    if (res.success) {
      runInAction(() => {
        spaceStore.spaceList = res.result
        console.log('updateSpaceList', spaceStore.spaceList)
      })
    }
  },

  async updateAllSpaceList(options?: IApiRequestOption) {
    const res = await queryAllSpaceByProjectId(projectStore.currentProjectId, options)
    console.log('updateAllSpaceListres', res)
    if (res.success) {
      runInAction(() => {
        spaceStore.allSpaceList = res.result
        console.log('updateAllSpaceList', spaceStore.allSpaceList)
      })
    }
  },
})

export const spaceBinding = {
  store: spaceStore,
  fields: ['hasSpace', 'allSpaceList', 'spaceList', 'spaceDeviceList', 'currentSpace', 'currentSpaceName'],
  actions: [],
}
