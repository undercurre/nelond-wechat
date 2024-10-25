import { observable, runInAction } from 'mobx-miniprogram'
import { BleClient, bleUtil, Logger, throttle, unique } from '../../utils/index'
import { deviceStore } from '../../store/index'
import { batchCheckDevice, batchGetProductInfoByBPid } from '../../apis/index'

let _foundList = [] as IBleBaseInfo[]
let _bleStateChangeListen: WechatMiniprogram.OnBluetoothAdapterStateChangeCallback | null

// 缓存的产品信息
const productInfoMap: {
  [x: string]: {
    productIcon: string
    productName: string
    modelId: string
    switchNum: number
  }
} = {}

export const bleDevicesStore = observable({
  available: false, // 是否打开蓝牙开关

  discovering: false, // 是否正在搜索蓝牙

  isStart: false, // 业务字段，标志是否开始了发现蓝牙设备流程，用于蓝牙开关会被……中途终止蓝牙搜索）又打开的情况，恢复蓝牙搜索状态

  bleDeviceList: [] as Device.ISubDevice[],

  startBleDiscovery() {
    if (this.discovering) {
      Logger.error('已经正在搜索蓝牙')
      return
    }

    this.isStart = true
    // 监听扫描到新设备事件, 安卓 6.0 及以上版本，无定位权限或定位开关未打开时，无法进行设备搜索
    wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
      let allDeviceList = res.devices.filter((item) => {
        // 先过滤非homlux蓝牙子设备 以及【蓝牙信号值低于-75】的设备
        return item.localName && ['homlux_ble', 'homlux'].includes(item.localName) && item.RSSI > -75
      })

      // 对发现的子设备进行去重
      allDeviceList = unique(allDeviceList, 'deviceId')

      const deviceList = allDeviceList
        .map((item) => getBleDeviceBaseInfo(item))
        .filter((baseInfo) => {
          // 已经展示在列表的设备的广播数据
          const foundViewItem = bleDevicesStore.bleDeviceList.find(
            (foundItem) => foundItem.deviceUuid === baseInfo.deviceUuid,
          )

          if (foundViewItem) {
            foundViewItem.RSSI = baseInfo.RSSI
            foundViewItem.signal = baseInfo.signal
            foundViewItem.isConfig = baseInfo.isConfig
          }

          // 1、过滤【已经显示在列表的】
          // 2、设备配网状态没变化的同一设备不再查询，防止重复查询同一设备的云端信息接口
          // 3、过滤已入去中心zigbee网络的子设备
          // 商照小程序
          return (
            baseInfo.isConfig !== '10' &&
            !foundViewItem &&
            !_foundList.find(
              (foundItem) => foundItem.deviceUuid === baseInfo.deviceUuid && foundItem.isConfig === baseInfo.isConfig,
            )
          )
        })

      this.updateBleDeviceListThrottle() // 先更新一次列表数据，以免由于后续没有符合条件的数据，没有新设备被发现，导致没更新已存在数据的信号数据更新
      if (deviceList.length <= 0) {
        return
      }
      // 记录已经查询过的设备
      _foundList = _foundList.concat(deviceList)

      checkBleDeviceList(deviceList)
    })

    // 开始搜寻附近的蓝牙外围设备
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      powerLevel: 'high',
      interval: 5000,
    })
  },

  stopBLeDiscovery() {
    Logger.log('终止蓝牙发现')
    this.isStart = false
    wx.stopBluetoothDevicesDiscovery()
    wx.offBluetoothDeviceFound()
  },

  reset() {
    Logger.log('重置蓝牙store')
    bleUtil.initBle()
    wx.offBluetoothAdapterStateChange()

    wx.onBluetoothAdapterStateChange((res) => {
      Logger.log('onBluetoothAdapterStateChange-store', res)

      runInAction(() => {
        bleDevicesStore.discovering = res.discovering
        bleDevicesStore.available = res.available
      })

      // 用于蓝牙开关会被……中途终止蓝牙搜索）又打开的情况，恢复蓝牙搜索状态
      if (bleDevicesStore.isStart && res.available && !res.discovering) {
        Logger.log('恢复蓝牙搜索状态')
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          powerLevel: 'high',
          interval: 5000,
        })
      }

      if (_bleStateChangeListen) {
        _bleStateChangeListen(res)
      }
    })

    // 获取初始的蓝牙开关状态
    const systemSetting = wx.getSystemSetting()

    runInAction(() => {
      this.bleDeviceList = []
      this.discovering = false
      this.available = systemSetting.bluetoothEnabled
    })

    _foundList = []
  },

  updateBleDeviceList() {
    runInAction(() => {
      this.bleDeviceList = this.bleDeviceList.concat([])
    })
  },

  /**
   * 节流更新蓝牙设备列表，根据实际业务场景使用
   */
  updateBleDeviceListThrottle: throttle(() => {
    bleDevicesStore.updateBleDeviceList()
  }, 5000),

  onBluetoothAdapterStateChange(listener: WechatMiniprogram.OnBluetoothAdapterStateChangeCallback) {
    _bleStateChangeListen = listener
  },

  offBluetoothAdapterStateChange() {
    _bleStateChangeListen = null
  },
})

export const bleDevicesBinding = {
  store: bleDevicesStore,
  fields: ['discovering', 'available', 'bleDeviceList'],
  actions: [],
}

function getBleDeviceBaseInfo(bleDevice: WechatMiniprogram.BlueToothDevice): IBleBaseInfo {
  const msgObj = bleUtil.transferBroadcastData(bleDevice.advertisData)

  const { RSSI } = bleDevice
  const signal = getSignalFlag(RSSI)

  return {
    ...msgObj,
    deviceUuid: bleDevice.deviceId,
    RSSI: bleDevice.RSSI,
    signal,
  }
}

