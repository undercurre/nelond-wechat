// 搜寻蓝牙设备时的信号强度阈值(最小值)
export const MIN_RSSI = -65

// 搜寻超时时间
export const SEEK_TIMEOUT = 2500

// 控制后搜寻超时时间
export const SEEK_TIMEOUT_CONTROLED = 1000

// 操作频繁提示的间隔时间
export const FREQUENCY_TIME = 300

// 定时轮询设备状态的间隔时间
export const SEEK_INTERVAL = 8000

// 工厂调试用Mac地址
export const FACTORY_ADDR = '112233445566'

// 浴霸温度最大最小值
export const MAX_TEMPERATURE = 40
export const MIN_TEMPERATURE = 20

/**
 * @description 设备交互数据配置，按设备类型区分
 * TODO REFACTOR 随着型号增加，这样做功能配置会很臃肿，参考美居晾衣架等品类进行重构
 * { deviceType: { deviceModel: { configDetail }}}
 */
export const deviceConfig: Record<string, Record<string, Remoter.ConfigItem>> = {
  '13': {
    '01': {
      deviceName: '吸顶灯',
      devicePic: '/assets/img/remoter/ceilLight.png',
      joystick: {
        up: {
          key: 'LIGHT_BRIGHT_PLUS',
          longpress: 'LIGHT_BRIGHT_PLUS_ACC',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'LIGHT_COLOR_TEMP_PLUS',
          longpress: 'LIGHT_COLOR_TEMP_PLUS_ACC',
          icon: '/package-remoter/assets/light2.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
        down: {
          key: 'LIGHT_BRIGHT_MINUS',
          longpress: 'LIGHT_BRIGHT_MINUS_ACC',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'LIGHT_COLOR_TEMP_MINUS',
          longpress: 'LIGHT_COLOR_TEMP_MINUS_ACC',
          icon: '/package-remoter/assets/light1.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'LIGHT_SCENE_DAILY',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '日常',
        },
        {
          key: 'LIGHT_SCENE_RELAX',
          icon: '/package-remoter/assets/scene11.png',
          iconActive: '/package-remoter/assets/scene10.png',
          name: '休闲',
        },
        {
          key: 'LIGHT_SCENE_DELAY_OFF',
          icon: '/package-remoter/assets/scene21.png',
          iconActive: '/package-remoter/assets/scene20.png',
          name: '延时关',
        },
        {
          key: 'LIGHT_SCENE_SLEEP',
          icon: '/package-remoter/assets/scene31.png',
          iconActive: '/package-remoter/assets/scene30.png',
          name: '助眠',
        },
      ],
      bList: [
        {
          key: 'LIGHT_LAMP', // 模糊匹配指令，需要有特殊的反转逻辑转换为真实指令
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'LIGHT_NIGHT_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '小夜灯',
        },
      ],
      actions: [
        {
          key: 'LIGHT_NIGHT_LAMP',
          name: '小夜灯',
        },
        {
          key: 'LIGHT_LAMP',
          name: '照明',
        },
      ],
    },
    '02': {
      deviceName: '风扇灯',
      devicePic: '/assets/img/remoter/fanLight.png',
      joystick: {
        up: {
          key: 'LIGHT_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'LIGHT_COLOR_TEMP_PLUS',
          icon: '/package-remoter/assets/light2.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
        down: {
          key: 'LIGHT_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'LIGHT_COLOR_TEMP_MINUS',
          icon: '/package-remoter/assets/light1.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
      },
      mList: [
        {
          icon: '/package-remoter/assets/scene41.png',
          iconActive: '/package-remoter/assets/scene40.png',
          name: '风速减',
        },
        {
          icon: '/package-remoter/assets/scene51.png',
          iconActive: '/package-remoter/assets/scene50.png',
          name: '风速加',
        },
        {
          icon: '/package-remoter/assets/scene61.png',
          iconActive: '/package-remoter/assets/scene60.png',
          name: '定时',
        },
        {
          icon: '/package-remoter/assets/scene71.png',
          iconActive: '/package-remoter/assets/scene70.png',
          name: '负离子',
        },
      ],
      bList: [
        {
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '风扇',
        },
      ],
      actions: [
        {
          key: 'LIGHT_NIGHT_LAMP',
          name: '小夜灯',
        },
      ],
    },
  },
  '26': {
    // Q30 // 0001 不支持摆风
    '01': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // MY-S5X28-Y5W // 0010 无人感
    '02': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_WARM_STRONG',
          icon: '/package-remoter/assets/warm3.png',
          iconActive: '/package-remoter/assets/warm2.png',
          name: '强暖',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_WARM_SOFT',
          icon: '/package-remoter/assets/warm1.png',
          iconActive: '/package-remoter/assets/warm0.png',
          name: '弱暖',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // Q20 // 0011 温度可调 支持摆风 不支持人感 色温不可调
    '03': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_SWING',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '摆风',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // MY-S5X28-Y6W // 0110
    '06': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_WARM_STRONG',
          icon: '/package-remoter/assets/warm3.png',
          iconActive: '/package-remoter/assets/warm2.png',
          name: '强暖',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_WARM_SOFT',
          icon: '/package-remoter/assets/warm1.png',
          iconActive: '/package-remoter/assets/warm0.png',
          name: '弱暖',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // MY-S5X30-A70W // TODO 0111 温度可调，暂时未匹配
    // MY-S5X30-A70W // 1111 温度可调，色温可调
    '0f': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      showTemperature: false, // TODO 暂时不予实现
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        // {
        //   key: 'TEMPERATURE_SETTING_ADD',
        //   name: '温度+',
        // },
        // {
        //   key: 'TEMPERATURE_SETTING_SUB',
        //   name: '温度-',
        // },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
          btnWidth: '654rpx',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
  },
  '40': {
    // L8 // 0011 温度可调 支持摆风 不支持人感 色温不可调
    '03': {
      deviceName: '凉霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {},
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {},
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'KITCHEN_WIND_STRONG',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '强风',
        },
        {
          key: 'KITCHEN_WIND_SOFT',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '弱风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_SWING',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '摆风',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
  },
}

// 控制指令
export const CMD: Record<string, number> = {
  // 吸顶灯
  LIGHT_LAMP_ON: 0x06, // 开灯
  LIGHT_LAMP_OFF: 0x07, // 关灯
  LIGHT_BRIGHT_PLUS_ACC: 0x3c, // 亮度+ 长按
  LIGHT_BRIGHT_MINUS_ACC: 0x3a, // 亮度- 长按
  LIGHT_COLOR_TEMP_PLUS_ACC: 0x35, // 色温+ 长按
  LIGHT_COLOR_TEMP_MINUS_ACC: 0x31, // 色温- 长按
  LIGHT_BRIGHT_PLUS: 0x2c, // 亮度+ 短按
  LIGHT_BRIGHT_MINUS: 0x2a, // 亮度- 短按
  LIGHT_COLOR_TEMP_PLUS: 0x25, // 色温+ 短按
  LIGHT_COLOR_TEMP_MINUS: 0x21, // 色温- 短按
  LIGHT_SCENE_DAILY: 0x19, // 日常
  LIGHT_SCENE_RELAX: 0x1a, // 休闲
  LIGHT_SCENE_DELAY_OFF: 0x1d, // 延时关
  LIGHT_SCENE_SLEEP: 0x1b, // 助眠
  LIGHT_NIGHT_LAMP: 0x1c, // 小夜灯

  // 浴霸
  BATH_ALL_OFF: 0x0d, // 全关，待机
  BATH_LAMP: 0x06, // 照明
  BATH_NIGHT_LAMP: 0x08, // 小夜灯
  BATH_AUTO: 0x19, // 安心沐浴
  BATH_DRY: 0x1a, // 干燥
  BATH_VENTILATE: 0x1b, // 换气
  BATH_WIND: 0x1d, // 吹风
  BATH_WARM_SOFT: 0x05, // 弱暖
  BATH_WARM_STRONG: 0x01, // 强暖
  BATH_SWING: 0x18, // 摆风
  BATH_BRIGHT_PLUS: 0x0c, // 亮度+
  BATH_BRIGHT_PLUS_ACC: 0x0c, // 亮度+，长按与短按指令暂用一个
  BATH_BRIGHT_MINUS: 0x0a, // 亮度- 短按
  BATH_BRIGHT_MINUS_ACC: 0x0a, // 亮度- 长按
  BATH_TEMPERATURE_ADD: 0x88, // 温度+
  BATH_TEMPERATURE_SUB: 0x81, // 温度-
  BATH_WARM_UP: 0x8c, // 取暖

  // 凉霸（其余指令同浴霸）
  KITCHEN_WIND_STRONG: 0x02, // 强风
  KITCHEN_WIND_SOFT: 0x03, // 弱风

  // 厂测指令（调试用）
  FACTORY: 0x13,

  // 指令终止（松手时发送）
  END: 0x00,
}
