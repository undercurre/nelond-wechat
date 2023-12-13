import Toast from '@vant/weapp/toast/toast'
import { checkInputNameIllegal } from '../../../../utils/index'

Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({
            name: this.data.value,
          })
        }
      },
    },
    value: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    name: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
      this.setData({
        name: '',
      })
    },
    handleConfirm() {
      // 校验名字合法性
      if (checkInputNameIllegal(this.data.name)) {
        Toast({
          message: '场景名称不能用特殊符号或表情',
          zIndex: 99999,
        })
        return
      }
      if (this.data.name.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        return
      }
      this.triggerEvent('confirm', this.data.name)
      this.setData({
        name: '',
      })
    },
  },
})
