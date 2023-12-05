import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { sendDevice } from '../../apis/index'
import { PRO_TYPE } from '../../config/index'

type BtnItem = {
  text: string
  icon: string
  iconActive: string
  on?: boolean // 按钮是否激活状态
  rebound?: boolean // 按钮是否自动回弹状态
  textWidth?: string // 按钮文字宽度
}

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
    },
    // 是否场景设置
    isSceneSetting: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({
            // 场景设置增加关灯按钮，调整按钮宽度
            largeBtnMap: {
              off: {
                text: '关灯',
                icon: '../../assets/img/function/f00.png',
                iconActive: '../../assets/img/function/f01.png',
              },
              ...this.data.largeBtnMap,
              laundry: {
                ...this.data.largeBtnMap.laundry,
                textWidth: '48rpx',
              },
            },
          })
        }
      },
    },
    show: {
      type: Boolean,
      value: false,
    },
    // 是否显示进入详情页的按钮
    isShowSetting: {
      type: Boolean,
      value: false,
    },
    // 是否显示确认按钮
    isShowConfirm: {
      type: Boolean,
      value: false,
    },
    deviceInfo: {
      type: Object,
      value: {},
      observer(value) {
        if (value && this.data._canSyncCloudData) {
          this.setData({
            prop: value as Device.DeviceItem & Device.mzgdPropertyDTO,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _canSyncCloudData: true, // 是否响应云端变更
    _controlTimer: null as null | number, // 控制后计时器
    prop: {} as IAnyObject, // 用于视图显示
    // 按钮组
    btnMap: {
      up: {
        text: '上升',
        icon: '../../assets/img/function/f70.png',
        iconActive: '../../assets/img/function/f71.png',
      },
      pause: {
        text: '暂停',
        icon: '../../assets/img/function/f80.png',
        iconActive: '../../assets/img/function/f81.png',
      },
      down: {
        text: '下降',
        icon: '../../assets/img/function/f90.png',
        iconActive: '../../assets/img/function/f91.png',
      },
    } as Record<string, BtnItem>,
    // 下方大按钮
    largeBtnMap: {
      on: {
        text: '照明',
        icon: '../../assets/img/function/f50.png',
        iconActive: '../../assets/img/function/f51.png',
      },
      laundry: {
        text: '一键晾衣',
        icon: '../../assets/img/function/fa0.png',
        iconActive: '../../assets/img/function/fa1.png',
        textWidth: '96rpx',
        disabled: false,
      },
    } as Record<string, BtnItem>,
  },

  computed: {
    // 按钮组，转为数组格式
    btnList(data) {
      const { btnMap, prop } = data
      const { updown, location_status } = prop
      const res = Object.keys(btnMap).map((key: string) => {
        const on = updown === key
        const disabled =
          (key === 'up' && updown === 'up') ||
          (key === 'pause' && updown === 'pause') ||
          (key === 'down' && updown === 'down') ||
          (key === 'up' && location_status === 'upper_limit') ||
          (key === 'down' && location_status === 'lower_limit')

        return {
          ...btnMap[key],
          on,
          disabled,
          key,
        }
      })
      return res
    },
    // 下方大按钮，转为数组格式
    largeBtnList(data) {
      const { largeBtnMap, prop } = data
      const res = Object.keys(largeBtnMap).map((key) => {
        // 照明关闭，则【关灯】按钮点亮
        const on = key === 'laundry' ? prop['laundry'] === 'on' : prop['light'] === key
        // 未设置晾衣高度，则一键晾衣按钮禁用
        const disabled = key === 'laundry' && !data.custom_height

        return {
          ...largeBtnMap[key],
          on,
          disabled,
          key,
        }
      })
      return res
    },
    largeBtnStyle(data) {
      const { isSceneSetting } = data
      const width = isSceneSetting ? '170rpx' : '280rpx'
      return `height: 112rpx; width: ${width}; border-radius: 32rpx; background-color: #f7f8f9;`
    },
  },

  lifetimes: {
    detached() {
      if (this.data._controlTimer) {
        clearTimeout(this.data._controlTimer)
        this.data._controlTimer = null
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleBtnTap(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key as string
      const { prop } = this.data
      const property = {} as IAnyObject

      switch (key) {
        case 'up': {
          if (prop.updown === key) {
            if (this.data.isSceneSetting) {
              delete prop.updown
            } else {
              Toast({ message: '已在上升中', zIndex: 9999 })
            }
          } else if (prop.location_status === 'upper_limit' && !this.data.isSceneSetting) {
            Toast({ message: '已到达最高点', zIndex: 9999 })
          } else if (prop.updown !== key) {
            property.updown = key
            // 如果在最低点，则即时取消下限标志
            if (prop.location_status === 'lower_limit') {
              prop.location_status = 'normal'
            }
            // 场景设置时互斥
            if (this.data.isSceneSetting) {
              prop.laundry = 'off'
            }
          }
          break
        }
        case 'down':
          if (prop.location_status === 'lower_limit' && !this.data.isSceneSetting) {
            Toast({ message: '已到达最低点', zIndex: 9999 })
          } else if (prop.updown === key) {
            if (this.data.isSceneSetting) {
              delete prop.updown
            } else {
              Toast({ message: '已在下降中', zIndex: 9999 })
            }
          } else {
            property.updown = key
            // 如果在最高点，则即时取消上限标志
            if (prop.location_status === 'upper_limit') {
              prop.location_status = 'normal'
            }
            // 场景设置时互斥
            if (this.data.isSceneSetting) {
              prop.laundry = 'off'
            }
          }
          break
        case 'pause':
          if (prop.updown === key) {
            if (this.data.isSceneSetting) {
              delete prop.updown
            } else {
              Toast({ message: '已暂停', zIndex: 9999 })
            }
          } else {
            property.updown = key
            // 场景设置时互斥
            if (this.data.isSceneSetting) {
              prop.laundry = 'off'
            }
          }
          break

        case 'on': {
          const setValue = prop.light === 'on' ? 'off' : 'on'
          property.light = setValue
          break
        }

        case 'off': {
          if (prop.light === 'on') {
            property.light = 'off'
          } else {
            delete prop.light
          }
          break
        }

        case 'laundry': {
          if (prop.laundry === 'on') {
            if (this.data.isSceneSetting) {
              delete prop.laundry
            } else {
              Toast({ message: '一键晾衣执行中', zIndex: 9999 })
            }
          } else if (this.data.isSceneSetting) {
            // 场景设置时互斥
            prop.updown = ''
            property.laundry = 'on'
          }
          // 控制时要先判断是否已设置一键晾衣高度
          else if (prop.custom_height) {
            property.laundry = 'on'
            // 如果在最高最低点，则即时取消上下限标志
            if (prop.location_status !== 'normal') {
              prop.location_status = 'normal'
            }
          } else {
            Toast({ message: '请先设置好一键晾衣高度', zIndex: 9999 })
          }
          break
        }
      }

      if (prop.errorCode === 2) {
        Toast({ message: '遇到障碍物', zIndex: 9999 })
        return
      }
      if (prop.errorCode === 5) {
        Toast({ message: '负载过重，请减轻负载', zIndex: 9999 })
        return
      }
      if (prop.errorCode === 6) {
        Toast({ message: '电机过热，请稍后再使用', zIndex: 9999 })
        return
      }

      // 即时使用设置值渲染
      this.setData({
        prop: {
          ...prop,
          ...property,
        },
      })

      // 设置后N秒内屏蔽上报
      if (this.data._controlTimer) {
        clearTimeout(this.data._controlTimer)
        this.data._controlTimer = null
      }
      this.data._canSyncCloudData = false
      this.data._controlTimer = setTimeout(() => {
        this.data._canSyncCloudData = true
      }, 2000)

      const res = await sendDevice({
        deviceId: this.data.deviceInfo.deviceId,
        deviceType: this.data.deviceInfo.deviceType,
        proType: PRO_TYPE.clothesDryingRack,
        modelName: 'clothesDryingRack',
        property,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
        return
      }
    },
    toDetail() {
      const { deviceId } = this.data.deviceInfo

      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      const upDownOn = this.data.btnList.filter((item) => item.on)
      const lightSetting = this.data.largeBtnList.filter((item) => item.key !== 'laundry' && item.on)
      const laundrySetting = this.data.largeBtnList.filter((item) => item.key === 'laundry' && item.on)

      console.log('handleConfirm', upDownOn, lightSetting, laundrySetting)

      const diffData = {} as IAnyObject
      if (upDownOn.length) {
        diffData.updown = upDownOn[0].key
      }
      if (lightSetting.length) {
        diffData.light = lightSetting[0].key
      }
      if (laundrySetting.length) {
        diffData.laundry = 'on'
      }
      this.triggerEvent('confirm', diffData)
    },
  },
})
