import { deviceStore } from './../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { throttle } from '../../utils/index'
import { sendDevice } from '../../apis/index'
import { NO_COLOR_TEMP, PRO_TYPE } from '../../config/index'

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
    // 是否下发控制命令
    isControl: {
      type: Boolean,
      value: true,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          if (this.data.lightInfo.power) {
            this.setData({
              power: this.data.lightInfo.power,
              brightness: this.data.lightInfo.brightness ?? 1,
              colorTemperature: this.data.lightInfo.colorTemperature ?? 0,
            })
          } else {
            this.setData({
              power: this.data.lightInfo.power,
              brightness: this.data.lightInfo.brightness ?? 1,
              colorTemperature: this.data.lightInfo.colorTemperature ?? 0,
            })
          }
        }
      },
    },
    /**
     * lightInfo数据结构
     * {
    deviceType: number
    deviceId: string
    gatewayId?: string
    modelName?: string
    property: IAnyObject
  }
     */
    lightInfo: {
      type: Object,
      value: {
        modelName: 'light',
        deviceType: 0,
        power: 0,
        brightness: 1,
        colorTemperature: 0,
        maxColorTemp: 6500,
        minColorTemp: 2700,
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    power: 0,
    brightness: -1, // HACK 未加载前不设置实际值，加载完成后才能触发进度条变化
    colorTemperature: -1,
  },

  computed: {
    colorTempShow(data) {
      const { maxColorTemp, minColorTemp } = data.lightInfo.colorTempRange || data.lightInfo

      return (data.colorTemperature / 100) * (maxColorTemp - minColorTemp) + minColorTemp
    },
    hasColorTemp(data) {
      const { deviceId } = data.lightInfo
      const { productId = '0' } = deviceStore.allDeviceMap[deviceId] ?? {}
      console.log('hasColorTemp productId', productId)
      return !NO_COLOR_TEMP.includes(productId)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    controlSubDevice: throttle(async function (this: IAnyObject, property: IAnyObject) {
      const lightInfo = this.data.lightInfo

      const res = await sendDevice({
        deviceId: lightInfo.deviceId,
        gatewayId: lightInfo.gatewayId,
        deviceType: lightInfo.deviceType,
        proType: PRO_TYPE.light,
        modelName: 'light',
        property,
      })

      if (!res.success) {
        Toast('控制失败')
        return
      }
    }, 1000),

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent(
        'confirm',
        this.data.power
          ? {
              power: this.data.power,
              brightness: this.data.brightness,
              colorTemperature: this.data.colorTemperature,
            }
          : {
              power: this.data.power,
            },
      )
    },

    handleChange() {
      this.triggerEvent(
        'change',
        this.data.power
          ? {
              power: this.data.power,
              brightness: this.data.brightness,
              colorTemperature: this.data.colorTemperature,
            }
          : {
              power: this.data.power,
            },
      )
    },
    handleOnOffChange(e: WechatMiniprogram.CustomEvent) {
      const power = e.detail ? 1 : 0

      this.setData({
        power: power,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ power: this.data.power })
      }
    },
    handleLevelDrag(e: { detail: number }) {
      this.setData({
        brightness: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ brightness: this.data.brightness })
      }
    },
    handleLevelChange(e: { detail: number }) {
      this.setData({
        brightness: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ brightness: this.data.brightness })
      }
    },
    handleColorTempChange(e: { detail: number }) {
      this.setData({
        colorTemperature: e.detail,
      })

      if (this.data.isControl) {
        this.controlSubDevice({ colorTemperature: this.data.colorTemperature })
      }
    },
    handleColorTempDrag(e: { detail: number }) {
      this.setData({
        colorTemperature: e.detail,
      })
      if (this.data.isControl) {
        this.controlSubDevice({ colorTemperature: this.data.colorTemperature })
      }
      this.handleChange()
    },
  },
})
