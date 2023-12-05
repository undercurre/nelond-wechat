import { observable, runInAction } from 'mobx-miniprogram'
import { storage, isDevMode } from '../utils/index'
import { deviceConfig } from '../config/remoter'

const MOCK_DEVICES = [
  {
    dragId: '112233445567',
    orderNum: 1,
    deviceId: '0',
    addr: '112233445567',
    devicePic: '/assets/img/remoter/bathHeater.png',
    deviceName: '吸顶灯Mock',
    deviceType: '13',
    deviceModel: '01',
    saved: true,
    actionStatus: true,
    defaultAction: 0,
    DISCOVERED: 0,
  },
  {
    dragId: '112233445566',
    orderNum: 1,
    deviceId: '0',
    addr: '112233445566',
    devicePic: '/assets/img/remoter/bathHeater.png',
    deviceName: '凉霸L8 Mock',
    deviceType: '40',
    deviceModel: '03',
    saved: true,
    actionStatus: true,
    defaultAction: 0,
    DISCOVERED: 0,
  },
  {
    dragId: '112233445568',
    orderNum: 1,
    deviceId: '0',
    addr: '112233445568',
    devicePic: '/assets/img/remoter/bathHeater.png',
    deviceName: '浴霸Q20 Mock',
    deviceType: '26',
    deviceModel: '03',
    saved: true,
    actionStatus: true,
    defaultAction: 0,
    DISCOVERED: 0,
  },
  {
    dragId: '112233445565',
    orderNum: 1,
    deviceId: '0',
    addr: '112233445565',
    devicePic: '/assets/img/remoter/bathHeater.png',
    deviceName: '浴霸A70 Mock',
    deviceType: '26',
    deviceModel: '0f',
    saved: true,
    actionStatus: true,
    defaultAction: 0,
    DISCOVERED: 0,
  },
] as Remoter.DeviceItem[]

// 设备列表缓存键名
const RM_KEY = 'remoterListLS'

// 保存数据到缓存，只保存指定的键
export const storeRmList = (list: Remoter.DeviceItem[], key = RM_KEY) => {
  const filterList = list.map((r) => ({
    orderNum: r.orderNum,
    addr: r.addr,
    deviceId: r.deviceId,
    deviceName: r.deviceName,
    deviceType: r.deviceType,
    deviceModel: r.deviceModel,
    actionStatus: r.actionStatus,
    defaultAction: r.defaultAction,
  }))
  storage.set(key, filterList)
}

export const remoterStore = observable({
  // 我的设备列表，只需要保存部分属性
  remoterList: [] as Remoter.DeviceItem[],

  // 当前详情页 addr
  curAddr: '',

  // 列表加载状态
  loaded: false,

  get hasRemoter(): boolean {
    return this.remoterList?.length > 0
  },

  // 所有的地址列表
  get deviceAddrs(): string[] {
    return this.remoterList.map((device) => device.addr)
  },

  // 所有的名称列表
  get deviceNames(): string[] {
    return this.remoterList.map((device) => device.deviceName)
  },

  get remoterMap(): Record<string, Remoter.DeviceItem> {
    return Object.fromEntries(this.remoterList.map((device) => [device.addr, device]))
  },

  // 我的设备列表，用于列表视图展示
  get remoterViewList(): Remoter.DeviceItem[] {
    const list = [...this.remoterList]
    return list
      .map((device) => {
        const { deviceModel, deviceType, addr } = device
        const config = deviceConfig[deviceType][deviceModel]
        if (!config) {
          console.log('device config NOT EXISTED IN remoterViewList')
          return {} as Remoter.DeviceItem
        }
        const { devicePic, actions } = config
        return {
          ...device,
          dragId: addr,
          devicePic,
          actions,
          saved: true,
          connected: false,
        }
      })
      .sort((a, b) => a.orderNum! - b.orderNum!)
  },

  // 当前遥控器信息
  get curRemoter(): Remoter.DeviceDetail {
    if (!this.curAddr) {
      return {} as Remoter.DeviceDetail
    }
    const device = this.remoterMap[this.curAddr] || {}
    const { deviceModel, deviceType } = device
    if (!deviceModel || !deviceType) {
      return {} as Remoter.DeviceDetail
    }
    const config = deviceConfig[deviceType][deviceModel] || {}

    return {
      ...config,
      ...device,
    }
  },

  // 当前遥控器索引
  get curRemoterIndex(): number {
    const { remoterList, curAddr } = this
    return remoterList.findIndex((d) => d.addr === curAddr)
  },

  // 从本地缓存初始化/重置【我的设备】列表
  retrieveRmStore() {
    const defaultList = isDevMode() ? MOCK_DEVICES : [] // 是否开启模拟数据，用于模型器样式调整
    const list = (storage.get(RM_KEY) ?? defaultList) as Remoter.DeviceItem[]

    runInAction(() => {
      this.remoterList = list
    })
  },

  // 更新遥控器状态
  renewRmState(recoveredList: Remoter.DeviceRx[]) {
    const rListIds = recoveredList.map((r) => r!.addr)

    const list = this.remoterList.map((device) => {
      const { deviceModel, deviceType, addr, defaultAction } = device
      const config = deviceConfig[deviceType][deviceModel]
      if (!config) {
        console.log(`renewRmState 保存的设备[${deviceType}][${deviceModel}]不存在`)
        return device
      }
      const { actions } = config
      const isDiscovered = rListIds.includes(addr)
      const actionKey = actions[defaultAction].key ?? ''

      let actionStatus
      if (isDiscovered) {
        const rd = recoveredList.find((d) => d.addr === addr)
        const { deviceAttr } = rd!
        actionStatus = deviceAttr[actionKey]
      }

      return {
        ...device,
        actionStatus,
        DISCOVERED: isDiscovered ? 1 : 0,
      }
    })

    console.log('renewRmState', list)
    runInAction(() => {
      this.remoterList = list
    })
  },

  // 更新当前进入的详情页地址
  setAddr(addr: string) {
    runInAction(() => {
      this.curAddr = addr
    })
  },

  // 修改当前遥控器名称
  renameCurRemoter(deviceName: string) {
    if (this.curRemoterIndex === -1) {
      return
    }

    runInAction(() => {
      this.remoterList[this.curRemoterIndex].deviceName = deviceName
    })
    storeRmList(this.remoterList)
  },

  // 修改当前遥控器默认首页开关
  changeAction(key: number) {
    if (this.curRemoterIndex === -1) {
      return
    }

    runInAction(() => {
      console.log('changeAction runInAction', key)
      this.remoterList[this.curRemoterIndex].defaultAction = key
    })
    storeRmList(this.remoterList)
  },

  // 删除当前遥控器
  removeCurRemoter() {
    const list = [...this.remoterList]
    list.splice(this.curRemoterIndex, 1)
    runInAction(() => {
      this.remoterList = list
    })
    storeRmList(list)
  },

  // 整体更新【我的设备】列表，并保存到本地缓存 // TODO 过滤元素，优化类型定义
  saveRmStore(list: Remoter.DeviceItem[]) {
    runInAction(() => {
      this.remoterList = list
    })
    storeRmList(list)
  },

  // 添加新的设备 // TODO 过滤元素，优化类型定义
  addRemoter(device: Remoter.DeviceItem) {
    const list = [...this.remoterList, device]
    storeRmList(list)
    runInAction(() => {
      this.remoterList.push(device)
    })
  },
})

export const remoterBinding = {
  store: remoterStore,
  fields: ['hasRemoter', 'remoterViewList', 'curRemoter'],
  actions: [],
}
