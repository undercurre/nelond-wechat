import { deviceStore, projectStore } from '../store/index'
import homOs from 'js-homos'
import { Logger, emitter, debounce, isLogined } from './index'

export async function initHomeOs() {
  const isLogin = isLogined()

  if (!isLogin || !projectStore.currentProjectId) {
    Logger.debug('initHomeOs终止, projectStore.currentProjectId:', projectStore.currentProjectId, isLogin)
    return
  }

  await projectStore.initLocalKey()

  // 调试阶段可写死传递host参数，PC模拟调试
  homOs.login({
    homeId: projectStore.currentProjectDetail.projectId,
    key: projectStore.key,
    // host: { "ip": "192.168.3.9", "devId": "1694507652870764", SSID: 'test' },
  })

  homOs.onMessage((res: { topic: string; reqId?: string; data: IAnyObject; ts: string }) => {
    const { topic, reqId, data } = res

    // 子设备状态变更
    if (topic === '/local/subDeviceStatus') {
      const deviceInfo = data.deviceStatusInfoList[0]

      emitter.emit('msgPush', {
        source: 'mqtt',
        reqId: reqId,
        result: {
          eventType: 'device_property',
          eventData: {
            deviceId: deviceInfo.devId,
            event: deviceInfo.deviceProperty,
            modelName: deviceInfo.modelName,
          },
        },
      })
    } else if (topic === 'updateDeviceListLan' || topic === 'updateGroupListLan') {
      Logger.console('mqtt局域网项目设备、灯组数据更新')
      updateHomeDataLanInfo() // 防抖处理
    } else {
      Logger.console('➤ 未处理的mqtt推送：', res)
    }
  })
}

/**
 * 局域网项目设备、灯组数据更新
 */
const updateHomeDataLanInfo = debounce(() => {
  Logger.console('触发局域网项目数据更新')
  deviceStore.updateAllDeviceListLanStatus()
  emitter.emit('msgPush', {
    source: 'mqtt',
    result: {
      eventType: 'updateHomeDataLanInfo',
      eventData: {},
    },
  })
}, 2000)
