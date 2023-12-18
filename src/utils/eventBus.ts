import mitt, { Emitter } from 'mitt'
import { Logger } from './log'
import { goHome } from './system'
import { StringQueue } from './strUtil'
import { projectStore, userStore } from '../store/index'

type Events = {
  // 网络状态变更通知
  networkStatusChange: {
    networkType: string // 网络类型
    isConnectStatus: boolean // 是否可连接外网
  }
  // 网络状态变更，通知设备列表刷新专用
  deviceListRetrieve: void
  // 从websocket接受到信息 start
  bind_device: {
    deviceId: string
    proType: string
  } // 绑定子设备
  wsReceive: {
    result: {
      eventData: IAnyObject
      eventType: keyof typeof WSEventType
    }
  }
  // 消息推送集合，接收包含云端的ws推送和mqtt的推送消息
  msgPush: {
    source: 'ws' | 'mqtt'
    reqId?: string
    result: {
      topic?: string
      message?: string
      eventData: IAnyObject
      eventType: keyof typeof WSEventType
    }
  }

  group_device_result_status: {
    devId: string
    modelName: string
    errCode: number
  }
  // 从websocket接受到信息 end
  deviceEdit: void
  sceneEdit: void
  projectInfoEdit: void
  invite_user_house: void
  scene_device_result_status: {
    devId: string
    modelName: string
    sceneId: string
    errCode: number // 0 成功，1-失败
  }
  scene_upt: {
    eventType: keyof typeof WSEventType
  }
  scene_add: {
    eventType: keyof typeof WSEventType
  }
  scene_del: {
    eventType: keyof typeof WSEventType
  }
  scene_enabled: {
    eventType: keyof typeof WSEventType
  }

  // 用户退出
  del_house_user: {
    userId: string
  }
}

export const WSEventType = {
  device_property: 'device_property', // 设备状态更新
  device_online_status: 'device_online_status',
  device_offline_status: 'device_offline_status', // 设备强绑后离线事件
  device_del: 'device_del',
  room_del: 'room_del',
  device_replace: 'device_replace', // 设备替换
  connect_success_status: 'connect_success_status', // webSocket连接已建立成功?
  bind_device: 'bind_device',
  invite_user_house: 'invite_user_house', // 用户加入项目
  control_fail: 'control_fail', // 控制失败 TODO 未发现使用逻辑，预留？
  scene_device_result_status: 'scene_device_result_status ', // 创建、编辑场景结果
  group_device_result_status: 'group_device_result_status', // 移动空间结果
  group_upt: 'group_upt', // 分组变更
  screen_online_status_sub_device: 'screen_online_status_sub_device', // 子设备在线状态更新
  screen_online_status_wifi_device: 'screen_online_status_wifi_device', // wifi 设备在线状态更新
  screen_move_sub_device: 'screen_move_sub_device', // 智慧屏设备变更
  project_change_house: 'project_change_house', // 工程移交
  change_house: 'change_house', // 项目转让
  scene_add: 'scene_add', // 场景更新
  scene_upt: 'scene_upt', // 创建场景
  scene_del: 'scene_del', // 场景删除
  scene_enabled: 'scene_enabled', //场景使能切换
  del_house_user: 'del_house_user', // 项目用户被删除
  change_house_user_auth: 'change_house_user_auth', // 用户角色变更
  updateHomeDataLanInfo: 'updateHomeDataLanInfo', // mqtt通知，局域网的设备、灯组列表数据更新
}

export const emitter: Emitter<Events> = mitt<Events>()

// 暂定最多缓存100个msgId,以免缓存的msgId太多，影响性能
const receiveMsgIdQueue = new StringQueue(100)

emitter.on('msgPush', (res) => {
  const { reqId, result } = res
  const { eventType, eventData } = result

  // 目前云端ws仅部分消息类型增加了reqId字段，明确哪个类型的消息需要的云端才会增加
  if (reqId) {
    // 根据reqId判断ws和mqtt推送的消息是否重复，是则不重复处理，忽略该消息
    if (receiveMsgIdQueue.includes(reqId)) {
      Logger.console('✘ 重复push消息：', res)

      return
    }

    receiveMsgIdQueue.push(reqId)
  }

  Logger.console('☄ 推送消息：', res, eventType)

  emitter.emit(eventType as any, eventData)
  emitter.emit('wsReceive', res)

  // 全局加上进入项目的消息提示（暂时方案）
  if (eventType === 'invite_user_house' && eventData) {
    wx.showToast({
      title: eventData as unknown as string, // 强制ts类型转换
      icon: 'none',
    })
  } else if (eventType === 'del_house_user' && userStore.userInfo.userId === eventData.userId) {
    // 仅项目创建者触发监听，监听项目移交是否成功
    wx.showModal({
      content: `你已被退出“${projectStore.currentProjectDetail.projectName}”项目`,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#488FFF',
      complete() {
        projectStore.updateProjectInfo()
        goHome()
      },
    })
  } else if (eventType === 'change_house_user_auth' && userStore.userInfo.userId === eventData.userId) {
    projectStore.updateProjectInfo()
  }
})
