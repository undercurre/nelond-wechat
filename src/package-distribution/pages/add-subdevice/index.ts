import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { projectBinding, spaceBinding, deviceBinding } from '../../../store/index'
import { bleUtil, strUtil, BleClient, getCurrentPageParams, emitter, Logger, IAdData } from '../../../utils/index'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { sendCmdAddSubdevice, bindDevice, isDeviceOnline, batchGetProductInfoByBPid } from '../../../apis/index'
import { IBleDevice } from './typings'
import dayjs from 'dayjs'
import { defaultImgDir, productImgDir } from '../../../config/index'

type StatusName = 'linking' | 'error'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    productImgDir,
    defaultImgDir,
    _timeId: 0,
    status: 'linking' as StatusName,
    activeIndex: 0,
    pageParams: {} as IAnyObject,
    _hasFound: false, // 是否已经找到指定mac设备
    _startTime: 0, // 发送完蓝牙配网指令的实际
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: async function () {
      bleUtil.initBle()
      const pageParams = getCurrentPageParams()
      console.log('pageParams', pageParams)

      this.setData({
        pageParams,
      })
      this.initBle()

      // 扫码子设备，60s超时处理，无论是否发现目标子设备
      this.data._timeId = setTimeout(async () => {
        if (!this.data._hasFound) {
          console.error(`没有发现子设备${this.data.pageParams.mac}`)
        }

        console.error(`【${this.data.pageParams.mac}】绑定推送监听超时`)
        emitter.off('bind_device')
        const isBind = await this.queryZigbeeBindStatus()

        if (!isBind) {
          this.setData({
            status: 'error',
          })
        }
      }, 70000)

      emitter.on('bind_device', (data) => {
        if (data.deviceId === this.data.pageParams.mac) {
          console.log(`收到绑定推送消息：子设备${this.data.pageParams.mac}`)
          this.bindBleDeviceToCloud()
          emitter.off('bind_device')
          clearTimeout(this.data._timeId)
        }
      })
    },
    detached() {
      emitter.off('bind_device')
      clearTimeout(this.data._timeId)
      wx.stopBluetoothDevicesDiscovery()
      this.stopGwAddMode()
    },
  },

  methods: {
    async initBle() {
      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((error) => error)

      console.log('openBleRes', openBleRes)

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        const deviceList = res.devices.filter((item) => {
          let flag = false
          // localName为homlux_ble、homlux且没有被发现过的
          if (item.localName && ['homlux_ble', 'homlux'].includes(item.localName)) {
            flag = true
          }

          return flag
        })
        for (const item of deviceList) {
          const msgObj = bleUtil.transferBroadcastData(item.advertisData)
          const targetMac = this.data.pageParams.mac // 云端的是zigbee模块的mac

          // 防止不同时间段回调的onBluetoothDeviceFound导致的重复执行
          if (this.data._hasFound) {
            console.error('已执行过发现目标蓝牙设备，中断流程')
            break
          }

          if (targetMac !== msgObj.zigbeeMac) {
            continue
          }

          this.data._hasFound = true
          Logger.log('Device Found', item, msgObj)

          wx.stopBluetoothDevicesDiscovery()
          this.handleBleDeviceInfo({
            ...item,
            ...msgObj,
          })

          break
        }
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        powerLevel: 'high',
        interval: 3000,
        success: (res) => {
          console.log('startBluetoothDevicesDiscovery-添加单个子设备', res)
        },
      })
    },

    /**
     * 检查是否目标设备
     */
    async handleBleDeviceInfo(device: WechatMiniprogram.BlueToothDevice & IAdData) {
      const productInfoRes = await batchGetProductInfoByBPid({
        mzgdBluetoothVoList: [{ proType: device.proType, bluetoothPid: device.bluetoothPid }],
      })

      if (!productInfoRes.success && productInfoRes.result.length) {
        this.setData({
          status: 'error',
        })
        return
      }

      const { proType, modelId, productName, productIcon } = productInfoRes.result[0]

      wx.reportEvent('add_device', {
        pro_type: proType,
        model_id: modelId,
        add_type: 'qrcode',
      })

      this.setData({
        'pageParams.deviceName': productName,
        'pageParams.deviceIcon': productIcon,
        'pageParams.modelId': modelId,
        'pageParams.proType': proType,
      })

      const bleDevice: IBleDevice = {
        deviceUuid: device.deviceId,
        mac: device.mac,
        zigbeeMac: this.data.pageParams.mac,
        icon: this.data.pageParams.deviceIcon,
        name: this.data.pageParams.deviceName,
        client: new BleClient({
          mac: device.mac,
          deviceUuid: device.deviceId,
          modelId: this.data.pageParams.modelId,
          proType: this.data.pageParams.proType,
          protocolVersion: device.protocolVersion,
        }),
        spaceId: '',
        spaceName: '',
        status: 'waiting',
        requestTimes: 20,
        zigbeeRepeatTimes: 3,
      }

      this.confirmAdd(bleDevice)

      return true
    },

    // 确认添加设备
    async confirmAdd(bleDevice: IBleDevice) {
      this.setData({
        activeIndex: 1,
      })
      this.startZigbeeNet(bleDevice)

      const res = await sendCmdAddSubdevice({
        deviceId: this.data.pageParams.gatewayId,
        expire: 60,
        buzz: 1,
      })

      if (!res.success) {
        Logger.error('网关下发指令失败', res)
        this.setData({
          status: 'error',
        })

        return
      }
    },

    async stopGwAddMode() {
      if (!this.data._hasFound) {
        return false
      }

      const pageParams = getCurrentPageParams()

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: 0,
        buzz: 0,
      })

      // 子设备配网阶段，保持网关在配网状态
      if (res.success) {
        console.log('结束网关配网状态')
      }

      return res
    },

    /**
     * 手动查询子设备是否入网
     * @param bleDevice
     */
    async queryZigbeeBindStatus() {
      const zigbeeMac = this.data.pageParams.mac
      const isOnline = await isDeviceOnline({ devIds: [zigbeeMac] })

      Logger.log(`【${zigbeeMac}】查询入网状态：${isOnline}`)

      if (isOnline) {
        clearTimeout(this.data._timeId)
        this.bindBleDeviceToCloud()
      }

      return isOnline
    },

    async startZigbeeNet(bleDevice: IBleDevice) {
      bleDevice.zigbeeRepeatTimes--
      const { channel, extPanId, panId } = this.data.pageParams

      const res = await bleDevice.client.startZigbeeNet({
        channel: parseInt(channel),
        extPanId: extPanId,
        panId: parseInt(panId),
      })

      // 配网指令允许重发3次
      if (!res.success && bleDevice.zigbeeRepeatTimes > 0) {
        this.startZigbeeNet(bleDevice)
        return
      }

      if (res.success) {
        bleDevice.zigbeeMac = res.result.zigbeeMac
        this.data._startTime = dayjs().valueOf()

        // 兼容新固件逻辑，子设备重复配网同一个网关，网关不会上报子设备入网，必须app手动查询设备入网状态
        if (res.code === '02') {
          this.queryZigbeeBindStatus()
        }
      } else {
        this.setData({
          status: 'error',
        })
      }

      bleDevice.client.close()
    },

    async bindBleDeviceToCloud() {
      this.setData({
        activeIndex: 2,
      })

      const { mac, proType, modelId } = this.data.pageParams
      let { deviceName } = this.data.pageParams

      const existDevice = deviceBinding.store.allDeviceList.find((item) => item.deviceId === mac)

      // 重新绑定同一项目情况下，取旧命名
      if (existDevice) {
        deviceName = existDevice.deviceName
      } else {
        let bindNum = deviceBinding.store.allDeviceList.filter(
          (item) => item.proType === proType && item.productId === modelId,
        ).length // 已绑定的相同设备数量

        deviceName = deviceName + (bindNum > 0 ? ++bindNum : '')
      }

      const res = await bindDevice({
        deviceId: mac,
        projectId: projectBinding.store.currentProjectId,
        spaceId: spaceBinding.store.currentSpace.spaceId,
        sn: '',
        deviceName: deviceName,
      })

      if (res.success && res.result.isBind) {
        this.setData({
          activeIndex: 3,
        })

        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/pages/bind-home/index', {
            deviceId: res.result.deviceId,
          }),
        })

        wx.reportEvent('zigebee_add', {
          pro_type: this.data.pageParams.proType,
          cost_time: dayjs().valueOf() - this.data._startTime,
          model_id: this.data.pageParams.modelId,
        })
      } else {
        this.setData({
          status: 'error',
        })
      }
    },

    finish() {
      wx.navigateBack({
        delta: 3,
      })
    },
  },
})
