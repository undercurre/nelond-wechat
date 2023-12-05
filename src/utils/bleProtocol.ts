import { aesUtil, delay, strUtil, Logger, isAndroid } from './index'

// 定义了与BLE通路相关的所有事件/动作/命令的集合；其值域及表示意义为：对HOMLUX设备主控与app之间可能的各种操作的概括分类
const CmdTypeMap = {
  DEVICE_CONTROL: 0x00, // 控制
  DEVICE_INFO_QUREY: 0x01, // 查询
} as const

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

  constructor(params: { mac: string; deviceUuid: string; proType: string; modelId: string; protocolVersion: string }) {
    const { mac, deviceUuid, modelId, proType, protocolVersion } = params

    this.mac = mac
    this.deviceUuid = deviceUuid
    this.modelId = modelId
    this.proType = proType
    this.protocolVersion = protocolVersion

    deviceUuidMap[deviceUuid] = mac
    // 密钥为：midea@homlux0167   (0167为该设备MAC地址后四位
    this.key = `midea@homlux${mac.substr(-4, 4)}`
  }

  async connect() {
    const date1 = Date.now()

    Logger.log(`【${this.mac}】开始连接蓝牙`)

    // 会出现createBLEConnection一直没返回的情况（低概率）
    // 微信bug，安卓端timeout参数无效
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
    // 避免-1的情况，因为安卓如果重复调用 wx.createBLEConnection 创建连接，有可能导致系统持有同一设备多个连接的实例，导致调用 closeBLEConnection 的时候并不能真正的断开与设备的连接。占用蓝牙资源
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

      // 收到延迟，安卓平台上，在调用 wx.notifyBLECharacteristicValueChange 成功后立即调用本接口，在部分机型上会发生 10008 系统错误
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
  }

  async sendCmd(params: { cmdType: keyof typeof CmdTypeMap; data: Array<number> }) {
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

      const msgId = ++this.msgId // 等待回复的指令msgId
      // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
      // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
      const cmdArr = [CmdTypeMap[cmdType], msgId, 0x00]

      cmdArr.push(...data)

      cmdArr[2] = cmdArr.length

      cmdArr.push(bleUtil.getCheckNum(cmdArr))

      const hexArr = cmdArr.map((item) => item.toString(16).padStart(2, '0').toUpperCase())

      Logger.log(`【${this.mac}】蓝牙指令发起，cmdType： ${cmdType}--${hexArr}`)

      const msg = aesUtil.encrypt(hexArr.join(''), this.key, 'Hex')

      const buffer = strUtil.hexStringToArrayBuffer(msg)

      const begin = Date.now()

      let timeId = 0

      let listener = (res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
        Logger.log(`listener-res-default`, res)
      }

      return new Promise<{ code: string; success: boolean; cmdType?: string; resMsg: string }>((resolve, reject) => {
        // 超时处理
        timeId = setTimeout(() => {
          reject('蓝牙指令回复超时')
        }, 8000)

        listener = (res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
          if (res.deviceId !== this.deviceUuid) {
            return
          }

          const hex = strUtil.ab2hex(res.value)
          const msg = aesUtil.decrypt(hex, this.key, 'Hex')

          const resMsgId = parseInt(msg.substr(2, 2), 16) // 收到回复的指令msgId
          const packLen = parseInt(msg.substr(4, 2), 16) // 回复消息的Byte Msg Id到Byte Checksum的总长度，单位byte

          Logger.debug(`【${this.mac}】resMsgId`, resMsgId, 'msgId', msgId)
          // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
          // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
          if (resMsgId !== msgId) {
            return
          }

          // 仅截取消息参数部分数据，
          const resMsg = msg.substr(6, (packLen - 3) * 2)

          resolve({
            code: resMsg.slice(2, 4),
            resMsg: resMsg.slice(2),
            success: true,
            cmdType: cmdType,
          })
        }

        wx.onBLECharacteristicValueChange(listener)

        wx.writeBLECharacteristicValue({
          deviceId: this.deviceUuid,
          serviceId: this.serviceId,
          characteristicId: this.characteristicId,
          value: buffer,
        })
          .then(() => {
            Logger.log(`【${this.mac}】${cmdType}:writeBLECharacteristicValue`)
          })
          .catch((err) => {
            reject(err)
          })
      })
        .then((res) => {
          Logger.log(`【${this.mac}】${cmdType} 蓝牙指令回复时间： ${Date.now() - begin}ms`)

          return res
        })
        .catch(async (err) => {
          // todo: 暂时找不到方法和下面的catch逻辑合并处理
          Logger.error(`【${this.mac}】promise-sendCmd-err`, err, `蓝牙连接状态：${bleDeviceMap[this.deviceUuid]}`)

          await this.close() // 异常关闭需要主动配合关闭连接closeBLEConnection，否则资源会被占用无法释放，导致无法连接蓝牙设备

          return {
            code: '-1',
            success: false,
            error: err,
            resMsg: '',
          }
        })
        .finally(() => {
          wx.offBLECharacteristicValueChange(listener)

          clearTimeout(timeId)
        })
    } catch (err) {
      Logger.error(`【${this.mac}】${params.cmdType}sendCmd-err`, err, `蓝牙连接状态：${bleDeviceMap[this.deviceUuid]}`)
      await this.close() // 异常关闭需要主动配合关闭连接closeBLEConnection，否则资源会被占用无法释放，导致无法连接蓝牙设备
      return {
        code: '-1',
        success: false,
        error: err,
        resMsg: '',
      }
    }
  }

  async startZigbeeNet({ channel = 0, panId = 0, extPanId = '' }) {
    // 若panId为65535（0xFFFF），无效,导致无法成功配网，强制改为0
    if (panId === 65535) {
      panId = 0
    }
    const panIdHexArr = strUtil.hexStringToArrayUnit8(panId.toString(16).toUpperCase().padStart(4, '0'), 2).reverse()
    const exPanIdHexArr = strUtil.hexStringToArrayUnit8(extPanId || '0000000000000000', 2).reverse()

    const arr = this.protocolVersion === '02' ? [...panIdHexArr, ...exPanIdHexArr] : []

    const res = await this.sendCmd({
      cmdType: 'DEVICE_CONTROL',
      data: [0x00, channel, ...arr],
    })

    let zigbeeMac = ''

    if (res.success) {
      const macStr = res.resMsg.substr(2)
      let arr = []

      for (let i = 0; i < macStr.length; i = i + 2) {
        arr.push(macStr.substr(i, 2).toUpperCase())
      }

      arr = arr.reverse()
      zigbeeMac = arr.join('')
    }

    const result = {
      ...res,
      result: {
        zigbeeMac,
      },
    }

    Logger.log(`【${this.mac}】startZigbeeNet`, result, `蓝牙连接状态：${bleDeviceMap[this.deviceUuid]}`)

    return result
  }

  /**
   * 查询ZigBee网关连接状态
   */
  async getZigbeeState() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_INFO_QUREY', data: [0x01] })

    let isConfig = ''

    if (res.success) {
      isConfig = res.resMsg
    }

    const result = {
      ...res,
      result: {
        isConfig,
      },
    }

    Logger.log(`【${this.mac}】getZigbeeState`, result)

    return result
  }

  /**
   * 查询灯光状态
   */
  async getLightState() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_INFO_QUREY', data: [0x03] })

    Logger.log(`【${this.mac}】getLightState`, res)

    return {
      ...res,
      result: {},
    }
  }

  /**
   * 闪烁指令
   */
  async flash() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_CONTROL', data: [0x05] })

    Logger.log(`【${this.mac}】flash`, res)

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
      isConfig: msgStr.substr(4, 2),
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
}

export const bleDeviceMap = {} as IAnyObject

const deviceUuidMap = {} as IAnyObject

wx.onBLEConnectionStateChange(function (res) {
  bleDeviceMap[res.deviceId] = res.connected

  const deviceId = res.deviceId

  Logger.log(`【${deviceUuidMap[deviceId] || deviceId}】蓝牙已${res.connected ? '连接' : '断开'}`)
})
