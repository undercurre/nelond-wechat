import { urlParamsJoin, getSSESign } from './util.js'
import { getReqId } from 'm-utilsdk/index'
import { api } from '../common/js/api'
export default class websocket {
  constructor({ heartCheck, isReconnection, initWebSocketObj }) {
    // 是否连接
    this._isLogin = false
    // 当前网络状态
    this._netWork = true
    // 是否人为退出
    this._isClosed = false
    // 心跳检测频率
    this._timeout = 60000
    this._timeoutObj = null
    // 当前重连次数
    this._connectNum = 0
    // 心跳检测和断线重连开关，true为启用，false为关闭
    this._heartCheck = heartCheck
    this._isReconnection = isReconnection

    this._socketTask = null
    this.initWebSocket(initWebSocketObj)
    // this._onSocketOpened()
  }
  // 心跳重置
  _reset() {
    clearTimeout(this._timeoutObj)
    return this
  }
  // 心跳开始
  _start() {
    let context = this
    this._timeoutObj = setInterval(() => {
      // this._socketTask.send wx.sendSocketMessage
      wx.sendSocketMessage({
        // 心跳发送的信息应由前后端商量后决定
        data: JSON.stringify({
          event_type: 5,
        }),
        success(res) {
          console.log(res, '发送心跳成功 success')
        },
        fail(err) {
          console.log(err, '发送心跳失败 err')
          // context._reset()
        },
      })
    }, this._timeout)
  }
  // 监听websocket连接关闭
  onSocketClosed(options) {
    // this._socketTask.onClose wx.onSocketClose
    wx.onSocketClose((err) => {
      console.log('当前websocket连接已关闭,错误信息为:' + JSON.stringify(err))
      // 停止心跳连接
      if (this._heartCheck) {
        this._reset()
      }
      // 关闭已登录开关
      this._isLogin = false
      // 检测是否是用户自己退出小程序
      if (!this._isClosed) {
        // 进行重连
        if (this._isReconnection) {
          this._reConnect(options)
        }
      }
    })
  }
  // 检测网络变化
  onNetworkChange(options) {
    wx.onNetworkStatusChange((res) => {
      console.log('当前网络状态:' + res.isConnected)
      if (!this._netWork) {
        this._isLogin = false
        // 进行重连
        if (this._isReconnection) {
          this._reConnect(options)
        }
      }
    })
  }
  _onSocketOpened() {
    const context = this
    // this._socketTask.onOpen wx.onSocketOpen
    wx.onSocketOpen((res) => {
      console.log(res, 'websocket已打开 heartInterval onSocketOpen')
      // 打开已登录开关
      this._isLogin = true
      // 发送心跳
      if (this._heartCheck) {
        // this._reset()._start()
      }
      // 发送登录信息
      // this._socketTask.send
      // wx.sendSocketMessage({
      //   // 这里是第一次建立连接所发送的信息，应由前后端商量后决定
      //   data: JSON.stringify({
      //     event_type: 5
      //   })
      // })
      // 打开网络开关
      this._netWork = true
    })
  }
  // 接收服务器返回的消息
  onReceivedMsg(callBack) {
    // this._socketTask.onMessage wx.onSocketMessage
    const context = this
    wx.onSocketMessage((res) => {
      let data = res && res.data && JSON.parse(res.data)
      let heartInterval = data && data.data && JSON.parse(data.data) && JSON.parse(data.data).heatbeat_interval
      context._timeout = heartInterval
      if (this._heartCheck && heartInterval) {
        context._reset()._start()
      }
      if (typeof callBack == 'function') {
        callBack(res)
      } else {
        console.log('参数的类型必须为函数')
      }
    })
  }
  // 发送websocket消息
  sendWebSocketMsg(options) {
    // this._socketTask.send  wx.sendSocketMessage
    wx.sendSocketMessage({
      data: options.data,
      success(res) {
        if (typeof options.success == 'function') {
          options.success(res)
        } else {
          console.log('参数的类型必须为函数')
        }
      },
      fail(err) {
        if (typeof options.fail == 'function') {
          options.fail(err)
        } else {
          console.log('参数的类型必须为函数')
        }
      },
    })
  }
  // 重连方法，会根据时间频率越来越慢
  _reConnect(options) {
    let timer,
      context = this
    if (this._connectNum < 20) {
      timer = setTimeout(() => {
        this.initWebSocket(options)
      }, 3000)
      this._connectNum += 1
    } else if (this._connectNum < 50) {
      timer = setTimeout(() => {
        this.initWebSocket(options)
      }, 10000)
      this._connectNum += 1
    } else {
      timer = setTimeout(() => {
        this.initWebSocket(options)
      }, 450000)
      this._connectNum += 1
    }
  }
  // 关闭websocket连接
  closeWebSocket() {
    // this._socketTask.close()
    wx.closeSocket()
    this._isClosed = true
  }
  // 建立websocket连接
  initWebSocket(options) {
    let context = this
    if (this._isLogin) {
      console.log('您已经登录了 socket')
    } else {
      // 检查网络
      wx.getNetworkType({
        success(result) {
          if (result.networkType != 'none') {
            let params = {
              token: getApp().globalData.userData.mdata.accessToken,
              appId: 901,
              req: getReqId(),
              device_id: getApp().globalData.openId,
              reset: 0,
              offset: 0,
              client_type: 2,
            }
            const signUrl = urlParamsJoin(options.url, params)
            let signStr = `${signUrl}&${api.appKey}`
            let sign = getSSESign(signStr)
            const url = `${api.websocketDomain}${signUrl}&sign=${sign}`
            // 开始建立连接
            // context._socketTask =
            wx.connectSocket({
              url,
              header: {
                'content-type': 'application/json',
              },
              success(res) {
                context._isLogin = true
                if (typeof options.success == 'function') {
                  options.success(res)
                } else {
                  console.log('参数的类型必须为函数')
                }
              },
              fail(err) {
                if (typeof options.fail == 'function') {
                  options.fail(err)
                } else {
                  console.log('参数的类型必须为函数')
                }
              },
            })
          } else {
            console.log('网络已断开')
            context._netWork = false
          }
        },
      })
    }
  }
}
