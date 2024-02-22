import { aesUtil, delay, isAndroid, Logger, strUtil } from '../utils/index'

// 定义了与BLE通路相关的所有事件/动作/命令的集合；其值域及表示意义为：对HOMLUX设备主控与app之间可能的各种操作的概括分类
export const CmdTypeMap = {
  DEVICE_CONTROL: 0x00, // 控制
  DEVICE_INFO_QUREY: 0x01, // 查询
  REPORT_NO_ACK: 0x02, // 消息上报类,不需app端回复
  REPORT_WITH_ACK: 0x03, // 消息上报类,须应答的上报
  SECURITY_OPERATE: 0x04, // 安全操作
} as const

export const REPORT_TYPE = {
  REPORT_MCU_SET_FACTORY: '00', // 上报恢复出厂设置
  REPORT_ONOFF_STATUS: '01', // 上报设备开关
  REPORT_LIGHT_STATUS: '02', // 上报灯光状态
  REPORT_CONFIG_ZIGBEE_NET_RESULT: '03', // 上报ZigBee配网结果
} as const

// 记录正在连接过的蓝牙子设备实例
const deviceUuidMap: Record<string, BleClient> = {}

// 蓝牙回复结果
interface IBleResult {
  code: string // 命令
  data: string // 设备回复的Parameter内容
  success: boolean // 是否执行成功
  msg: string
}

// 蓝牙上报结果
interface IBleReportData {
  type: string // 上报类型
  data: string // 设备上报的Parameter内容
  mac: string // 上报的设备mac
  deviceId: string // 上报的设备deviceId
}

// 声明一个函数类型
type BleCmdCallbackType = (data: IBleResult) => void

export const connectList: string[] = [] // 测试用，监控蓝牙连接和断开是否成对调用
export const closeList: string[] = [] // 测试用，监控蓝牙连接和断开是否承兑调用

// 设备在zigbee入网时的角色
export const ZIGBEE_ROLE = {
  router: 0x00, // 作为准备加入网络的新节点
  coord: 0x01, // 作为自组网的起始路由节点
  entry: 0x02, // 作为已存在的自组网络的入网节点，供新节点加入
}

export class BleClient {
  mac: string
  key = ''
  proType = '' // 品类，用于数据埋点
  modelId = '' // 型号，用于数据埋点
  protocolVersion = ''

  deviceUuid: string
  serviceId = 'BAE55B96-7D19-458D-970C-50613D801BC9'
  characteristicId = '' // 灯具和面板的uid不一致，同类设备的uid是一样的
  msgId = 0

  cmdCallbackMap: Record<string, BleCmdCallbackType> = {}

  // 监听蓝牙消息
  onMessage?: (data: IBleReportData) => void

  constructor(params: {
    mac: string
    deviceUuid: string
    proType: string
    modelId: string
    protocolVersion: string
    onMessage?: (data: IBleReportData) => void
  }) {
    const { mac, deviceUuid, modelId, proType, protocolVersion, onMessage } = params

    this.mac = mac
    this.deviceUuid = deviceUuid
    this.modelId = modelId
    this.proType = proType
    this.protocolVersion = protocolVersion

    if (onMessage) {
      this.onMessage = onMessage
    }

    // 密钥为：midea@homlux0167   (0167为该设备MAC地址后四位
    this.key = `midea@homlux${mac.substr(-4, 4)}`
  }

