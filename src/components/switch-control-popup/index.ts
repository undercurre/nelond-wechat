import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { PRO_TYPE } from '../../config/index'
import { sendDevice } from '../../apis/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否下发控制命令
    isControl: {
      type: Boolean,
      value: true,
    },
    title: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            power: this.data.switchInfo.power,
          })
        }
      },
    },
    /**
     * switchInfo数据结构
     * {
    deviceId: string
    gatewayId: string
    modelName: string
    power: number
  }
     */
    switchInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    power: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async controlSubDevice() {
      const switchInfo = this.data.switchInfo
      const property = { power: this.data.power }

      const res = await sendDevice({
        deviceId: switchInfo.deviceId,
        deviceType: 2,
        modelName: switchInfo.modelName,
        gatewayId: switchInfo.gatewayId,
        proType: PRO_TYPE.switch,
        property,
      })

      if (!res.success) {
        Toast('控制失败')
        return
      }
    },

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      if (this.data.isControl) {
        this.controlSubDevice()
      }

      this.triggerEvent('confirm', { power: this.data.power })
    },
    handleOnOffChange(e: WechatMiniprogram.CustomEvent) {
      const power = e.detail ? 1 : 0

      this.setData({
        power,
      })

      this.handleConfirm()
    },
  },
})
