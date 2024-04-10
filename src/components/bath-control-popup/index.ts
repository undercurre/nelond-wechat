import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../apis/index'
import { PRO_TYPE } from '../../config/index'

type BtnItem = {
  text: string
  icon: string
  iconActive: string
  on?: boolean // 按钮是否激活状态
  rebound?: boolean // 按钮是否自动回弹状态
}

// 互斥的属性列表
const MUTEX_PROP = ['blowing', 'heating']
/**
 * @name 属性切换
 * @param mode 原有的属性字符串，用逗号分隔
 * @param key 要比较的属性
 * @param toRemove key存在时，是否要删除
 */
const toggleProp = (mode: string, key: string, toRemove = true): string => {
  const arr = mode.split(',')
  // console.log('[toggleProp trigger]', arr, key)
  // key已存在，则移除
  if (arr.includes(key)) {
    if (toRemove) {
      arr.splice(arr.indexOf(key), 1)
    }
    if (key !== 'close_all' && !arr.length) {
      arr.push('close_all')
    }
  }
  // key不存在，即添加，并移除待机
  else {
    if (arr.includes('close_all')) {
      arr.splice(arr.indexOf('close_all'), 1)
    }
    if (MUTEX_PROP.includes(key)) {
      MUTEX_PROP.forEach((item) => {
        const index = arr.indexOf(item)
        if (index !== -1) {
          arr.splice(index, 1)
        }
      })
    }

    arr.push(key)
  }

  // console.log('[toggleProp result]', arr)
  return arr.join(',')
}

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
    },
    // 是否场景设置（使用设置值），
    isSceneSetting: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({
            // 场景中，待机按钮状态不回弹
            'btnMap.close_all.rebound': false,
            // 场景设置增加关灯按钮
            largeBtnMap: {
              close_all: {
                text: '关灯',
                icon: '../../assets/img/function/f00.png',
                iconActive: '../../assets/img/function/f01.png',
                rebound: true,
              },
              ...this.data.largeBtnMap,
            },
          })
        }
      },
    },
    show: {
      type: Boolean,
      value: false,
    },
    // 是否显示进入详情页的按钮
    isShowSetting: {
      type: Boolean,
      value: false,
    },
    // 是否显示确认按钮
    isShowConfirm: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
      value: {},
      observer(value) {
        if (value && this.data._canSyncCloudData && value.proType === PRO_TYPE.bathHeat) {
          this.setData({
            prop: value as Device.DeviceItem & Device.mzgdPropertyDTO,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _canSyncCloudData: true, // 是否响应云端变更
    _controlTimer: null as null | number, // 控制后计时器
    prop: {} as IAnyObject, // 用于视图显示
    // 按钮组对象
    btnMap: {
      close_all: {
        text: '待机',
        icon: '../../assets/img/function/f00.png',
        iconActive: '../../assets/img/function/f01.png',
        rebound: true,
      },
      heating_strong: {
        text: '强暖',
        icon: '../../assets/img/function/f10.png',
        iconActive: '../../assets/img/function/f11.png',
      },
      heating_soft: {
        text: '弱暖',
        icon: '../../assets/img/function/f20.png',
        iconActive: '../../assets/img/function/f21.png',
      },
      ventilation: {
        text: '换气',
        icon: '../../assets/img/function/f30.png',
        iconActive: '../../assets/img/function/f31.png',
      },
      blowing: {
        text: '吹风',
        icon: '../../assets/img/function/f40.png',
        iconActive: '../../assets/img/function/f41.png',
      },
    } as Record<string, BtnItem>,
    // 下方大按钮对象
    largeBtnMap: {
      main_light: {
        text: '照明',
        icon: '../../assets/img/function/f50.png',
        iconActive: '../../assets/img/function/f51.png',
      },
      night_light: {
        text: '夜灯',
        icon: '../../assets/img/function/f60.png',
        iconActive: '../../assets/img/function/f61.png',
      },
    } as Record<string, BtnItem>,
  },

  computed: {
    // 按钮组，转为数组格式
    btnList(data) {
      const { btnMap, prop, isSceneSetting } = data
      const { mode = '' } = prop
      const res = Object.keys(btnMap).map((key: string) => {
        let on = false
        switch (key) {
          case 'heating_strong':
            on = mode.indexOf('heating') > -1 && Number(prop.heating_temperature) >= 43
            break
          case 'heating_soft':
            on = mode.indexOf('heating') > -1 && Number(prop.heating_temperature) <= 42
            break
          // 全关状态不显示
          case 'close_all':
            on = isSceneSetting && mode.indexOf(key) > -1
            break
          default:
            on = mode.indexOf(key) > -1
        }
        return {
          ...btnMap[key],
          on,
          key,
        }
      })
      return res
    },
    // 下方大按钮，转为数组格式
    largeBtnList(data) {
      const { largeBtnMap, prop } = data
      const res = Object.keys(largeBtnMap).map((key: string) => {
        const on = (prop.light_mode ?? '').indexOf(key) > -1
        return {
          ...largeBtnMap[key],
          on,
          key,
        }
      })
      return res
    },
    largeBtnStyle(data) {
      const { isSceneSetting } = data
      const width = isSceneSetting ? '170rpx' : '280rpx'
      return `height: 112rpx; width: ${width}; border-radius: 32rpx; background-color: #f7f8f9;`
    },
  },

  lifetimes: {
    detached() {
      if (this.data._controlTimer) {
        clearTimeout(this.data._controlTimer)
        this.data._controlTimer = null
      }
    },
  },

  /**
   * 组件的方法列表
   * 页面视图使用设备状态值，暂时屏蔽所有的即时值设置
   */
  methods: {
    async handleModeTap(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key as string
      const { prop } = this.data
      const { mode = '', heating_temperature } = prop
      const property = {} as IAnyObject // 本次要发送的指令

      switch (key) {
        case 'heating_strong': {
          const isStrong = mode.indexOf('heating') > -1 && Number(heating_temperature) >= 43
          if (isStrong) {
            property.mode = toggleProp(mode, 'heating')
          } else {
            property.mode = toggleProp(mode, 'heating', false)
            property.heating_temperature = '45'
          }
          break
        }
        case 'heating_soft': {
          const isSoft = mode.indexOf('heating') > -1 && Number(heating_temperature) <= 42
          if (isSoft) {
            property.mode = toggleProp(mode, 'heating')
          } else {
            property.mode = toggleProp(mode, 'heating', false)
            property.heating_temperature = '30'
          }
          break
        }
        // 待机
        case 'close_all': {
          if (mode?.indexOf(key) > -1 && this.data.isSceneSetting) {
            delete prop.mode
          } else {
            property.mode = key
          }
          break
        }

        // blow && ventilation
        default: {
          property.mode = toggleProp(mode, key)
        }
      }

      // 即时使用设置值渲染
      this.setData({
        prop: {
          ...prop,
          ...property,
        },
      })

      this.toSendDevice(property)
    },
    async handleLightModeTap(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key as string
      const { prop } = this.data
      const { light_mode = '' } = prop
      const property = {} as IAnyObject // 本次要发送的指令

      switch (key) {
        case 'main_light':
        case 'night_light': {
          property.light_mode = light_mode === key ? 'close_all' : key
          break
        }
        // 关灯
        case 'close_all': {
          if (light_mode?.indexOf(key) > -1 && this.data.isSceneSetting) {
            delete prop.light_mode
          } else {
            property.light_mode = key
          }
          break
        }
      }

      // 即时使用设置值渲染
      this.setData({
        prop: {
          ...prop,
          ...property,
        },
      })

      this.toSendDevice(property)
    },
    async toSendDevice(property: IAnyObject) {
      // 设置后N秒内屏蔽上报
      if (this.data._controlTimer) {
        clearTimeout(this.data._controlTimer)
        this.data._controlTimer = null
      }
      this.data._canSyncCloudData = false
      this.data._controlTimer = setTimeout(() => {
        this.data._canSyncCloudData = true
      }, 5000)

      const res = await sendDevice({
        deviceId: this.data.deviceInfo.deviceId,
        deviceType: this.data.deviceInfo.deviceType,
        proType: PRO_TYPE.bathHeat,
        modelName: 'bathHeat',
        property,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
        return
      }
    },
    toDetail() {
      const { deviceId } = this.data.deviceInfo

      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      const modeOn = this.data.btnList.filter((item) => item.on).map((item) => item.key)
      const lightModeOn = this.data.largeBtnList.filter((item) => item.on).map((item) => item.key)

      const actionsData = {} as IAnyObject
      if (modeOn.length) {
        actionsData.mode = modeOn.join(',')
        if (actionsData.mode.indexOf('heating_soft') > -1) {
          actionsData.mode = actionsData.mode.replace('heating_soft', 'heating')
          actionsData.heating_temperature = '30'
        } else if (actionsData.mode.indexOf('heating_strong') > -1) {
          actionsData.mode = actionsData.mode.replace('heating_strong', 'heating')
          actionsData.heating_temperature = '45'
        }
      }
      if (lightModeOn.length) {
        actionsData.light_mode = lightModeOn.join(',')
      }
      console.log('handleConfirm', actionsData)

      this.triggerEvent('confirm', actionsData)
    },
  },
})
