import { ComponentWithComputed } from 'miniprogram-computed'
import { proName, PRO_TYPE, getModelName } from '../../config/index'
import { throttle } from '../../utils/index'

const CONTROL_INTERVAL = 3000 // 开关操作间隔时间

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示选中样式，包括单选和多选
    select: {
      type: Boolean,
      value: false,
    },
    editMode: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
    },
    // 是否显示控制图标（如电源开关）
    showControl: {
      type: Boolean,
      value: false,
    },
    // 是否带投影
    showShadow: {
      type: Boolean,
      value: false,
    },
    // 是否带渐变背景
    showGradientBg: {
      type: Boolean,
      value: false,
    },
    // 是否显示开关按键名称及图标
    showBtnDetail: {
      type: Boolean,
      value: true,
    },
    // 是否启用特殊背景
    showSpecialBg: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    ripple: false,
    power: false, // true: on false: off
    showDeviceOffline: false,
    isProcessing: false,
    _clientRect: {} as IAnyObject,
    isLoadImgError: false,
  },
  lifetimes: {
    ready() {
      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => (this.data._clientRect = res[0]))
    },
    detached() {},
  },

  computed: {
    picUrl(data) {
      if (data.isLoadImgError) {
        return `/assets/img/offline/default-device.png`
      }
      if (data.deviceInfo.proType === PRO_TYPE.switch && data.showBtnDetail) {
        return data.deviceInfo?.switchInfoDTOList[0]?.pic
      } else if (data.deviceInfo?.pic) {
        return data.deviceInfo.pic
      }
      return ''
    },
    controlBtnPic(data) {
      if (data.deviceInfo.proType === PRO_TYPE.gateway) {
        return ''
      }
      // 窗帘，位置大于0即为开启
      if (data.deviceInfo.proType === PRO_TYPE.curtain) {
        const posAttrName = data.deviceInfo.deviceType === 2 ? 'level' : 'curtain_position'
        const pos = data.deviceInfo.mzgdPropertyDTOList['curtain'][posAttrName]
        const isClosed = pos === '0'
        if (data.isProcessing) {
          return isClosed ? '/assets/img/base/curtain-opening.png' : '/assets/img/base/curtain-closing.png'
        }
        return isClosed ? '/assets/img/base/curtain-open.png' : '/assets/img/base/curtain-close.png'
      }
      // 灯及灯组
      else if (data.deviceInfo.proType === PRO_TYPE.light) {
        return data.deviceInfo.mzgdPropertyDTOList['light'].power
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      // 面板
      else if (data.deviceInfo.proType === PRO_TYPE.switch) {
        // ! 确保带有switchInfoDTOList
        const switchId = data.deviceInfo.switchInfoDTOList[0]?.switchId
        if (!switchId || !data.deviceInfo.mzgdPropertyDTOList[switchId]) {
          // 万一设备没有开关属性，不显示
          return ''
        }
        return data.deviceInfo.mzgdPropertyDTOList[switchId].power
          ? '/assets/img/base/power-on.png'
          : '/assets/img/base/power-off.png'
      }
      return ''
    },
    topTitle(data) {
      // 如果是开关，deviceName显示开关名称
      let name
      if (data.deviceInfo.proType === PRO_TYPE.switch && data.showBtnDetail) {
        const switchInfo = data.deviceInfo.switchInfoDTOList[0]
        name = switchInfo.switchName ?? '按键' + switchInfo.switchId
      } else {
        name = data.deviceInfo.deviceName
      }
      return name?.length > 5 ? name.slice(0, 2) + '...' + name.slice(-2) : name
    },
    bottomDesc(data) {
      return data.deviceInfo?.deviceName?.length > 5
        ? data.deviceInfo?.deviceName?.slice(0, 2) + '...' + data.deviceInfo?.deviceName?.slice(-2)
        : data.deviceInfo.deviceName
    },
    deviceType(data) {
      return proName[data.deviceInfo.proType]
    },
    /** 开关面板名称 */
    switchDeviceName(data) {
      return data.deviceInfo.deviceName.slice(0, 5)
    },

    // 设备是否可控
    // !! 需要使用双否定将undefined null值转换为boolean，以免视图显示中判断异常
    canCtrl(data) {
      return !!(data.deviceInfo.onLineStatus || data.deviceInfo.canLanCtrl)
    },

    // 设备是灯组
    isGroup(data) {
      return data.deviceInfo.deviceType === 4
    },
    // 设备是传感器，显示电量状态
    lowBattery(data) {
      if (data.deviceInfo.proType === PRO_TYPE.sensor) {
        const modelName = getModelName(PRO_TYPE.sensor, data.deviceInfo.productId)
        const prop = data.deviceInfo.mzgdPropertyDTOList[modelName]
        return !!prop?.batteryAlarmState
      }
      return false
    },
    // 特定设备，显示工作状态
    isRunning(data) {
      const modelName = getModelName(data.deviceInfo.proType, data.deviceInfo.productId)
      const prop = data.deviceInfo.mzgdPropertyDTOList[modelName]
      if (data.deviceInfo.proType === PRO_TYPE.bathHeat) {
        return (
          prop?.mode === 'heat' ||
          prop?.mode === 'blowing' ||
          prop?.mode === 'ventilation' ||
          prop?.light_mode !== 'close_all'
        )
      } else if (data.deviceInfo.proType === PRO_TYPE.clothesDryingRack) {
        return prop?.location_status !== 'upper_limit' || prop?.light === 'on'
      }
      return false
    },
    // 在卡片上有控制按钮的
    hasControl(data) {
      return (
        data.deviceInfo.proType !== PRO_TYPE.gateway &&
        data.deviceInfo.proType !== PRO_TYPE.sensor &&
        data.deviceInfo.proType !== PRO_TYPE.bathHeat &&
        data.deviceInfo.proType !== PRO_TYPE.clothesDryingRack
      )
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap() {
      if (this.data.editMode) {
        this.triggerEvent('cardTap', {
          ...this.data.deviceInfo,
          clientRect: this.data._clientRect,
        })
      } else {
        if (this.data.canCtrl) {
          this.triggerEvent('cardTap', {
            ...this.data.deviceInfo,
            clientRect: this.data._clientRect,
          })
        } else {
          this.triggerEvent('offlineTap', {
            ...this.data.deviceInfo,
            clientRect: this.data._clientRect,
          })
        }
      }
    },
    /**
     * 处理中部位置点击时的事件，优化交互手感
     */
    handleMiddleTap() {
      if (this.data.showControl && this.data.canCtrl) {
        this.handlePowerTap()
      } else {
        this.handleCardTap()
      }
    },
    // 节流执行
    controlThrottle: throttle(
      function (this: IAnyObject) {
        this.setData({
          isProcessing: true,
          ripple: true,
        })

        // 回滚状态及动画
        setTimeout(() => {
          this.setData({
            isProcessing: false,
            ripple: false,
          })
        }, CONTROL_INTERVAL)
      },
      CONTROL_INTERVAL,
      true,
      false,
    ),
    handlePowerTap() {
      // 如果设备离线，则转为点击卡片
      if (!this.data.canCtrl) {
        this.handleCardTap()
        return
      }

      // 如果控制图片不存在，则不可能点击控制按钮
      if (!this.data.controlBtnPic) return

      // 振动反馈
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })

      // emit 事件，发送指令等
      this.triggerEvent('controlTap', { ...this.data.deviceInfo, clientRect: this.data._clientRect })

      // 状态反转
      let power = false
      if (this.data.deviceInfo.proType === PRO_TYPE.light) {
        const modelName = this.data.deviceInfo.proType === PRO_TYPE.light ? 'light' : 'wallSwitch1'
        power = !this.data.deviceInfo.mzgdPropertyDTOList[modelName].power
      } else if (this.data.deviceInfo.proType === PRO_TYPE.switch) {
        const { switchId } = this.data.deviceInfo.switchInfoDTOList[0]
        power = !this.data.deviceInfo.mzgdPropertyDTOList[switchId]?.power

        // 未确定用途，暂时注释
        // if (this.data.deviceInfo.mzgdPropertyDTOList[switchId].ButtonMode === 2) {
        //   return
        // }
      }

      this.setData({
        power,
      })

      // 节流执行的部分
      this.controlThrottle()
    },
    handleLongPress() {
      // 振动反馈
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })

      this.createSelectorQuery()
        .select('#card')
        .boundingClientRect()
        .exec((res) => {
          this.triggerEvent('longPress', {
            ...this.data.deviceInfo,
            clientRect: res[0],
          })
        })
    },

    loadImgError() {
      this.setData({
        isLoadImgError: true,
      })
    },
  },
})