function getSignalFlag(RSSI: number) {
  return RSSI > -80 ? (RSSI > -70 ? 'strong' : 'normal') : 'weak'
}

async function checkBleDeviceList(list: IBleBaseInfo[]) {
  const checkRes = await batchCheckDevice({
    deviceCheckSubDeviceVoList: list.map((item) => ({
      mac: item.zigbeeMac,
    })),
  })

  if (!checkRes.success) {
    return
  }

  const inValidList = checkRes.result.filter((item) => !item.isValid).map((item) => item.mac)

  inValidList.length && Logger.debug('设备云端不存在注册记录：', inValidList)

  // 合法注册且没有配网设备列表
  const validDeviceList = list.filter((item) => {
    const { zigbeeMac, isConfig } = item

    const cloudDeviceInfo = checkRes.result.find((checkItem) => zigbeeMac === checkItem.mac) as Device.MzgdProTypeDTO

    // 过滤已经配网的设备
    // 设备网络状态 0x00：未入网   0x01：正在入网   0x02:  已经入网
    // 但由于丢包情况，设备本地状态不可靠，需要查询云端是否存在该设备的绑定状态（是否存在项目绑定关系）结合判断是否真正配网
    // 2、过滤云端存在空间绑定关系且设备本地状态为02(已绑定状态)的设备
    const isBind = cloudDeviceInfo.spaceId && isConfig === '02'

    if (isBind) {
      Logger.console(`【${zigbeeMac}】已绑定`)
    }

    return cloudDeviceInfo.isValid && !isBind
  })

  // 判断是否存在合法的设备
  if (validDeviceList.length === 0) {
    return
  }

  // 待查询的产品信息 id列表
  const needQueryList: { proType: string; bluetoothPid: string }[] = []

  validDeviceList.forEach((item) => {
    const isInNeedList =
      needQueryList.findIndex(
        (needItem) => item.proType === needItem.proType && item.bluetoothPid === needItem.bluetoothPid,
      ) >= 0

    // 剔除已存在缓存的产品id和已经存在待查询列表的数据
    if (!productInfoMap[`${item.proType}${item.bluetoothPid}`] && !isInNeedList) {
      needQueryList.push({ proType: item.proType, bluetoothPid: item.bluetoothPid })
    }
  })

  if (needQueryList.length) {
    const queryListRes = await batchGetProductInfoByBPid({
      mzgdBluetoothVoList: needQueryList,
    })

    if (!queryListRes.success) {
      return
    }

    // 缓存查询回来的产品信息数据，重复使用
    queryListRes.result.forEach((item) => {
      productInfoMap[`${item.proType}${item.bluetoothPid}`] = {
        productIcon: item.productIcon,
        productName: item.productName,
        switchNum: item.switchNum,
        modelId: item.modelId,
      }
    })
  }

  validDeviceList.forEach((item) => {
    const productInfo = productInfoMap[`${item.proType}${item.bluetoothPid}`]

    if (!productInfo) {
      console.warn(`${item.mac}产品品类${item.proType},${item.bluetoothPid}信息不存在`)
      return
    }

    handleBleDeviceInfo({
      ...item,
      productName: productInfo.productName,
      switchNum: productInfo.switchNum,
      modelId: productInfo.modelId,
      productIcon: productInfo.productIcon,
    })
  })

  bleDevicesStore.updateBleDeviceListThrottle()
}

function handleBleDeviceInfo(
  deviceInfo: IBleBaseInfo & {
    productName: string
    switchNum: number
    modelId: string
    productIcon: string
  },
) {
  let { productName: deviceName } = deviceInfo
  const { deviceUuid, mac, isConfig, zigbeeMac, proType, switchNum, modelId, productIcon } = deviceInfo

  // 过滤已经在列表的的设备  存在接口查询过程，过滤期间重复上报的设备
  if (bleDevicesStore.bleDeviceList.find((foundItem) => foundItem.deviceUuid === deviceUuid)) {
    return
  }

  const bindNum = deviceStore.allDeviceList.filter(
    (item) => item.proType === proType && item.productId === modelId,
  ).length // 已绑定的相同设备数量

  const newNum = bleDevicesStore.bleDeviceList.filter(
    (item) => item.proType === proType && item.productId === modelId,
  ).length // 已新发现的相同设备数量

  const deviceNum = bindNum + newNum // 已有相同设备数量

  deviceName += deviceNum > 0 ? deviceNum + 1 : ''

  const bleDevice: Device.ISubDevice = {
    proType,
    deviceUuid,
    mac,
    signal: deviceInfo.signal,
    RSSI: deviceInfo.RSSI,
    zigbeeMac,
    isConfig,
    icon: productIcon,
    productId: modelId,
    name: deviceName,
    isChecked: false,
    client: new BleClient({
      mac,
      deviceUuid,
      modelId,
      proType,
      protocolVersion: deviceInfo.protocolVersion,
    }),
    spaceId: '',
    spaceName: '',
    switchList: [],
    status: 'waiting',
  }

  // 面板需要显示按键信息编辑
  if (switchNum > 1 && bleDevice.proType === '0x21') {
    bleDevice.switchList = new Array(switchNum).fill('').map((_item, index) => {
      const num = index + 1
      return {
        switchId: num.toString(),
        switchName: `按键${num}`,
      }
    })
  }

  bleDevicesStore.bleDeviceList.push(bleDevice)
}

export interface IBleBaseInfo {
  deviceUuid: string
  RSSI: number
  signal: string
  brand: string
  isConfig: string
  mac: string
  zigbeeMac: string
  proType: string
  bluetoothPid: string
  protocolVersion: string
}
