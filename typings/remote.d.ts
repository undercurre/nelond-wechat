declare namespace Remoter {
  /**
   * @description 设备属性
   */
  interface DeviceItem {
    dragId?: string // 用于拖拽功能, 直接使用 deviceId
    orderNum?: number // 用于拖拽功能, 排序索引
    addr: string // 传输用的mac地址，逆序，不带:
    deviceId: string // 安卓，Mac地址,带:  IOS，deviceUuid
    devicePic: string
    deviceName: string
    deviceType: string // 设备品类
    deviceModel: string // 设备型号
    actionStatus: boolean | undefined // 快捷开关状态
    saved: boolean // 是否已保存在本地（我的设备）
    DISCOVERED?: number // 是否被搜索到, 用于我的设备列表
    connected?: boolean // 是否与设备建立连接
    defaultAction: number // 默认首页开关索引
  }

  interface ButtonRes {
    key?: string
    longpress?: string
    icon?: string
    iconActive?: string
    name?: string
    btnWidth?: string
  }

  interface ConfigItem {
    deviceName: string
    devicePic: string
    joystick?: Record<string, ButtonRes>
    showTemperature?: boolean
    mList?: ButtonRes[]
    bList?: ButtonRes[]
    actions: ButtonRes[]
  }

  type LocalList = Record<
    string,
    Pick<DeviceItem, 'deviceModel' | 'deviceType' | 'orderNum' | 'deviceName' | 'deviceId'> & { serviceId?: string }
  >

  type DeviceDetail = DeviceItem & ConfigItem

  type DeviceRx = DeviceItem &
    WechatMiniprogram.BlueToothDevice & {
      fullAdvertistData: string
      manufacturerId: string
      deviceType: string
      deviceAttr: Record<string, boolean>
      payload: string
      version: number
      src: number
      BTP: boolean
      connect: boolean
      visibility: boolean
      encryptType: number
      encryptIndex: number
    }
}
