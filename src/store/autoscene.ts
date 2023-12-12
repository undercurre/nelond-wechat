import { observable, runInAction } from 'mobx-miniprogram'
import { queryAutoSceneListByHouseId, setAutoSceneEnabled } from '../apis/scene'
import { homeStore } from './home'
import { strUtil } from '../utils/index'
import { PRO_TYPE } from '../config/index'
import { deviceStore } from './device'
import { formLimitString } from '../utils/index'

export const autosceneStore = observable({
  /**
   * 全屋的自动化场景
   */
  allRoomAutoSceneList: [] as AutoScene.AutoSceneItem[],

  get allRoomAutoSceneListComputed() {
    const templist = [...this.allRoomAutoSceneList]
    try {
      return templist.map((item: AutoScene.AutoSceneItem) => {
        if (item.timeConditions !== null) {
          const desc = strUtil.transDesc(item.effectiveTime, item.timeConditions[0])
          item.desc = desc.length > 18 ? desc.substring(0, 18) + '...' : desc
        } else {
          item.desc = ''
        }
        const reg = /^icon-\d+$/ //自动化场景图标统一为该名称格式
        if (!reg.test(item.sceneIcon)) item.sceneIcon = 'icon-1'
        item.deviceActions.forEach((action) => {
          if (action.proType === PRO_TYPE.light) {
            const device = deviceStore.allRoomDeviceFlattenList.find((item) => item.uniId === action.deviceId)
            if (device) {
              runInAction(() => {
                action.controlAction[0] = {
                  ...action.controlAction[0],
                  minColorTemp: device.property!.minColorTemp,
                  maxColorTemp: device.property!.maxColorTemp,
                }
              })
            } else {
              console.log('allRoomAutoSceneListComputed设备不存在', action)
            }
          }
        })
        runInAction(() => {
          item.sceneName = formLimitString(item.sceneName, 13, 9, 2)
        })
        return item
      })
    } catch (e) {
      console.log('自动化场景列表处理出错', e)
      return []
    }
  },

  async changeAutoSceneEnabled(data: { sceneId: string; isEnabled: '1' | '0' }) {
    const res = await setAutoSceneEnabled(data)
    if (res.success) {
      this.allRoomAutoSceneList.forEach((scene) => {
        if (scene.sceneId === data.sceneId) {
          scene.isEnabled = data.isEnabled
        }
      })
      runInAction(() => {
        this.allRoomAutoSceneList = [...this.allRoomAutoSceneList]
      })
    }
  },

  async updateAllRoomAutoSceneList(projectId: string = homeStore.currentProjectId) {
    const res = await queryAutoSceneListByHouseId(projectId)
    console.log('自动化场景列表', res)

    if (res.success) {
      const list = res.result.filter((scene) => scene.deviceActions && scene.deviceActions.length)
      runInAction(() => {
        this.allRoomAutoSceneList = [...list]
      })
    } else {
      this.allRoomAutoSceneList = []
    }
  },
})

export const autosceneBinding = {
  store: autosceneStore,
  fields: ['allRoomAutoSceneList', 'allRoomAutoSceneListComputed'],
  actions: ['updateAllRoomAutoSceneList'],
}
