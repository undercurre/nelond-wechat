import dayjs from 'dayjs'
import { aesUtil, delay, Logger, strUtil } from '../utils/index'
import { isAndroid, isAndroid10Plus } from './system'

let _instance: WifiSocket | null = null

let tcpClient: WechatMiniprogram.TCPSocket | null = null

let udpClient: WechatMiniprogram.UDPSocket | undefined = undefined

export class WifiSocket {
  isAccurateMatchWiFi = true // 是否精确匹配wifi

  time = dayjs().format('HH:mm:ss')

  SSID = ''

  pw = '12345678'

  key = ''

  deviceInfo = {
    ip: '', // 网关默认的ip为192.168.11.1
    udpPort: 6266,
    tcpPort: 6466,
    isConnectTcp: false,
  }

  localIp = ''

  queryWifiTimeId = 0 // 查询当前wiFi延时器

  cmdCallbackMap: IAnyObject = {}

  onMessageHandlerList: ((data: IAnyObject) => void)[] = []

  onWifiConnected?: () => void

  constructor(params: { ssid: string; isAccurateMatchWiFi?: boolean; onWifiConnected?: () => void }) {
    if (_instance && _instance.SSID === params.ssid) {
      Logger.log('WifiSocket实例重用')
      return _instance
    }
    // 防止端口被占用，检查释放之前生成的实例
    if (_instance) {
      Logger.log('防止端口被占用，检查释放之前生成的实例')
      _instance.close()
    }

    this.SSID = params.ssid

    this.isAccurateMatchWiFi = params.isAccurateMatchWiFi ?? true

    this.key = `homlux@midea${params.ssid.substr(-4, 4)}`

    this.queryWifiTimeId = 0

    // 监听设备热点连接事件
    if (params.onWifiConnected) {
      this.onWifiConnected = params.onWifiConnected
    }

    const queryWifi = async () => {
      const isConnected = await this.isConnectDeviceWifi()

      if (isConnected && this.onWifiConnected) {
        this.onWifiConnected()
      } else {
        this.queryWifiTimeId = setTimeout(() => {
          queryWifi()
        }, 2000)
      }
    }

    // 由于onWifiConnected不可靠，在安卓端存在监听不到的情况，改为轮询getConnectedWifi
    queryWifi()

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    _instance = this
  }

  async isConnectDeviceWifi() {
    const connectedRes = await wx.getConnectedWifi().catch((err) => err)

    Logger.log('获取当前wifi信息：', connectedRes)
    let reg = new RegExp(`^${this.SSID}$`)

    // 判断是否精确匹配设备热点·
    if (!this.isAccurateMatchWiFi) {
      reg = new RegExp(`^${this.SSID}.{4}$`)
    }

    if (connectedRes && reg.test(connectedRes.wifi?.SSID)) {
      Logger.log(`检测目标wifi：${this.SSID}已连接`)
      this.key = `homlux@midea${connectedRes.wifi.SSID.slice(-4)}`

      return true
    } else {
      return false
    }
  }

  async connectWifi() {
    // 非准确匹配wifi名的情况或者安卓10+需要手动连接wifi
    const connectRes = await wx
      .connectWifi({
        SSID: this.SSID,
        password: this.pw,
        partialInfo: false,
        maunal: !this.isAccurateMatchWiFi || isAndroid10Plus(), // Android 微信客户端 7.0.22 以上版本，connectWifi 的实现在 Android 10 及以上的手机无法生效，需要配置 maunal 来连接 wifi。详情参考官方文档
      })
      .catch((err) => err)

    Logger.log('wx.connectWifi', connectRes)

    return {
      ...connectRes,
      success: connectRes.errCode === 0 || connectRes.errMsg.includes('ok'),
    }
  }

  async init() {
    const port = this.initUdpSocket()

    if (port === 0) {
      return { errCode: -1, success: false, msg: 'UDP初始化失败' }
    }

    // 延时请求，有可能手机刚加入wifi，还没成功分配好IP，实测IOS需要延时更长
    await delay(isAndroid() ? 1000 : 3000)

    const ipRes = await this.getDeviceIp()

    Logger.log(`getDeviceIp`, ipRes)

    if (!ipRes.success) {
      return { errCode: -1, success: false, msg: '获取IP失败' }
    }

    this.initTcpSocket()

    // 防止还在初始化socket，用户点击触发了connect方法，导致udp重复初始化
    this.queryWifiTimeId = 0

    return { errCode: 0, success: true, msg: '初始化成功' }
  }

