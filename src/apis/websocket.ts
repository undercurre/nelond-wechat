import { mzaioWSURL, getEnv } from '../config/index'
import { projectStore } from '../store/index'
import { Logger, storage } from '../utils/index'

/**
 * 建立某个空间的webSocket连接
 * @param projectId 项目id
 */
export function connectHouseSocket(projectId: string) {
  Logger.log('连接项目socket: ', projectId, projectStore.currentProjectDetail.projectName)
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
