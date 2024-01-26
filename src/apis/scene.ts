import { IApiRequestOption, Logger, mzaioRequest } from '../utils/index'
import homOs from 'js-homos'
import { sceneStore } from '../store/index'

export async function querySceneList(spaceId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/querySceneListByRoomId',
    data: {
      spaceId,
    },
  })
}

export async function querySceneListByProjectId(projectId: string, options?: IApiRequestOption) {
  return await mzaioRequest.post<Scene.SceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    isDefaultErrorTips: options?.isDefaultErrorTips ?? true,
    url: '/v1/mzgd/cl/scene/querySceneListByProjectId',
    data: {
      projectId,
    },
  })
}

export async function addScene(data: Scene.AddSceneDto | AutoScene.AddAutoSceneDto, options?: { loading?: boolean }) {
  return await mzaioRequest.post<{ sceneId: string }>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/addScene',
    data,
  })
}

/**
 * 场景重试
 */
export async function retryScene(
  data: { deviceActions: Scene.DeviceAction[]; sceneId: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/sceneRetry',
    data,
  })
}

export async function execScene(sceneId: string, options?: { loading?: boolean }) {
  const sceneItem = sceneStore.allRoomSceneList.find((item) => item.sceneId === sceneId)

  if (homOs.isSupportLan({ sceneId, updateStamp: sceneItem?.updateStamp })) {
    const localRes = await homOs.sceneExecute(sceneId)

    Logger.log('localRes', localRes)

    if (localRes.success) {
      return localRes
    } else {
      Logger.error('局域网调用失败，改走云端链路')
    }
  }

  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/sceneControl',
    data: {
      sceneId,
    },
  })
}

export async function deleteScene(sceneId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/deleteScene',
    data: {
      sceneId,
    },
  })
}

export async function updateScene(
  data: Scene.UpdateSceneDto | AutoScene.AddAutoSceneDto,
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/updateScene',
    data,
  })
}

export async function updateSceneSort(
  data: { sceneSortList: { orderNum: number; sceneId: string }[] },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/updateSceneSort',
    data,
  })
}

export async function queryAutoSceneListByProjectId(projectId: string, options?: { loading?: boolean }) {
  return await mzaioRequest.post<AutoScene.AutoSceneItem[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/queryAutoSceneListByProjectId',
    data: {
      projectId,
    },
  })
}

export async function queryAutoSceneLogByHouseId(
  data: { projectId: string; reportTs?: number },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<AutoScene.AutoSceneLog[]>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/querySceneLog',
    data,
  })
}

export async function setAutoSceneEnabled(
  data: { sceneId: string; isEnabled: string },
  options?: { loading?: boolean },
) {
  return await mzaioRequest.post<IAnyObject>({
    log: true,
    loading: options?.loading ?? false,
    url: '/v1/mzgd/cl/scene/setSceneEnabled',
    data,
  })
}
