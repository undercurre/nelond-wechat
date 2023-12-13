declare namespace Device {
  /**
   * @description 设备属性
   * @param ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
   */
  interface mzgdPropertyDTO {
    colorTemperature?: number // 色温
    brightness?: number // 亮度
    // OnOff?: number // 关 0 | 开 1
    power?: number // 关 0 | 开 1
    colorTempRange?: {
      // 色温值范围
      maxColorTemp: number
      minColorTemp: number
    }
    ButtonMode?: number
    buttonScene?: number
    curtain_position?: string
    curtain_status?: string
    curtain_direction?: 'positive' | 'reverse' // 窗帘开合方向
    mode?: string // 浴霸模式，'close_all' | 'heating' | 'bath' | 'ventilation' | 'drying' | 'blowing' | 'soft_wind'，双模式用,分隔
    light_mode?: 'close_all' | 'main_light' | 'night_light' // 浴霸照明状态
    heating_temperature?: string // 浴霸加热温度
    updown?: string // 晾衣架升降 'up' | 'down' | 'pause'
    light: string // 晾衣架灯 'on' | 'off'
    laundry: string // 晾衣架一键晾衣 'on' | 'off'
    custom_height: number // 一键晾衣高度W
    location_status: string // 晾衣架位置 'lower_limit' | 'upper_limit' | 'normal'
  }
  /** 设备列表项 */
  interface DeviceItem {
    // 接口返回值属性
    deviceId: string
    deviceName: string

    channel: number // zigbee信道

    panId: number

    extPanId: string
    /**
     * 设备类型
     * 1:网关 2:子设备 3:wifi, 4:灯组
     */
    deviceType: number
    /**
     * 灯如果关联了开关，会有一个关联id
     */
    gatewayId: string
    gatewayName: string
    /** 方法列表 */
    methodList: string[]
    /**
     * 设备属性
     * { 每个endpoint: {属性值} }
     * 单路设备只有一个endpoint：1，比如{ 1: {power: 1} }
     */
    mzgdPropertyDTOList: Record<string, mzgdPropertyDTO>

    // 设备属性
    property?: IAnyObject
    /**
     * onLineStatus
     * 0:离线 1:在线
     */
    onLineStatus: number
    orderNum: number
    /** 设备图片 */
    pic: string
    /**
     * 品类码
     */
    proType: string
    /** 产品Id */
    productId: string
    spaceId: string
    spaceName: string
    switchInfoDTOList: MzgdPanelSwitchInfoDTO[]
    version: string
    sn: string

    // 小程序维护额外属性
    isChecked: boolean
    /**
     * 如果需要将开关拆分，需要这个id
     * 格式： deviceId:modelName
     * 如: xxxxx:wallSwitch1 xxxxx:wallSwitch2
     */
    uniId: string

    // 设备状态字段，前端使用
    status?: string

    // 灯分组，包含的列表数据
    groupDeviceList?: GroupDTO[]
    groupName?: string

    isScreenGateway: boolean // 是否智慧屏

    controlAction: IAnyObject //自动化传感器使用

    updateStamp: number

    canLanCtrl?: boolean // 是否可以局域网控制,前端自定义属性
    colorTempRangeMap: {
      maxColorTemp: number
      minColorTemp: number
    }
  }

  interface MzgdPropertyDTO {
    name: string
    propertyId: string
    propertyValue: string
  }

  interface MzgdPanelSwitchInfoDTO {
    projectId: string
    orderNum: number
    /** 面板Id */
    panelId: string
    /** 设备图片 */
    pic: string
    spaceId: string
    spaceName: string
    /** 开关Id */
    switchId: string
    /** 开关名称 */
    switchName: string
  }

  interface OrderSaveData {
    deviceInfoByDeviceVoList: {
      deviceId: string
      projectId: string
      orderNum: string
      spaceId: string
      switchId?: string
      type?: string
    }[]
    /** 类型:0 子设备顺序 1 按键顺序	 */
    // type: '1' | '0'
  }

  interface MzgdProTypeDTO {
    deviceIcon: string
    isValid: boolean // 设备mac是否合法
    mac: string
    modelId: string
    proType: string
    productIcon: string
    productName: string
    sn: string
    switchNum: number
    spaceId: string
  }

  interface ActionItem {
    uniId: string
    name: string
    desc: string[]
    pic: string
    proType: string
    deviceType: number
    value: IAnyObject
    //前端拖拽时用的绝对唯一的Id
    orderNum?: number
    dragId?: string
  }

  /** 批量修改设备 */
  interface DeviceInfoUpdateVo {
    deviceId: string
    deviceName?: string
    projectId: string
    spaceId?: string
    type?: string // 0 更改开关以外的设备 1 仅更改空间 2 所有都更改 3 仅开关更改
    deviceType?: number // 1 网关 2 子设备 3wifi设备
    switchId?: string
    switchName?: string
  }

  /** 批量删除设备 */
  interface DeviceBaseDeviceVo {
    deviceId: string
    /** 设备类型（1:网关 2:子设备 3:wifi */
    deviceType: string
    /** 网关需要传网关 */
    sn?: string
  }

  // 开关信息
  interface ISwitch {
    switchId: string
    switchName: string
  }

  // 关联的灯列表项
  interface IMzgdLampRelGetDTO {
    lampDeviceId: string
    relId: string
  }

  // 关联的面板ID,开关id,关系id
  interface IMzgdRelGetDTO {
    deviceId: string
    switchId: string
    relId: string
  }

  interface IMzgdLampDeviceInfoDTO {
    panelId: string
    switchId: string
    lampDeviceId: string
  }

  type GroupDTO = Pick<DeviceItem, 'deviceId' | 'deviceType' | 'proType'>

  type ISubDevice = {
    proType: string // 品类码
    deviceUuid: string
    mac: string
    signal: string
    RSSI: number
    zigbeeMac: string
    isConfig: string
    name: string
    spaceId: string
    spaceName: string
    icon: string
    productId: string
    switchList: Device.ISwitch[]
    client: import('../src/utils/index').BleClient
    status: 'waiting' | 'zigbeeBind' | 'fail' | 'success' // 配网状态  zigbeeBind
    isChecked: boolean // 是否被选中
    requesting: boolean // 是否正在发送试一试命令

    deviceId: string
    deviceName: string
    gatewayId: string
    productName: string
  }

  type Log = {
    content: string
    reportAt: string
  }
}
