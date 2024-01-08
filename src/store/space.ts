import { observable, runInAction } from 'mobx-miniprogram'
import { queryAllSpaceByProjectId, querySpaceList } from '../apis/index'
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

  // 当前选中的空间栈
  currentSpaceSelect: [] as Space.allSpace[],

  // 当前选中空间栈的末端，即真正存放内容的空间
  get currentSpace(): Space.allSpace {
    if (this.currentSpaceSelect.length) {
      return this.currentSpaceSelect[this.currentSpaceSelect.length - 1]
    } else {
      const defaultSpace = this.allSpaceList.find((item) => item.publicSpaceFlag === 1 || item.spaceLevel === 4) || {
        pid: '',
        spaceId: '',
        spaceLevel: 4,
        spaceName: '',
        publicSpaceFlag: 0,
      } // 当选中空间队列为空时,取第一个叶子节点

      return defaultSpace
    }
  },
  // 当前选中空间名称
  get currentSpaceName(): string {
    return this.currentSpace?.spaceName ?? ''
  },

  // 当前选中空间全路径名称
  get currentSpaceNameFull(): string {
    return this.getSpaceFullName(this.currentSpace)
  },

  get hasSpace() {
    const { spaceList } = this
    return spaceList?.length
  },

  /**
   * 获取指定空间的完整名称
   */
  getSpaceFullName(space: Space.allSpace): string {
    if (space.pid === '0') {
      return space.spaceName
    }

    const parentSpace = spaceStore.allSpaceList.find((item) => item.spaceId === space.pid) as Space.allSpace

    return `${parentSpace.pid === '0' ? parentSpace.spaceName : this.getSpaceFullName(parentSpace)},${space.spaceName}`
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
        spaceStore.spaceList = res.result.map((s) => ({
          ...s,
          pid: '0',
        }))
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
