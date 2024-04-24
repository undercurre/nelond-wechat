import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../../../../apis/index'
import { PRO_TYPE } from '../../../../../config/index'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
    },
    canEditDevice: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    showEditDialog: false,
    dialogType: '',
    dialogName: '',
    dialogValue: 0,
  },

  computed: {
    blockTime(data) {
      const t = data.deviceInfo?.mzgdPropertyDTOList['light']?.blockTime ?? 0
      return t / 60
    },
    brightnessThreshold(data) {
      return data.deviceInfo?.mzgdPropertyDTOList['light']?.brightnessThreshold ?? 0
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleDialogShow(e: { currentTarget: { dataset: { key: 'blockTime' | 'brightnessThreshold' } } }) {
      if (!this.data.canEditDevice) return
      if (!this.data.deviceInfo.onLineStatus) return

      const { key } = e.currentTarget.dataset
      this.setData({
        dialogType: key,
        dialogName:
          {
            blockTime: '上报间隔',
            brightnessThreshold: '上报阈值',
          }[key] ?? '',
        showEditDialog: true,
        dialogValue: this.data[key] ?? 0,
      })
    },
    async handleConfirm(e: { detail: number }) {
      // console.log('handleConfirm', e.detail, this.data.deviceInfo)
      if (!e.detail) {
        Toast({
          message: `${this.data.dialogName}不能为空`,
          zIndex: 99999,
        })
        return
      }
      if (this.data.dialogType === 'blockTime') {
        if (e.detail > 60 || e.detail <= 0) {
          Toast({
            message: '上报间隔范围为1~60分钟',
            zIndex: 99999,
          })
          return
        }
      } else if (this.data.dialogType === 'brightnessThreshold') {
        if (e.detail > 1000 || e.detail <= 0) {
          Toast({
            message: '上报阈值时间为1~1000Lux',
            zIndex: 99999,
          })
          return
        }
      }
      const res = await sendDevice({
        proType: PRO_TYPE.sensor,
        modelName: 'lightsensor',
        deviceType: 2,
        gatewayId: this.data.deviceInfo.gatewayId,
        deviceId: this.data.deviceInfo.deviceId,
        property: { [this.data.dialogType]: e.detail },
      })
      if (!res.success) {
        Toast('控制失败')
      }

      this.triggerEvent('update')

      this.setData({
        showEditDialog: false,
      })
    },
  },
})
