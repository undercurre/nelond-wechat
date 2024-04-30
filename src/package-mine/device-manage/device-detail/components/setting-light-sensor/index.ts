import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../../../../apis/index'
import { PRO_TYPE } from '../../../../../config/index'
import { isNullOrUnDef } from '../../../../../utils/index'

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
    dialogUnit: '',
  },

  computed: {
    blockTime(data) {
      const t = data.deviceInfo?.mzgdPropertyDTOList['lightsensor']?.blockTime ?? 0
      return t / 60
    },
    brightnessThreshold(data) {
      return data.deviceInfo?.mzgdPropertyDTOList['lightsensor']?.brightnessThreshold ?? 0
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
        dialogUnit:
          {
            blockTime: '分钟',
            brightnessThreshold: 'Lux',
          }[key] ?? '',
        showEditDialog: true,
        dialogValue: this.data[key] ?? 0,
      })
    },
    async handleConfirm(e: { detail: string }) {
      console.log('handleConfirm', e.detail)
      if (isNullOrUnDef(e.detail) || e.detail === '') {
        Toast({
          message: `${this.data.dialogName}不能为空`,
          zIndex: 999999,
        })
        return
      }
      const setVal = Number(e.detail)
      if (!Number.isInteger(setVal)) {
        Toast({
          message: `请输入整数`,
          zIndex: 999999,
        })
        return
      }
      if (this.data.dialogType === 'blockTime') {
        if (setVal > 60 || setVal < 1) {
          Toast({
            message: '上报间隔范围为1~60分钟',
            zIndex: 999999,
          })
          return
        }
      } else if (this.data.dialogType === 'brightnessThreshold') {
        if (setVal > 1000 || setVal < 1) {
          Toast({
            message: '上报阈值时间为1~1000Lux',
            zIndex: 999999,
          })
          return
        }
      }
      const parseVal = this.data.dialogType === 'blockTime' ? setVal * 60 : setVal // 时间单位转换
      const res = await sendDevice({
        proType: PRO_TYPE.sensor,
        modelName: 'lightsensor',
        deviceType: 2,
        gatewayId: this.data.deviceInfo.gatewayId,
        deviceId: this.data.deviceInfo.deviceId,
        property: { [this.data.dialogType]: parseVal },
      })
      if (!res.success) {
        Toast({
          message: '控制失败',
          zIndex: 999999,
        })
      }

      this.triggerEvent('update')

      this.setData({
        showEditDialog: false,
      })
    },
  },
})
