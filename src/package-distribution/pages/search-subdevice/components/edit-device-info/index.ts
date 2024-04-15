import Toast from '@vant/weapp/toast/toast'
import { checkInputNameIllegal } from '../../../../../utils/index'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    deviceName: {
      type: String,
      value: '',
    },
    spaceId: {
      type: String,
      value: '',
    },
    spaceName: {
      type: String,
      value: '',
    },
    switchList: {
      type: Array,
      value: [],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    deviceInfo: null as null | IAnyObject,
  },

  observers: {
    'deviceName, spaceId, spaceName, switchList': function (deviceName, spaceId, spaceName, switchList) {
      this.setData({
        deviceInfo: {
          spaceId: spaceId,
          spaceName: spaceName,
          deviceName: deviceName,
          switchList: switchList,
        },
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    change(event: WechatMiniprogram.CustomEvent) {
      console.log('edit-device-info-change', event)
      this.setData({
        deviceInfo: event.detail,
      })
    },
    close() {
      this.triggerEvent('close')
    },
    confirm() {
      if (!this.data.deviceInfo?.deviceName) {
        Toast('名称不能为空')
        return
      }

      // 校验名字合法性
      if (checkInputNameIllegal(this.data.deviceInfo?.deviceName)) {
        Toast('名称不能用特殊符号或表情')
        return
      }

      if (this.data.deviceInfo?.deviceName.length > 6) {
        Toast('名称不能超过6个字符')
        return
      }

      if (this.data.deviceInfo) {
        this.triggerEvent('confirm', this.data.deviceInfo)
      }

      this.triggerEvent('close')
    },
  },
})