  async connect() {
    const date1 = Date.now()

    Logger.log(`【${this.mac}】开始连接蓝牙`)

    // 会出现createBLEConnection一直没返回的情况（低概率）
    // 微信bug，安卓端timeout参数无效
    connectList.push(this.mac)

    deviceUuidMap[this.deviceUuid] = this

    const connectRes = await wx
      .createBLEConnection({
        deviceId: this.deviceUuid, // 搜索到设备的 deviceId
        timeout: 15000,
      })
      .catch((err: WechatMiniprogram.BluetoothError) => err)

    const costTime = Date.now() - date1

    Logger.log(`【${this.mac}】 connectRes`, connectRes, `连接蓝牙时间： ${costTime}ms`)

    wx.reportEvent('connect_ble', {
      pro_type: this.proType,
      model_id: this.modelId,
      cost_time: costTime,
    })

    // 判断是否连接蓝牙，0为连接成功，-1为已经连接
    // 避免-1的情况，因为安卓如果重复调用 wx.createBLEConnection 创建连接，有可能导致系统持有同一设备多个连接的实例，导致调用 closeBLEConnection 的时候并不能真正地断开与设备的连接。占用蓝牙资源
    if (connectRes.errCode !== 0 && connectRes.errCode !== -1) {
      throw {
        code: -1,
        error: connectRes,
      }
    }

    // 存在蓝牙信号较差的情况，连接蓝牙设备后会中途断开的情况，需要做对应异常处理，超时处理
    const initRes = await Promise.race([
      this.initBleService(),
      delay(10000).then(() => ({ success: false, error: '获取蓝牙服务信息超时' })),
    ])

    if (!initRes.success) {
      throw {
        ...initRes,
        code: -1,
      }
    }

    return {
      code: 0,
      error: connectRes,
    }
  }

  async initBleService() {
    try {
      this.cmdCallbackMap = {}
      // 连接后蓝牙突然断开，下面的接口会无返回也不会报错，需要超时处理
      // 连接成功，获取服务,IOS无法跳过该接口，否则后续接口会报100004，找不到服务

      if (!isAndroid()) {
        await wx
          .getBLEDeviceServices({
            deviceId: this.deviceUuid,
          })
          .catch((err) => {
            throw err
          })
      }

      // IOS无法跳过该接口，否则后续接口会报10005	no characteristic	没有找到指定特征
      const characRes = await wx
        .getBLEDeviceCharacteristics({
          deviceId: this.deviceUuid,
          serviceId: this.serviceId,
        })
        .catch((err) => {
          throw err
        })

      // 取第一个属性（固定，为可写可读可监听），不同品类的子设备的characteristicId不一样，同类的一样
      const characteristicId = characRes.characteristics[0].uuid
      this.characteristicId = characteristicId

      await wx
        .notifyBLECharacteristicValueChange({
          deviceId: this.deviceUuid,
          serviceId: this.serviceId,
          characteristicId: this.characteristicId,
          state: true,
          type: 'notification',
        })
        .catch((err) => {
          throw err
        })

      // 强行延迟，安卓平台上，在调用 wx.notifyBLECharacteristicValueChange 成功后立即调用 wx.writeBLECharacteristicValue ，在部分机型上会发生 10008 系统错误
      if (isAndroid()) {
        await delay(500)
      }

      return {
        success: true,
      }
    } catch (err) {
      return {
        success: false,
        error: err,
      }
    }
  }

  async close() {
    Logger.log(`【${this.mac}】${this.deviceUuid}开始关闭蓝牙连接`)
    if (connectList.includes(this.mac)) {
      const index = connectList.findIndex((item) => item === this.mac)

      connectList.splice(index, 1)
    } else {
      closeList.push(this.mac)
    }
    // 偶现调用closeBLEConnection后没有任何返回，需要手动增加超时处理
    const res = await Promise.race([
      wx.closeBLEConnection({ deviceId: this.deviceUuid }).catch((err) => err),
      delay(5000).then(() => 'closeBLEConnection超时'),
    ])

    // 存在调用关闭蓝牙连接指令和与设备蓝牙连接真正断开有时间差，强制等待1s
    await delay(1000)

    Logger.log(`【${this.mac}】closeBLEConnection`, res)

    // 偶现IOS端onBLEConnectionStateChange监听某个设备的蓝牙连接状态变化丢了，导致bleDeviceMap存储的状态不准确，
    // 手动维护状态
    if (res.errCode === 0) {
      bleDeviceMap[this.deviceUuid] = false
    }

    delete deviceUuidMap[this.deviceUuid]
  }

