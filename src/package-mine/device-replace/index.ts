import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceBinding, deviceStore } from '../../store/index'
import { StatusType } from './typings'
import { deviceReplace } from '../../apis/index'
// import { deviceReplace } from 'js-homos'
import { emitter } from '../../utils/eventBus'
import { SCREEN_PID, defaultImgDir } from '../../config/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    status: 'introduce' as StatusType,
    isSelectOldDevice: false,
    isSelectNewDevice: false,
    oldDeviceItem: <Device.DeviceItem>{},
    newDeviceItem: <Device.DeviceItem>{},
  },

  computed: {
    /**
     * @description 待选设备列表
     * choosingNew 如存在 oldDeviceItem，则当前选取新设备中
     * isSubdevice 过滤网关设备；
     *
     * isFilterDevice 如当前选取新设备中，列表只显示相同productId的项，并排除已选择的旧设备
     * oldDeviceOrNewAndOnline 如当前选取新设备中，则须排除离线项
     */
    computedDeviceList(data) {
      const choosingNew = data.oldDeviceItem && data.oldDeviceItem.productId

      return deviceStore.allDeviceList.filter((device) => {
        const isSubdevice = device.deviceType === 2
        const isScreen = SCREEN_PID.includes(device.productId)
        const isFilterDevice = choosingNew
          ? device.productId === data.oldDeviceItem.productId && device.deviceId !== data.oldDeviceItem.deviceId
          : true
        const oldDeviceOrNewAndOnline = choosingNew ? device.onLineStatus : true
        return isSubdevice && !isScreen && isFilterDevice && oldDeviceOrNewAndOnline
      })
    },
    nextBtnText(data) {
      const textMap = {
        introduce: '我知道了',
        oldDevice: '下一步',
        newDevice: '开始替换',
        processing: '',
        replaceFinish: '完成',
        replaceFail: '重试',
      }

      return textMap[data.status]
    },

    nextBtnDisabled(data) {
      if (data.status === 'oldDevice' && !data.oldDeviceItem.deviceId) {
        return true
      }
      if (data.status === 'newDevice' && !data.newDeviceItem.deviceId) {
        return true
      }
      return false
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {
      emitter.off('wsReceive')
    },
  },

  methods: {
    // 左边按钮，在选择新设备时或替换失败出现
    prevBtn() {
      if (this.data.status === 'newDevice') {
        this.setData({
          status: 'oldDevice',
        })
        return
      }
      if (this.data.status === 'replaceFail') {
        this.goBack()
        return
      }
    },

    // 暂时逐一判断
    async nextBtn() {
      if (this.data.status === 'introduce') {
        this.setData({
          status: 'oldDevice',
        })
        return
      }

      if (this.data.status === 'oldDevice') {
        this.setData({
          status: 'newDevice',
        })
        return
      }

      // 进入开始替换
      if (this.data.status === 'newDevice') {
        this.setData({
          status: 'processing',
        })

        // 执行替换
        const res = await deviceReplace({
          newDevId: this.data.newDeviceItem.deviceId,
          oldDevId: this.data.oldDeviceItem.deviceId,
        })
        console.log('deviceReplace', res)

        if (!res.success) {
          // 接口异常，直接失败
          this.setData({
            status: 'replaceFail',
          })
          return
        }
        const WAITING = 30000
        const st = setTimeout(() => {
          this.setData({
            status: 'replaceFail',
          })
        }, WAITING)

        emitter.on('wsReceive', async (e) => {
          // TODO 事件能否区分成功与失败？
          if (e.result.eventType === 'device_replace') {
            clearTimeout(st)
            this.setData({
              status: 'replaceFinish',
            })
          }
        })
        return
      }

      // 重试，返回旧设备选择
      if (this.data.status === 'replaceFail') {
        this.setData({
          status: 'oldDevice',
        })
        return
      }

      // 完成，跳回我的首页
      if (this.data.status === 'replaceFinish') {
        this.goBack()
        return
      }
    },

    addOldDevice() {
      const allDeviceList = deviceBinding.store.allDeviceList
      if (!allDeviceList || !allDeviceList.length) {
        Toast('项目中没有设备')
        return
      }

      this.setData({
        isSelectOldDevice: true,
      })
    },

    addNewDevice() {
      this.setData({
        isSelectNewDevice: true,
      })
    },

    closeOldDevicePopup() {
      this.setData({
        isSelectOldDevice: false,
      })
    },

    closeNewDevicePopup() {
      this.setData({
        isSelectNewDevice: false,
      })
    },

    confirmOldDevicePopup(event: WechatMiniprogram.CustomEvent<Device.DeviceItem>) {
      this.setData({
        oldDeviceItem: event.detail,
        isSelectOldDevice: false,
      })
    },

    confirmNewDevicePopup(event: WechatMiniprogram.CustomEvent<Device.DeviceItem>) {
      this.setData({
        newDeviceItem: event.detail,
        isSelectNewDevice: false,
      })
    },
  },
})
