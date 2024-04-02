import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceBinding } from '../../store/index'
import { getCurrentPageParams } from '../../utils/index'
import { emitter } from '../../utils/eventBus'
import { SCREEN_PID, PRO_TYPE, defaultImgDir } from '../../config/index'

ComponentWithComputed({
  options: {},

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    pageParam: '',
    defaultImg: {
      gateway: `${defaultImgDir}/only-gateway.png`,
      sensor: `${defaultImgDir}/sensor.png`,
      screen: `${defaultImgDir}/smart_screen.png`,
    },
  },

  computed: {
    pageTitle(data) {
      switch (data.pageParam) {
        case 'gateway':
          return '智能网关'
        case 'sensor':
          return '传感器'
        case 'screen':
          return '智慧屏'
        default:
          return ''
      }
    },
    deviceListCompited(data) {
      const list = data.allDeviceList ? [...data.allDeviceList].sort((a, b) => a.orderNum - b.orderNum) : []
      if (data.pageParam === 'gateway') {
        return list.filter((d: Device.DeviceItem) => d.proType === PRO_TYPE.gateway)
      } else if (data.pageParam === 'sensor') {
        return list.filter((d: Device.DeviceItem) => d.proType === PRO_TYPE.sensor)
      } else {
        return list.filter(
          (d: Device.DeviceItem) =>
            d.proType === PRO_TYPE.gateway &&
            SCREEN_PID.findIndex((item) => {
              item === d.productId
            }) !== -1,
        )
      }
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {
      const { param } = getCurrentPageParams()
      if (param) {
        this.setData({
          pageParam: param,
        })
      }
    },
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    onLoad() {
      emitter.on('deviceEdit', async () => {
        await deviceBinding.store.updateAllDeviceList()
      })
    },
    onUnload() {
      emitter.off('deviceEdit')
    },
    handleCardClick(e: { currentTarget: { dataset: { deviceId: string; deviceType: number } } }) {
      const { deviceId, deviceType } = e.currentTarget.dataset
      const pageName = deviceType === 4 ? 'group-detail' : 'device-detail'

      wx.navigateTo({
        url: `/package-mine/device-manage/${pageName}/index?deviceId=${deviceId}`,
      })
    },
    handleAddDevice() {
      wx.navigateTo({ url: '/package-distribution/scan/index' })
    },
  },
})