  bindUdp = () => {
    const port = udpClient?.bind(6366)

    Logger.log('port', port)

    if (port === 0) {
      wx.showModal({
        content: '端口被占用，无法正常配网，请重启微信',
        showCancel: false,
      })
    }

    return port
  }

  closeUdp = () => {
    udpClient?.close()
  }

  /**
   * 获取手机IP
   */
  getLocalIp() {
    return new Promise((resolve) => {
      wx.getLocalIPAddress({
        success: (successRes) => {
          Logger.log('getLocalIPAddress-success', successRes)

          // IOS偶现返回ip为unknown,安卓可能会获取到0.0.0.0
          if (successRes.localip.includes('.') && successRes.localip !== '0.0.0.0') {
            this.localIp = successRes.localip
            resolve(true)
          } else {
            Logger.error('getLocalIPAddress-fail', successRes)
            resolve(false)
          }
        },
        fail: (failRes) => {
          Logger.error('getLocalIPAddress-fail', failRes)
          resolve(false)
        },
      })
    })
  }

  /**
   * 获取网关IP
   */
  async getDeviceIp() {
    if (this.deviceInfo.ip) {
      return { success: true, msg: '已知IP' }
    }

    await this.sendCmdForDeviceIp()

    // 获取IP重试，存在第一次获取超时的情况，尤其安卓端比较明显
    if (!this.deviceInfo.ip) {
      await this.sendCmdForDeviceIp()
    }

    // udp获取ip失败的情况，从本机Ip推断网关IP
    if (!this.deviceInfo.ip) {
      await this.getLocalIp()

      if (!this.localIp) {
        Logger.log('getLocalIPAddress-第2次')

        await this.getLocalIp()
      }

      if (this.localIp) {
        const arr = this.localIp.split('.')

        arr[arr.length - 1] = '1'

        const ip = arr.join('.')

        Logger.error('获取广播Ip失败，根据本机Ip推断：', ip)
        this.deviceInfo.ip = ip
      }
    }

    // android端，短时间内连续连接、关闭tcpsocket,会卡死甚至崩溃
    // 网关固定IP，优先11.1，ip,冲突才会选择33.1
    // const ipList = ['192.168.11.1', '192.168.33.1']

    // 获取IP失败时，强制默认192.168.11.1
    if (!this.deviceInfo.ip) {
      Logger.error('采用默认Ip：', '192.168.11.1')
      this.deviceInfo.ip = '192.168.11.1'
    }

    return { success: Boolean(this.deviceInfo.ip) }
  }

  // 创建
  connectTcp(IP: string) {
    return new Promise<{ success: boolean; msg?: string }>((resolve) => {
      const start = Date.now()

      const timeId = setTimeout(() => {
        tcpClient?.offConnect()
        resolve({ success: false, msg: 'TCP连接超时' })
      }, 10000)

      const listen = (res: WechatMiniprogram.GeneralCallbackResult) => {
        Logger.log(IP, 'tcpClient.onConnect port：', res)
        Logger.log('TCP连接时间：', Date.now() - start)

        clearTimeout(timeId)
        tcpClient?.offConnect()
        this.deviceInfo.isConnectTcp = true
        resolve({ success: true })
      }

      tcpClient?.onConnect(listen)

      tcpClient?.connect({
        address: IP,
        port: this.deviceInfo.tcpPort,
        timeout: 10,
      })
    })
  }

  initTcpSocket() {
    // 安卓端，如果tcp实例连接失败过，再重新调用connect接口可能会出现小程序闪退。新的连接需要使用新实例避免该问题
    tcpClient = wx.createTCPSocket()

    tcpClient?.onMessage((res) => {
      this.handleReply(res.message)
    })

    tcpClient?.onError((res) => {
      Logger.log('tcpClient.onError', res)

      // tcp连接被设备端主动关闭的情况处理
      if (res.errMsg.includes('close') && this.deviceInfo.isConnectTcp) {
        this.deviceInfo.isConnectTcp = false
        tcpClient?.close()
      }
    })

    tcpClient?.onClose((res) => {
      Logger.log('tcpClient.onClose', res)
      this.deviceInfo.isConnectTcp = false
    })
  }

  closeTcp() {
    tcpClient?.close()
  }

  initUdpSocket() {
    udpClient = wx.createUDPSocket()

    const port = this.bindUdp()

    udpClient.onMessage((res) => {
      this.handleReply(res.message)
    })

    udpClient.onError((res) => {
      Logger.log('udpClient.onError', res)
    })

    udpClient.onClose((res) => {
      Logger.log('udpClient.onClose', res)
    })

    return port
  }

