import Toast from '@vant/weapp/toast/toast'
import { checkInputNameIllegal } from '../../../../utils/index'

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          console.log('show popup, value:', this.data.value)
          this.setData({
            deviceName: this.data.value,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    deviceName: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      // 校验名字合法性
      if (checkInputNameIllegal(this.data.deviceName)) {
        Toast('设备名称不能用特殊符号或表情')
        return
      }

      if (this.data.deviceName.length > 6) {
        Toast('设备名称不能超过6个字符')
        return
      }

      this.triggerEvent('confirm', this.data.deviceName)
    },
  },
})