  async sendCmd(params: { cmdType: number; data: Array<number> }) {
    try {
      const isConnected = bleDeviceMap[this.deviceUuid]

      if (!isConnected) {
        const connectRes = await this.connect()

        if (connectRes.code === -1) {
          throw connectRes
        }
      } else {
        Logger.log(`【${this.mac}】蓝牙已连接`)
      }

      const { cmdType, data } = params

      // msgId只占一个字节，最大255
      this.msgId = this.msgId >= 255 ? 0 : this.msgId + 1

      const msgId = this.msgId // 等待回复的指令msgId
      // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
      // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
      const cmdArr = [cmdType, msgId, 0x00]

      cmdArr.push(...data)

      cmdArr[2] = cmdArr.length

      cmdArr.push(bleUtil.getCheckNum(cmdArr))

      const hexArr = cmdArr.map((item) => item.toString(16).padStart(2, '0').toUpperCase())

      Logger.log(`【${this.mac}】蓝牙指令发起--${hexArr}`)

      const msg = aesUtil.encrypt(hexArr.join(''), this.key, 'Hex')

      const buffer = strUtil.hexStringToArrayBuffer(msg)

      const begin = Date.now()

      let timeId = 0

      return new Promise<IBleResult>((resolve, reject) => {
        // 超时处理
        timeId = setTimeout(() => {
          reject('蓝牙指令回复超时')
        }, 8000)

        this.cmdCallbackMap[msgId] = (data) => {
          resolve(data)
        }

        wx.writeBLECharacteristicValue({
          deviceId: this.deviceUuid,
          serviceId: this.serviceId,
          characteristicId: this.characteristicId,
          value: buffer,
        })
          .then(() => {
            Logger.log(`【${this.mac}】writeBLECharacteristicValue`)
          })
          .catch((err) => {
            reject(err)
          })
      })
        .then((res) => {
          Logger.log(`【${this.mac}】蓝牙指令回复时间： ${Date.now() - begin}ms`, res)

          return res
        })
        .catch(async (err) => {
          // todo: 暂时找不到方法和下面的catch逻辑合并处理
          Logger.error(`【${this.mac}】promise-sendCmd-err`, err, `蓝牙连接状态：${bleDeviceMap[this.deviceUuid]}`)

          await this.close() // 异常关闭需要主动配合关闭连接closeBLEConnection，否则资源会被占用无法释放，导致无法连接蓝牙设备

          return {
            code: '-1',
            success: false,
            msg: err,
            data: '',
          }
        })
        .finally(() => {
          clearTimeout(timeId)
        })
    } catch (err) {
      Logger.error(`【${this.mac}】sendCmd-err`, err, `蓝牙连接状态：${bleDeviceMap[this.deviceUuid]}`)
      await this.close() // 异常关闭需要主动配合关闭连接closeBLEConnection，否则资源会被占用无法释放，导致无法连接蓝牙设备
      return {
        code: '-1',
        success: false,
        error: err,
        data: '',
      }
    }
  }

  /**
   *
   * @param channel 设备配网所要入的信道  0x00：默认不设定
   * @param panId 设备配网所要入网的网络所在的网络标识符  0x0000：默认不设定
   * @param extPanId 要入网的extended panid, 16位的16进制数字符串
   * @param role 设备在zigbee入网时的角色 0x00:：作为router进入配网  0x01：作为coord进入配网（本地组网）  0x02：作为已入网设备开启入网权限（限本地组网）
   */
  async startZigbeeNet({ channel = 0, panId = 0, extPanId = '', role = ZIGBEE_ROLE.router }) {
    Logger.debug(`【${this.mac}】startZigbeeNet, channel: ${channel}`, panId, extPanId, 'role', role)

    // 若panId为65535（0xFFFF），无效,导致无法成功配网，强制改为0
    if (panId === 65535) {
      panId = 0
    }

    let parameter = [0x00, channel]
    const protocolVersion = parseInt(this.protocolVersion, 10) // 蓝牙协议版本

    if (protocolVersion >= 2) {
      extPanId = extPanId || '0'.padStart(16, '0')
      const panIdHexArr = bleUtil.transferHexToBleData(panId, 2)
      const exPanIdHexArr = strUtil.hexStringToBytes(extPanId.toUpperCase()).reverse() // 不能直接调用transferHexToBleData，extPanId数值太大，转换进制会产生精度丢失

      parameter = parameter.concat([...panIdHexArr, ...exPanIdHexArr])
    }

    // 仅协议版本3+的才支持入网角色的配置
    if (protocolVersion >= 3) {
      parameter.push(role)
    }

    const res = await this.sendCmd({
      cmdType: CmdTypeMap.DEVICE_CONTROL,
      data: parameter,
    })

    const result = {
      code: res.code,
      success: res.success,
      result: {
        zigbeeMac: '',
      },
    }

    if (res.success) {
      const macStr = res.data.substr(4)

      const code = res.data.slice(2, 4)

      // 根据设备回复做2次处理
      result.code = code
      result.success = code !== '01' // 设备有回复的情况，若返回的code是01，代表配网失败
      result.result.zigbeeMac = strUtil.reverseHexStr(macStr)
    }

    Logger.log(`【${this.mac}】startZigbeeNet`, result, `蓝牙连接状态：${bleDeviceMap[this.deviceUuid]}`)

    return result
  }