  handleReply(message: ArrayBuffer) {
    const reply = decodeCmd(message, this.key)
    const callback = this.cmdCallbackMap[reply.reqId]

    if (callback) {
      callback(reply.data)

      delete this.cmdCallbackMap[reply.reqId] // 删除已经执行的callback
    } else {
      this.onMessageHandlerList.map((handler) => handler(reply))
    }
  }

  async sendCmdForDeviceIp() {
    const res = await this.sendCmd({
      topic: '/gateway/net/serverip', //指令名称:获取网关IP
      data: {},
      method: 'UDP',
    })

    if (res.errorCode === 0) {
      this.deviceInfo.ip = res.ip
    }
  }

  /**
   * 发送udp/tcp指令
   * @param params
   */
  async sendCmd(params: { topic: string; data: IAnyObject; method?: 'TCP' | 'UDP' }) {
    try {
      params.method = params.method || 'TCP'

      if (params.method === 'TCP' && !this.deviceInfo.isConnectTcp) {
        await this.connectTcp(this.deviceInfo.ip)
      }

      return new Promise<{ errorCode: number; success: boolean } & IAnyObject>((resolve) => {
        const reqId = Date.now().toString()

        const msgData = {
          reqId,
          topic: params.topic, //指令名称:获取网关IP
          data: params.data,
        }

        Logger.log(`${params.method}-send: ${params.topic}`, msgData)

        const message = aesUtil.encrypt(JSON.stringify(msgData), this.key)
        const sendMsg = strUtil.hexStringToArrayBuffer(message)

        // 超时回复处理
        const timeoutId = setTimeout(() => {
          Logger.error(`${params.method}-超时回复:`, params.topic)
          this.cmdCallbackMap[reqId] && delete this.cmdCallbackMap[reqId]
          resolve({ errorCode: -1, msg: '请求超时', success: false })
        }, 6000)
        // 由于设备端是异步上报对应的消息回复，通过reqId注册对应命令的消息回调，
        // 后续在消息监听onmessage通过reqId匹配并把对应的回复resolve，达到同步调用的效果
        this.cmdCallbackMap[reqId] = (data: { errorCode: number } & IAnyObject) => {
          Logger.log(`${params.method}-res:`, params.topic, data)
          clearTimeout(timeoutId)
          Logger.debug('指令发送-回复时间：', Date.now() - parseInt(reqId))

          resolve({
            ...data,
            success: data.errorCode === 0,
          })
        }

        params.method === 'TCP'
          ? tcpClient?.write(sendMsg)
          : udpClient?.send({
              address: '255.255.255.255',
              port: this.deviceInfo.udpPort,
              message: sendMsg,
              setBroadcast: true,
            })
      })
    } catch (err) {
      return { errorCode: -1, msg: err, success: false }
    }
  }

  /**
   "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
   "method":"wifi" //无线配网："wifi"，有线配网:"eth"
   */
  async getGatewayStatus() {
    const res = await this.sendCmd({
      topic: '/gateway/net/status',
      data: {},
    })

    if (!res.success) {
      Logger.error('查询网关状态失败')
    }

    // 强制绑定判断标志  "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定

    return res
  }

  /**
   * 释放相关资源
   */
  close(msg?: string) {
    if (!_instance) {
      return
    }

    Logger.log('socket实例close', msg)
    this.cmdCallbackMap = {}
    this.onMessageHandlerList = []

    if (this.deviceInfo.isConnectTcp) {
      Logger.log('tcpClient.close()')
      tcpClient?.close()
    }

    udpClient?.close()

    // 清除查询是否连接设备热点查询及回调
    if (this.queryWifiTimeId !== 0) {
      clearTimeout(this.queryWifiTimeId)
      this.queryWifiTimeId = 0
    }
    this.onWifiConnected = undefined

    _instance = null
  }

  /**
   * 监听udp广播
   * @param handler
   */
  onMessage(handler: (data: IAnyObject) => void) {
    if (handler) {
      this.onMessageHandlerList.push(handler)
    }
  }
}

function decodeCmd(message: ArrayBuffer, key: string) {
  const msg = strUtil.ab2hex(message)

  const reply = aesUtil.decrypt(msg, key)

  return JSON.parse(reply) as { topic: string; reqId: string; data: IAnyObject }
}
