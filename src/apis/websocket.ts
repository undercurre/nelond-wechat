import { getMzaioWSURL } from '../config/index'
import { projectStore } from '../store/index'
import { Logger, storage, strUtil } from '../utils/index'

/**
 * 建立某个空间的webSocket连接
 * @param projectId 项目id
 */
export function connectSocket(projectId: string) {
  const url = strUtil.getUrlWithParams(getMzaioWSURL(), { projectId })

  Logger.log('连接项目socket: ', projectId, projectStore.currentProjectDetail.projectName, url)
  return wx.connectSocket({
    url,
    protocols: [storage.get<string>('token') as string],
    success(res) {
      Logger.log('connectSocket-success', res)
    },
    fail(res) {
      Logger.error('connectSocket-fail', res)
    },
  })
}
