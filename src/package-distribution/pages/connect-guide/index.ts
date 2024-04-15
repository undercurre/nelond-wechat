import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding } from '../../../store/index'
import { PRO_TYPE, sensorList } from '../../../config/index'
import { strUtil } from '../../../utils/index'
import Dialog from '@vant/weapp/dialog/dialog'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    sensorList,
    currentSensor: '',
    isReady: false,
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
    selectGatewayId: '', // TODO
    // selectGatewayId: '1678182378474882', // TODO
    isShowGatewayList: false, // 是否展示选择网关列表弹窗
    isShowNoGatewayTips: false, // 是否展示添加网关提示弹窗
  },

  computed: {
    gatewayList(data) {
      const allDeviceList: Device.DeviceItem[] = (data as IAnyObject).allDeviceList || []

      return allDeviceList.filter((item) => item.deviceType === 1)
    },
    currentGuide(data) {
      return data.sensorList.find((sensor) => sensor.productId === data.currentSensor)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad(query: { modelId?: string; q?: string }) {
      console.log(query)

      let modelId = ''
      // 页面跳转
      if (query?.modelId) {
        modelId = query.modelId
      }
      // 扫码进入
      else if (query?.q) {
        const pageParams = strUtil.getUrlParams(decodeURIComponent(query.q))
        console.log(pageParams)
        modelId = pageParams.modelId
      }

      if (modelId) {
        this.setData({
          currentSensor: modelId,
        })
      }
    },
    onReadyClick() {
      this.setData({
        isReady: !this.data.isReady,
      })
    },
    // FIXME 判断方法与下一步方法相互耦合
    handleNextStep() {
      if (!this.data.isReady) {
        return
      }
      // 如果存在网关信息，则直接跳转
      if (this.checkGateWayInfo()) {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-distribution/pages/search-subdevice/index', {
            gatewayId: this.data.selectGatewayId,
            proType: PRO_TYPE.sensor,
            productId: this.data.currentSensor,
          }),
        })
      }
    },

    async selectGateway(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.gatewayList[index]

      if (item.onLineStatus === 0) {
        return
      }

      this.setData({
        selectGatewayId: item.deviceId,
      })
    },

    confirmGateway() {
      this.setData({
        isShowGatewayList: false,
      })

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/pages/search-subdevice/index', {
          gatewayId: this.data.selectGatewayId,
          proType: PRO_TYPE.sensor,
          productId: this.data.currentSensor,
        }),
      })
    },

    onCloseGwList() {
      this.setData({
        isShowGatewayList: false,
        selectGatewayId: '',
      })
    },

    /**
     * 添加子设备时，检测是否已选择网关信息
     */
    checkGateWayInfo() {
      const gatewayId = this.data.selectGatewayId

      if (gatewayId) {
        return true
      }

      if (this.data.gatewayList.length === 0) {
        this.setData({
          isShowNoGatewayTips: true,
        })

        Dialog.alert({
          title: this.data.currentGuide?.name,
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })

        return false
      }

      // 存在唯一在线的网关，默认选中之
      if (this.data.gatewayList.length === 1 && this.data.gatewayList[0].onLineStatus === 1) {
        this.data.selectGatewayId = this.data.gatewayList[0].deviceId
      }
      // 弹出列表供选择
      else {
        this.setData({
          isShowGatewayList: true,
        })

        return false
      }

      return true
    },
  },
})
