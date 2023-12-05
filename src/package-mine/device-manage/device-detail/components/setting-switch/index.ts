import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
import { editDeviceInfo } from '../../../../../apis/device'
import { homeStore } from '../../../../../store/index'
import { checkInputNameIllegal } from '../../../../../utils/validate'

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
    switchClickIndex: 0,
    switchName: '',
    showPopup: false,
  },

  computed: {
    switchList(data) {
      return data.deviceInfo?.switchInfoDTOList ?? []
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleSwitchClick(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.canEditDevice) return
      this.setData({
        showPopup: true,
        switchClickIndex: e.currentTarget.dataset.index,
        switchName: this.data.deviceInfo.switchInfoDTOList[e.currentTarget.dataset.index].switchName,
      })
    },
    handleClose() {
      this.setData({
        showPopup: false,
      })
    },
    async handleConfirm() {
      // 校验名字合法性
      if (checkInputNameIllegal(this.data.switchName)) {
        Toast('按键名称不能用特殊符号或表情')
        return
      }
      this.setData({
        showPopup: false,
      })
      if (this.data.deviceInfo.switchInfoDTOList[this.data.switchClickIndex].switchName !== this.data.switchName) {
        if (this.data.switchName.length > 5) {
          Toast('按键名称不能超过5个字符字')
          return
        }
        const res = await editDeviceInfo({
          type: '3',
          deviceType: this.data.deviceInfo.deviceType,
          deviceId: this.data.deviceInfo.deviceId,
          houseId: homeStore.currentHomeDetail.houseId,
          switchId: this.data.deviceInfo.switchInfoDTOList[this.data.switchClickIndex].switchId,
          switchName: this.data.switchName,
        })
        if (res.success) {
          this.triggerEvent('update')
        }
      }
    },
  },
})
