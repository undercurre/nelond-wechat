import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { getModelName } from '../../config/index'
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
            curtain_position:
              this.data.deviceInfo.deviceType === 2
                ? this.data.deviceInfo.level
                : this.data.deviceInfo.curtain_position,
          })
        }
      },
    },
    /**
     * deviceInfo数据结构
     * {
    deviceId: string
    curtain_position: number
  }
     */
    deviceInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    curtain_position: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async controlSubDevice() {
      const { deviceType, deviceId, gatewayId, proType } = this.data.deviceInfo
      const posAttrName = deviceType === 2 ? 'level' : 'curtain_position'
      const property = { [posAttrName]: this.data.curtain_position }
      const modelName = getModelName(proType)

      const res = await sendDevice({
        proType,
        deviceType,
        deviceId,
        gatewayId,
        property,
        modelName,
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

      this.triggerEvent('confirm', { curtain_position: this.data.curtain_position })
    },
    handleChange(e: { detail: number }) {
      console.log('handleChange', e)
      const curtain_position = e.detail
      this.setData({
        curtain_position: curtain_position,
      })
    },
  },
})
