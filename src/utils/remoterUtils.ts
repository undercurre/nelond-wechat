// import cryptoUtils from './remoterCrypto'
import remoterProtocol from './remoterProtocol'
import { hideLoading, isAndroid, showLoading } from './system'
import { delay, Logger } from '../utils/index'
import { CMD } from '../config/remoter'

/**
 * @description 建立本地作为蓝牙[低功耗外围设备]的服务端
 */
export function createBleServer() {
  return new Promise<WechatMiniprogram.BLEPeripheralServer>((resolve, reject) => {
    wx.createBLEPeripheralServer({
      success(res) {
        Logger.log('BLE外围设备服务端创建成功', res)
        resolve(res.server)
      },
      fail(err) {
        Logger.error(err)
        reject(err)
      },
    })
  })
}

/**
 * @description 开始发送广播
 * @param server
 * @param params.addr 蓝牙地址
 * @param params.payload 发送数据
 * @param params.autoEnd 自动发送结束指令
 * @param params.INTERVAL 广播时长
 */
export async function bleAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer | null,
  params: { addr: string; payload: string; comId?: string; autoEnd?: boolean; INTERVAL?: number; isFactory?: boolean },
) {
  const { addr, payload, comId = '0x4D11', INTERVAL = 800, autoEnd = true, isFactory } = params
  if (!server) {
    Logger.log('server is Not existed')
    return
  }
  const advertiseRequest = {} as WechatMiniprogram.AdvertiseReqObj

  if (isAndroid()) {
    const manufacturerSpecificData = remoterProtocol.createAndroidBleRequest({ payload, addr, isFactory })
    Logger.log('开始发送广播', comId) // , cryptoUtils.ab2hex(manufacturerSpecificData).slice(0)

    advertiseRequest.manufacturerData = [
      {
        manufacturerId: comId,
        manufacturerSpecificData,
      },
    ]
  } else {
    const serviceUuids = remoterProtocol.createIOSBleRequest({ payload, addr, comId, isFactory })
    Logger.log('开始发送广播')

    advertiseRequest.serviceUuids = serviceUuids
  }

  // 需要连发多次指令以防丢包
  await startAdvertising(server, advertiseRequest)
  await delay(INTERVAL)

  // 主动终止控制指令广播，并发终止指令广播
  if (autoEnd) {
    await stopAdvertising(server)
    await bleAdvertisingEnd(server, { addr, isFactory })
  }
}

/**
 * @description 发送终止指令的广播
 * @param server
 * @param params.addr 蓝牙地址
 * @param params.INTERVAL 广播时长，终止指令多发一点
 */
export async function bleAdvertisingEnd(
  server: WechatMiniprogram.BLEPeripheralServer,
  params: { addr: string; comId?: string; INTERVAL?: number; isFactory?: boolean },
) {
  const { addr, comId = '0x4D11', INTERVAL = 800, isFactory } = params
  const payload = remoterProtocol.generalCmdString(CMD.END) // 固定发这个指令
  const advertiseRequest = {} as WechatMiniprogram.AdvertiseReqObj

  Logger.log('开始发送0x00广播')

  if (isAndroid()) {
    const manufacturerSpecificData = remoterProtocol.createAndroidBleRequest({ payload, addr, isFactory })

    advertiseRequest.manufacturerData = [
      {
        manufacturerId: comId,
        manufacturerSpecificData,
      },
    ]
  } else {
    const serviceUuids = remoterProtocol.createIOSBleRequest({ payload, addr, comId, isFactory })

    advertiseRequest.serviceUuids = serviceUuids
  }

  // 需要连发多次指令以防丢包
  await startAdvertising(server, advertiseRequest)
  await delay(INTERVAL)
  await stopAdvertising(server)
}

/**
 * @description 将 server.startAdvertising 封装为Promise
 * @param server
 * @param advertiseRequest
 */
export function startAdvertising(
  server: WechatMiniprogram.BLEPeripheralServer,
  advertiseRequest: WechatMiniprogram.AdvertiseReqObj,
) {
  return new Promise((resolve, reject) => {
    server.startAdvertising({
      powerLevel: 'high',
      advertiseRequest,
      success(res) {
        Logger.log('广播发送成功')
        resolve(res)
      },
      fail(err) {
        Logger.error(err)
        reject(err)
      },
    })
  })
}

/**
 * @description 将server.startAdvertising封装为Promise
 * @param server
 * @param advertiseRequest
 */
