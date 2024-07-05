// service模块存放项目的相关业务代码
import { projectStore, userStore, deviceStore } from '../store/index'
import { connectSocket } from '../apis/websocket'
import { MAX_DEVICES_USING_WS } from '../config/index'
import { isLogined, Logger, storage, verifyNetwork } from './index'
import { emitter } from './eventBus'
import homos from 'js-homos'

export function logout(isRedirect = true) {
  // 退出登录，清除账号相关本地缓存数据
  storage.remove('mobilePhone')
  storage.remove('token')
  storage.remove('ROLELIST')
  storage.remove('USERNAME')
  storage.remove('CURRENTPROJECTID')
  storage.remove('HOMEDATA')
  storage.remove('localKey') // 清除局域网的项目key
  userStore.logout()
  projectStore.reset() // 清空项目数据
  homos.logout()
  closeWebSocket()

  if (isRedirect) {
    wx.switchTab({
      url: '/pages/index/index',
    })
  }
}

// WS连接
let socketTask: WechatMiniprogram.SocketTask | null = null
let connectTimeId = 0 // 连接socket的延时器
let isConnecting = false // 是否正在连接ws

// socket心跳缓存数据
const heartbeatInfo = {
  timeId: 0, // 计时器
  lastMsgId: 0, // 上一次的心跳包消息Id
}

export function isWsConnected() {
  return !!socketTask
}

export async function startWebsocketService() {
  // 检测未登录或者是否已经正在连接，以免重复连接
  if (!isLogined() || isConnecting || !projectStore.currentProjectId) {
    Logger.log(
      '未登录或者已经正在连接，不进行ws连接,isConnecting:',
      isConnecting,
      'isLogined',
      isLogined(),
      'projectStore.currentProjectId',
      projectStore.currentProjectId,
    )
    return
  }

  isConnecting = true
  if (socketTask) {
    Logger.log('已存在ws连接，正在关闭已有连接')
    await closeWebSocket()
  }
  socketTask = connectSocket(projectStore.currentProjectId)
  socketTask.onClose(onSocketClose)
  socketTask.onOpen((res) => {
    isConnecting = false
    Logger.log('socket连接成功', res)

    // 30秒发一次心跳
    heartbeatInfo.timeId = setInterval(() => {
      const msgId = Date.now().valueOf()

      socketTask?.send({
        data: JSON.stringify({
          topic: 'heartbeatTopic',
          message: {
            msgId,
          },
        }),
        success() {
          setTimeout(() => {
            // 根据onMessage监听topic === 'heartbeatTopic'消息，判断是否收到心跳回复，3s超时
            if (msgId !== heartbeatInfo.lastMsgId) {
              // 3s内没有收到发出的心跳回复，认为socket断开需要重连
              Logger.error('socket心跳回复超时，重连')
              // 微信隐藏逻辑 closeSocket:fail wcwss invalid code, the code must be either 1000, or between 3000 and 4999
              closeWebSocket(3000, 'socket心跳回复超时')
              clearInterval(heartbeatInfo.timeId)
            } else {
              Logger.log('socket心跳回复')
            }
          }, 3000)
        },
        fail(res) {
          Logger.error('socket心跳包-fail', res)
        },
      })
    }, 30000)
  })
  socketTask.onMessage((e) => {
    try {
      const res = JSON.parse(e.data as string)

      Logger.console('Ⓦ 收到ws信息：', res.result.eventType ?? '', res.result.eventData ?? res.result)

      const { topic, message, eventData, eventType } = res.result

      if (topic === 'heartbeatTopic') {
        // 缓存上一次收到的心跳包id
        heartbeatInfo.lastMsgId = message.msgId
      }
      // 设备较多时禁用基于消息更新单一设备的机制
      else if (eventType !== 'device_property' || deviceStore.allDeviceList.length < MAX_DEVICES_USING_WS) {
        emitter.emit('msgPush', {
          source: 'ws',
          reqId: eventData.reqId,
          result: res.result,
        })
      }
    } catch (err) {
      Logger.error('接收到socket信息：', e.data)
      Logger.error('转json失败：', err)
    }
  })
  socketTask.onError(async (err) => {
    // 发生错误一般由于网络问题，先检查网络可访问性
    await verifyNetwork()

    Logger.error('socket错误onError：', err, 'socketTask', socketTask)
    isConnecting = false
    const closeRes = await closeWebSocket(3000, 'socket错误') // ws报错重连

    // 进入小程序后socket从未成功连接(连接报错,如tls错误\断网的情况),关闭socket会失败,无法通过关闭回调进行重连,需要额外增加sokcet重试逻辑
    if (!closeRes) {
      delayConnectWS(30000)
    }
  })
}

/**
 * 延迟连接ws
 * @param delay 延迟时间
 */
function delayConnectWS(delay = 5000) {
  Logger.log('socket延迟重连', delay)
  clearTimeout(connectTimeId)
  connectTimeId = setTimeout(() => {
    Logger.log('socket开始重连')
    startWebsocketService()
  }, delay)
}

export function socketSend(data: string | ArrayBuffer) {
  if (!socketTask) {
    Logger.error('[socketSend] socketTask 未正常连接')
    return
  }
  socketTask.send({
    data,
    success(res) {
      Logger.console('发送成功', res)
    },
    fail(res) {
      Logger.error(res)
    },
  })
}

/**
 *
 * @param e.code  -1:ws报错重连  1000: 正常主动关闭ws  4001: token校验不通过
 */
function onSocketClose(e: WechatMiniprogram.SocketTaskOnCloseCallbackResult) {
  Logger.debug('socket已关闭连接', e)
  clearInterval(heartbeatInfo.timeId)
  const { code } = e

  if (code !== 1000 && code !== 4001) {
    const delay = code === 3000 ? 15000 : 5000 // ws报错重连一般是因为wifi无法访问外网，降低重连频率

    Logger.error('socket异常关闭连接')
    delayConnectWS(delay)
  }
}

export function closeWebSocket(code = 1000, reason = '正常主动关闭'): Promise<boolean> {
  // 关闭socket，需要把之前相关socket变量重置
  isConnecting = false
  clearTimeout(connectTimeId) // 取消准备重连的计时器

  return new Promise((resolve) => {
    if (socketTask) {
      Logger.debug('开始关闭WebSocket')
      socketTask.close({
        code,
        reason,
        success(res) {
          Logger.debug('closeWebSocket-success', res, socketTask)
          resolve(true)
        },
        fail(res) {
          Logger.debug('closeWebSocket-fail', res)
          resolve(false)
        },
      })
      socketTask = null
    } else {
      resolve(true)
    }
  })
}

emitter.on('networkStatusChange', (res) => {
  // 已登录状态下，可以访问外网且当前没有ws连接的情况，发起ws连接
  if (res.isConnectStatus && isLogined() && !socketTask) {
    delayConnectWS(3000)
  }
})
