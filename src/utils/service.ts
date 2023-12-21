// service模块存放项目的相关业务代码
import { connectSocket } from '../apis/websocket'
import { projectStore, userStore } from '../store/index'
import { isLogined, Logger, storage, isConnect, verifyNetwork } from './index'
import { emitter } from './eventBus'
import homos from 'js-homos'

export function logout() {
  storage.remove('mobilePhone')
  storage.remove('token')
  storage.remove('localKey') // 清除局域网的项目key
  userStore.logout()
  homos.logout()
  closeWebSocket()

  wx.switchTab({
    url: '/pages/index/index',
  })
}

// WS连接
let socketTask: WechatMiniprogram.SocketTask | null = null
let socketIsConnect = false // socket是否处于连接状态
let connectTimeId = 0 // 连接socket的延时器
let isConnecting = false // 是否正在连接ws

// socket心跳缓存数据
const heartbeatInfo = {
  timeId: 0, // 计时器
  lastMsgId: 0, // 上一次的心跳包消息Id
}

export async function startWebsocketService() {
  // 检测未登录或者是否已经正在连接，以免重复连接
  if (!isLogined() || isConnecting || !isConnect()) {
    Logger.log('不进行ws连接,isConnecting:', isConnecting, 'isLogined', isLogined(), 'isConnect()', isConnect())
    return
  }

  isConnecting = true
  if (socketIsConnect) {
    Logger.log('已存在ws连接，正在关闭已有连接')
    await socketTask?.close({ code: 1000 })
  }
  socketTask = connectSocket(projectStore.currentProjectDetail.projectId)
  socketTask.onClose(onSocketClose)
  socketTask.onOpen((res) => {
    isConnecting = false
    socketIsConnect = true
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
              socketTask?.close({ code: -1 })
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

      Logger.console('Ⓦ 收到ws信息：', res)

      const { topic, message, eventData } = res.result

      if (topic === 'heartbeatTopic') {
        // 缓存上一次收到的心跳包id
        heartbeatInfo.lastMsgId = message.msgId
      } else {
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

    // 可能短时间内连续触发多次onError
    Logger.error('socket错误onError：', err, 'socketIsConnect', socketIsConnect)
    isConnecting = false
    if (socketIsConnect) {
      socketTask?.close({ code: -1 }) // code=-1代码ws报错重连
    } else {
      delayConnectWS(15000)
    }
  })
}

/**
 * 延迟连接ws
 * @param delay 延迟时间
 */
function delayConnectWS(delay = 5000) {
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
  Logger.log('socket已关闭连接', e)
  socketIsConnect = false
  clearInterval(heartbeatInfo.timeId)
  const { code } = e

  if (code !== 1000 && code !== 4001) {
    const delay = code === -1 ? 15000 : 5000 // ws报错重连一般是因为wifi无法访问外网，降低重连频率

    Logger.error('socket异常关闭连接')
    delayConnectWS(delay)
  }
}

export function closeWebSocket() {
  if (socketTask && socketIsConnect) {
    socketTask.close({ code: 1000 })
    socketIsConnect = false
  }
}

emitter.on('networkStatusChange', (res) => {
  // 已登录状态下，可以访问外网且当前没有ws连接的情况，发起ws连接
  if (res.isConnectStatus && isLogined() && !socketIsConnect) {
    startWebsocketService()
  }
})