export function stopAdvertising(server: WechatMiniprogram.BLEPeripheralServer) {
  return new Promise((resolve, reject) => {
    server.stopAdvertising({
      success(res) {
        Logger.log('停止广播成功')
        resolve(res)
      },
      fail(err) {
        Logger.error(err)
        reject(err)
      },
    })
  })
}

/**
 * 基于连接的低功耗蓝牙设备服务
 */
export class BleService {
  addr: string
  deviceId: string // 搜索到设备的 deviceId
  serviceId = ''
  characteristics = [] as WechatMiniprogram.BLECharacteristic[]
  isConnected = false

  constructor(device: { addr: string; deviceId: string }) {
    const { addr, deviceId } = device

    this.addr = addr
    this.deviceId = deviceId
  }

  // 建立连接
  async connect() {
    showLoading('正在建立蓝牙连接')
    const startTime = Date.now()

    Logger.log(`${this.addr} 开始连接蓝牙`)

    // 会出现createBLEConnection一直没返回的情况（低概率）
    // 微信bug，安卓端timeout参数无效
    const connectRes = await wx
      .createBLEConnection({
        deviceId: this.deviceId,
        timeout: 15000,
      })
      .catch((err: WechatMiniprogram.BluetoothError) => err)

    const costTime = Date.now() - startTime
    Logger.log(`${this.addr} connectRes `, connectRes, `连接蓝牙时间： ${costTime}ms`)

    hideLoading()

    // 判断是否连接蓝牙，0为连接成功，-1为已经连接
    // 避免-1的情况，因为安卓如果重复调用 wx.createBLEConnection 创建连接，有可能导致系统持有同一设备多个连接的实例，导致调用 closeBLEConnection 的时候并不能真正的断开与设备的连接。占用蓝牙资源
    if (connectRes.errCode !== 0 && connectRes.errCode !== -1) {
      throw {
        code: -1,
        error: connectRes,
      }
    }

    // 新连接，未记录过服务ID
    const res = await wx
      .getBLEDeviceServices({
        deviceId: this.deviceId,
      })
      .catch((err) => {
        throw err
      })
    Logger.log('getBLEDeviceServices', res)

    this.serviceId = res.services[0].uuid

    // 更新持久化记录
    // const _localList = (storage.get('_localList') ?? {}) as Remoter.LocalList
    // _localList[this.addr].serviceId = res.services[0].uuid
    // storage.set('_localList', _localList)

    return {
      code: 0,
      error: connectRes,
    }
  }

  async close() {
    showLoading('正在断开蓝牙连接')

    Logger.log(`${this.addr} ${this.deviceId} 开始关闭蓝牙连接`)
    const res = await wx.closeBLEConnection({ deviceId: this.deviceId }).catch((err) => err)

    // 存在调用关闭蓝牙连接指令和与设备蓝牙连接真正断开有时间差，强制等待1s
    await delay(1000)

    Logger.log(`${this.addr} closeBLEConnection`, res)
    hideLoading()
  }

  // 初始化蓝牙特征值
  async init() {
    // 未经连接步骤的初始化，从缓存中获取 serviceId
    // if (!this.serviceId) {
    //   const _localList = (storage.get('_localList') ?? {}) as Remoter.LocalList
    //   this.serviceId = _localList[this.addr].serviceId as string
    // }
    // IOS无法跳过该接口，否则后续接口会报10005	no characteristic	没有找到指定特征
    const characRes = await wx
      .getBLEDeviceCharacteristics({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
      })
      .catch((err) => {
        throw err
      })

    Logger.log('getBLEDeviceCharacteristics', characRes)

    // 取第一个属性（固定，为可写可读可监听），不同品类的子设备的characteristicId不一样，同类的一样
    this.characteristics = characRes.characteristics
  }

  async sendCmd(payload: string) {
    const characteristic = this.characteristics.find((c) => c.properties.write)
    if (!characteristic) {
      return
    }
    await wx
      .writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: characteristic.uuid,
        value: remoterProtocol.createBluetoothProtocol({
          addr: this.addr,
          data: payload,
        }),
      })
      .catch((err) => {
        throw err
      })

    // 收到延迟，安卓平台上，在调用 wx.notifyBLECharacteristicValueChange 成功后立即调用本接口，在部分机型上会发生 10008 系统错误
    if (isAndroid()) {
      await delay(500)
    }
  }

  async readState() {
    const characteristic = this.characteristics.find((c) => c.properties.read)
    if (!characteristic) {
      return
    }

    const res = await wx
      .readBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: characteristic.uuid,
      })
      .catch((err) => {
        throw err
      })

    Logger.log('readBLECharacteristicValue', res)
  }
}
