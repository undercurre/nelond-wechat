import { mzaioWSURL, getEnv } from '../config/index'
import { homeStore } from '../store/index'
import { Logger, storage } from '../utils/index'

/**
 * 建立某个房间的webSocket连接
 * @param houseId 家庭id
 */
export function connectHouseSocket(houseId: string) {
  Logger.log('连接家庭socket: ', houseId, homeStore.currentHomeDetail.houseName)
  return wx.connectSocket({
    url: mzaioWSURL[getEnv()] + houseId,
    protocols: [storage.get<string>('token') as string],
    success(res) {
      Logger.log('connectSocket-success', res)
    },
    fail(res) {
      Logger.error('connectSocket-fail', res)
    },
  })
}
