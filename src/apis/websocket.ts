import { mzaioWSURL, getEnv } from '../config/index'
import { homeStore } from '../store/index'
import { Logger, storage } from '../utils/index'

/**
 * 建立某个房间的webSocket连接
 * @param projectId 家庭id
 */
export function connectHouseSocket(projectId: string) {
  Logger.log('连接家庭socket: ', projectId, homeStore.currentProjectDetail.projectName)
  return wx.connectSocket({
    url: mzaioWSURL[getEnv()] + projectId,
    protocols: [storage.get<string>('token') as string],
    success(res) {
      Logger.log('connectSocket-success', res)
    },
    fail(res) {
      Logger.error('connectSocket-fail', res)
    },
  })
}
