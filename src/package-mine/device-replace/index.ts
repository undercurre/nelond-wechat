import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceBinding, deviceStore, projectStore } from '../../store/index'
import { StatusType } from './typings'
import { deviceReplace, gatewayReplace, queryDeviceInfoByDeviceId } from '../../apis/index'
// import { deviceReplace } from 'js-homos'
import { emitter, WSEventType, strUtil } from '../../utils/index'
import { PRODUCT_ID, SCREEN_PID, defaultImgDir } from '../../config/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir: defaultImgDir(),
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
     * canDevice 过滤边缘网关设备；过滤灯组；
     *
     * isFilterDevice 如当前选取新设备中，列表只显示相同productId的项，并排除已选择的旧设备
     * oldDeviceOrNewAndOnline 如当前选取新设备中，则须排除离线项
     */
    computedDeviceList(data) {
      const choosingNew = data.oldDeviceItem && data.oldDeviceItem.productId

      return deviceStore.allDeviceList.filter((device) => {
        const canDevice = device.deviceType === 2 || (device.deviceType === 1 && device.productId !== PRODUCT_ID.host)
        const isScreen = SCREEN_PID.includes(device.productId)
        const isFilterDevice = choosingNew
          ? device.productId === data.oldDeviceItem.productId && device.deviceId !== data.oldDeviceItem.deviceId
          : true
        const oldDeviceOrNewAndOnline = choosingNew ? device.onLineStatus : true
        return canDevice && !isScreen && isFilterDevice && oldDeviceOrNewAndOnline
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
        const isGatewayReplace = this.data.newDeviceItem.deviceType === 1
        this.setData({
          status: 'processing',
        })

        // 执行替换
        const res = isGatewayReplace
          ? await gatewayReplace({
              projectId: projectStore.currentProjectId,
              newDeviceId: this.data.newDeviceItem.deviceId,
              oldDeviceId: this.data.oldDeviceItem.deviceId,
            })
          : await deviceReplace({
              newDevId: this.data.newDeviceItem.deviceId,
              oldDevId: this.data.oldDeviceItem.deviceId,
            })
        console.log('deviceReplace', res)

        if (!res.success) {
          // 接口异常，直接失败
          this.setData({
            status: 'replaceFail',
          })
          Toast(res.msg)
          return
        }
        const WAITING = 60000
        const st = setTimeout(() => {
          this.setData({
            status: 'replaceFail',
          })
        }, WAITING)

        emitter.on('wsReceive', async (e) => {
          if (!isGatewayReplace && e.result.eventType === WSEventType.device_replace) {
            // TODO 事件能否区分成功与失败？
            clearTimeout(st)
            this.setData({
              status: 'replaceFinish',
            })
          } else if (isGatewayReplace && e.result.eventType === WSEventType.gateway_replace_result) {
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

    async confirmOldDevicePopup(event: WechatMiniprogram.CustomEvent<Device.DeviceItem>) {
      const device = event.detail

      console.log('confirmOldDevicePopup', device)

      if (device.deviceType !== 1) {
        this.setData({
          oldDeviceItem: device,
          isSelectOldDevice: false,
        })
        return
      }

      if (Number(device.version) < 510) {
        Dialog.alert({
          zIndex: 10001,
          message: '请升级网关版本后重试',
          confirmButtonText: '知道了',
        }).catch(() => {})
        return
      }

      const res = await queryDeviceInfoByDeviceId({ deviceId: device.deviceId }, { loading: true })

      if (!res.success) {
        Toast('查询设备信息失败')
        return
      }

      if (res.result.hasNewBackup === 1) {
        const dialogRes = await Dialog.confirm({
          zIndex: 10001,
          message: '当前网关备份包非最新，建议先进行网关手动备份',
          cancelButtonText: '去备份',
          confirmButtonText: '忽略',
        })
          .then(() => 'ignore')
          .catch(() => 'backup')

        console.log('dialogRes', dialogRes)
        if (dialogRes === 'backup') {
          wx.redirectTo({
            url: strUtil.getUrlWithParams('/package-mine/device-manage/device-detail/index', {
              deviceId: device.deviceId,
            }),
          })
          return
        }
      }

      this.setData({
        oldDeviceItem: device,
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