  /**
   * 查询ZigBee网关连接状态
   */
  async getZigbeeState() {
    const res = await this.sendCmd({ cmdType: CmdTypeMap.DEVICE_INFO_QUREY, data: [0x01] })

    const result = {
      code: res.code,
      success: res.success,
      result: {
        isConfig: '',
      },
    }

    if (res.success) {
      const isConfig = res.data.slice(2, 4)
      result.code = isConfig
      result.result.isConfig = isConfig
    }

    Logger.log(`【${this.mac}】getZigbeeState`, result)

    return result
  }

  /**
   * 查询灯光状态
   */
  async getLightState() {
    const res = await this.sendCmd({ cmdType: CmdTypeMap.DEVICE_INFO_QUREY, data: [0x03] })

    Logger.log(`【${this.mac}】getLightState`, res)

    return {
      code: res.code,
      success: res.success,
      result: {},
    }
  }

  /**
   * 闪烁指令
   */
  async flash() {
    const res = await this.sendCmd({ cmdType: CmdTypeMap.DEVICE_CONTROL, data: [0x05] })

    if (res.success) {
      res.code = res.data.slice(2, 4)
    }

    return res
  }

  /**
   * 控制ZigBee网络中设备的开关
   * @param params.onOff 控制的开关状态：0x00：关  0x01：开  0x02：toggle 反转状态(默认）
   * @param params.type 控制开关的方式  0x00：单控（默认） 0x01：组控
   * @param params.id 控制对应设备的nodeid或者对应组的groupid  0xFFFF：默认控制当前设备
   * @param params.endpoint 控制对应设备的endpoint 1：默认
   */
  async ctlOnOff({ onOff = 0x02, type = 0x00, id = 0xffff, endpoint = 1 }) {
    const data = [0x01, onOff, type, ...bleUtil.transferHexToBleData(id, 2), endpoint]

    const res = await this.sendCmd({ cmdType: CmdTypeMap.DEVICE_CONTROL, data })

    if (res.success) {
      res.code = res.data.slice(2, 4)
      res.success = res.code === '00'
    }

    return res
  }

  /**
   * 查询开关状态
   * @param params.nodeId 控制对应设备的nodeid或者对应组的groupid  0xFFFF：默认控制当前设备
   * @param params.endpoint 控制对应设备的endpoint 1：默认
   */
  async queryOnOffStatus({ nodeId = 0xffff, endpoint = 1 }) {
    const data = [0x01, ...bleUtil.transferHexToBleData(nodeId, 2), endpoint]

    const res = await this.sendCmd({ cmdType: CmdTypeMap.DEVICE_INFO_QUREY, data })

    return res
  }
}

