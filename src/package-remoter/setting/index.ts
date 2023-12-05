import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { emitter } from '../../utils/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    showEditNamePopup: false,
    isShowSetting: false,
    fastSwitchName: '照明开关',
  },

  computed: {},

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      const { deviceType, deviceModel, addr } = query
      this.setData({ deviceType, deviceModel, addr })
    },

    handleDeviceNameEditPopup() {
      this.setData({
        showEditNamePopup: true,
      })
    },
    handleDeviceNameEditCancel() {
      this.setData({
        showEditNamePopup: false,
      })
    },
    handleDeviceNameEditConfirm(e: { detail: string }) {
      const deviceName = e.detail

      remoterStore.renameCurRemoter(deviceName)

      this.setData({
        showEditNamePopup: false,
      })

      emitter.emit('remoterChanged')
    },
    toSetting() {
      this.setData({
        isShowSetting: true,
      })
    },
    onCloseSetting() {
      this.setData({
        isShowSetting: false,
      })
    },
    onSelectSetting(e: WechatMiniprogram.CustomEvent) {
      const actions = remoterStore.curRemoter.actions
      const index = actions.findIndex((action) => action.name === e.detail.name)
      console.log('onSelectSetting', e.detail.name, index)

      remoterStore.changeAction(index)
      emitter.emit('remoterChanged')
    },
    handleDeviceDelete() {
      Dialog.confirm({
        title: '确定删除该设备？',
      })
        .then(() => {
          Toast('删除成功')
          remoterStore.removeCurRemoter()

          wx.navigateBack({
            delta: 2,
            complete() {
              emitter.emit('remoterChanged')
            },
          })
        })
        .catch(() => {})
    },
    handleDeviceUnbind() {
      Dialog.confirm({
        title: '确认解除实体遥控器与当前设备的配对关系？',
      })
        .then(async () => {
          Toast('解绑成功')
        })
        .catch(() => {})
    },
  },
})
