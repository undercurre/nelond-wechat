import { observable, runInAction } from 'mobx-miniprogram'
import { querySceneListByHouseId } from '../apis/scene'
import { PRO_TYPE } from '../config/device'
import { homeStore } from './home'
import { roomStore } from './room'
import { IApiRequestOption } from '../utils'

export const sceneStore = observable({
  /**
   * 全屋的场景
   */
  allRoomSceneList: [] as Scene.SceneItem[],

  /**
   * 准备添加到场景的actions
   */
  addSceneActions: [] as Device.ActionItem[],

  get sceneIdMap(): Record<string, Scene.SceneItem> {
    return Object.fromEntries(this.allRoomSceneList.map((scene) => [scene.sceneId, scene]))
  },

  /**
   * 当前房间场景
   */
  get sceneList(): Scene.SceneItem[] {
    const { spaceId } = roomStore.currentRoom
    const roomDeviceList = roomStore.roomDeviceList[spaceId]
    const hasSwitch = roomDeviceList?.some((device) => device.proType === PRO_TYPE.switch) ?? false
    const hasLight = roomDeviceList?.some((device) => device.proType === PRO_TYPE.light) ?? false

    let list = this.allRoomSceneList.filter((scene) => scene.spaceId === spaceId && scene.deviceActions?.length > 0)

    if (!hasSwitch && !hasLight) {
      // 四个默认场景都去掉
      list = list.filter((scene) => scene.isDefault === '0')
    } else if (hasSwitch && !hasLight) {
      // 只有开关，去掉默认的明亮、柔和
      list = list.filter((scene) => !['2', '3'].includes(scene.defaultType))
    }
    return list.sort((a, b) => a.orderNum - b.orderNum)
  },

  // 房间场景映射，未被使用，可删除
  get roomSceneList(): Record<string, Scene.SceneItem[]> {
    const data = {} as Record<string, Scene.SceneItem[]>
    this.allRoomSceneList.forEach((scene) => {
      if (data[scene.spaceId]) {
        data[scene.spaceId].push(scene)
        return
      }
      data[scene.spaceId] = [scene]
    })
    return data
  },

  /**
   * 关联场景关系映射
   * sceneId -> switchUniId
   */
  get sceneSwitchMap(): Record<string, string> {
    const map = {} as Record<string, string>
    this.allRoomSceneList.forEach((scene) => {
      scene.deviceConditions?.forEach((condition) => {
        map[scene.sceneId] = `${condition.deviceId}:${condition.controlEvent[0].modelName}`
      })
    })
    return map
  },

  async updateAllRoomSceneList(projectId: string = homeStore.currentProjectId, options?: IApiRequestOption) {
    const res = await querySceneListByHouseId(projectId, options)
    if (res.success) {
      const list = res.result
        .filter((scene) => scene.deviceActions && scene.deviceActions.length)
        .sort((a, b) => a.orderNum - b.orderNum)
      runInAction(() => {
        this.allRoomSceneList = [...list]
      })
    }
  },

  addCondition(updateSceneDto: Scene.UpdateSceneDto) {
    const scene = this.allRoomSceneList.find(
      (item) => updateSceneDto.sceneId && item.sceneId === updateSceneDto.sceneId,
    )
    if (scene) {
      runInAction(() => {
        scene.deviceConditions = updateSceneDto.deviceConditions!
      })
    }
  },

  removeCondition(sceneId: string) {
    const scene = this.allRoomSceneList.find((item) => sceneId && item.sceneId === sceneId)
    if (scene) {
      runInAction(() => {
        scene.deviceConditions = []
      })
    }
  },
})

export const sceneBinding = {
  store: sceneStore,
  fields: ['sceneList', 'allRoomSceneList', 'addSceneActions'],
  actions: [],
}
