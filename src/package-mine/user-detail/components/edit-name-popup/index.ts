import Toast from '@vant/weapp/toast/toast'
import { checkUserNameIllegal } from '../../../../utils/index'

Component({
  options: {},
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
          this.setData({
            name: this.data.value,
          })
        }
      },
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
    },
    handleConfirm() {
      if (this.data.name.length > 10) {
        Toast('用户名称不能超过10个字符')
        return
      }

      // 校验名字合法性
      if (!checkUserNameIllegal(this.data.name)) {
        Toast('用户名称格式错误')
        return
      }

      this.triggerEvent('confirm', this.data.name)
    },
  },
})