export const bleUtil = {
  transferBroadcastData(advertisData: ArrayBuffer) {
    const msgStr = strUtil.ab2hex(advertisData)
    const macStr = msgStr.substr(6, 16)

    let arr = []

    for (let i = 0; i < macStr.length; i = i + 2) {
      arr.push(macStr.substr(i, 2).toUpperCase())
    }

    arr = arr.reverse()

    const zigbeeMac = arr.join('')

    return {
      brand: msgStr.substr(0, 4),
      isConfig: msgStr.substr(4, 2), // 设备网络状态 0x00：未入网   0x01：正在入网   0x02:  已经入网
      mac: zigbeeMac.substr(0, 6) + zigbeeMac.substr(-6, 6),
      zigbeeMac,
      proType: `0x${msgStr.slice(22, 24)}`,
      bluetoothPid: `0x${msgStr.slice(24, 26)}`,
      version: msgStr.slice(26, 28),
      protocolVersion: msgStr.slice(-2),
    }
  },

  getCheckNum(msgArr: Array<number>) {
    let sum = 0

    for (let i = 0; i < msgArr.length; i++) {
      sum += msgArr[i]
    }

    const temp = sum.toString(2).padStart(8, '0').slice(-8) // 校验码仅取后2位16进制数字

    sum = parseInt(this.exchange(temp), 2)
    sum += 1

    // 防止补码+1后，数据溢出
    if (sum >= 256) {
      sum = sum - 256
    }

    return sum
  },

  exchange(str: string) {
    const arr = str.split('')
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '0') {
        arr[i] = '1'
      } else {
        arr[i] = '0'
      }
    }
    str = arr.join('')
    return str
  },

  /**
   * 转换要传输的蓝牙数据，将参数值转换成指定长度的字节数组，高位在后，低位在前，位数不足自动补0
   * 超过的2的53次方的数值会产生精度丢失
   * @param value
   * @param numBytes 需要输出的字节数长度
   */
  transferHexToBleData(value: number, numBytes: number) {
    const hexStr = value
      .toString(16)
      .toUpperCase()
      .padStart(numBytes * 2, '0')

    return strUtil.hexStringToBytes(hexStr).reverse()
  },

  /**
   * 初始化子设备蓝牙，使用BleClient类型，必须先调用
   * 重新建立蓝牙监听，否则有可能被其他模块调用wx.offBLECharacteristicValueChange()取消蓝牙特征值监听,导致无法获取蓝回复
   */
  initBle() {
    wx.offBLECharacteristicValueChange()
    wx.onBLECharacteristicValueChange((res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
      const bleDevice = deviceUuidMap[res.deviceId]
      if (!bleDevice) {
        Logger.debug('非zigbee子设备蓝牙消息')
        return
      }

      const hex = strUtil.ab2hex(res.value)
      const msg = aesUtil.decrypt(hex, bleDevice.key, 'Hex')

      const resMsgId = parseInt(msg.slice(2, 4), 16) // 收到回复的指令msgId
      const packLen = parseInt(msg.slice(4, 6), 16) // 回复消息的Byte Msg Id到Byte Checksum的总长度，单位byte

      // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
      // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte

      // Parameter(s)： 消息参数
      const resMsg = msg.slice(6, 6 + (packLen - 3) * 2)

      /* Parameter(s)段统一格式如下：
      字节	  含义
      0	    Contrl Type: 控制指令子类型	对可能的各种控制类型消息的区分
      1 ~ 	Param_data: 控制参数内容*/

      const callback = bleDevice.cmdCallbackMap[resMsgId]

      if (callback) {
        callback({
          code: '00', //
          data: resMsg,
          success: true,
          msg: '成功收到回复',
        })

        delete bleDevice.cmdCallbackMap[resMsgId] // 删除已经执行的callback
      } else if (bleDevice.onMessage) {
        bleDevice.onMessage({
          type: resMsg.slice(0, 2), //  上报类型
          data: resMsg,
          mac: bleDevice.mac,
          deviceId: bleDevice.deviceUuid,
        })
      }
    })
  },
}

// 蓝牙连接状态集合
export const bleDeviceMap = {} as IAnyObject

wx.onBLEConnectionStateChange(function (res) {
  bleDeviceMap[res.deviceId] = res.connected

  const deviceId = res.deviceId
  const mac = deviceUuidMap[deviceId]?.mac

  Logger.log(`【${mac || deviceId}】蓝牙已${res.connected ? '连接' : '断开'}`)
})
