import pageBehavior from '../../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BleClient, bleUtil, Logger } from '../../../utils/index'

type IDeviceinfo = Record<string, string>
ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    isDiscovering: false,
    _bleDevice: {} as IDeviceinfo,
    bleClient: null as null | BleClient,
    deviceList: [] as IDeviceinfo[],
    cmdType: 'DEVICE_CONTROL' as 'DEVICE_INFO_QUREY' | 'DEVICE_CONTROL',
    cmd: '05',
    result: '',
    cmdTypeList: [
      {
        text: '查询',
        value: 'DEVICE_INFO_QUREY',
      },
      {
        text: '控制',
        value: 'DEVICE_CONTROL',
      },
    ],
  },

  computed: {},

  lifetimes: {
    ready() {
      this.initBle()
    },
    detached() {
      wx.closeBluetoothAdapter({
        success(res) {
          console.log('closeBluetoothAdapter', res)
        },
      })
    },
  },
  /**
   * 组件的方法列表
   */
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
          return (
            item.localName &&
            item.localName.includes('homlux_ble') &&
            this.data.deviceList.findIndex((bleItem) => item.deviceId === bleItem.deviceId) < 0
          )
        })

        if (deviceList.length) {
          deviceList.forEach((item) => {
            this.handleBleDeviceInfo(item)
          })

          this.setData({
            deviceList: this.data.deviceList,
          })
        }
      })
    },

    async handleBleDeviceInfo(device: WechatMiniprogram.BlueToothDevice) {
      const msgObj = bleUtil.transferBroadcastData(device.advertisData)

      if (msgObj.protocolVersion !== '03') {
        return
      }

      const bleDevice = {
        deviceId: device.deviceId,
        mac: msgObj.mac,
        zigbeeMac: msgObj.zigbeeMac,
      }

      this.data.deviceList.push(bleDevice)

      if (this.data._bleDevice.deviceId) {
        this.data._bleDevice = bleDevice
      }
    },
    toggleDiscoverBle() {
      this.data.isDiscovering ? this.stopScanBle() : this.startScanBle()
    },
    startScanBle() {
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        powerLevel: 'high',
        interval: 5000,
        success: (res) => {
          console.log('startBluetoothDevicesDiscovery', res)
          this.setData({
            isDiscovering: true,
          })
        },
      })
    },
    stopScanBle() {
      wx.stopBluetoothDevicesDiscovery({
        success: () => {
          this.setData({
            isDiscovering: false,
          })
        },
      })
    },
    changeBle(e: { detail: { value: IDeviceinfo } }) {
      Logger.log('changeBle', e)

      this.data._bleDevice = e.detail.value
    },

    changeCmdType(value: { detail: 'DEVICE_INFO_QUREY' | 'DEVICE_CONTROL' }) {
      Logger.log('changeCmdType', value)
      this.setData({
        cmdType: value.detail,
      })
    },

    async toggleConnect() {
      const { mac, deviceId } = this.data._bleDevice

      if (!this.data.bleClient) {
        const bleClient = new BleClient({
          mac: mac,
          deviceUuid: deviceId,
          modelId: '',
          proType: '',
          protocolVersion: '',
        })

        await bleClient.connect()
        this.setData({
          bleClient: bleClient,
        })
      } else {
        this.data.bleClient.close()

        this.setData({
          bleClient: null,
        })
      }
    },

    async sendCmd() {
      const regex = /.{1,2}/g
      let cmdData: number[] = []

      if (this.data.cmd) {
        cmdData = this.data.cmd.match(regex)?.map((item) => parseInt(item, 16)) as number[]
      }

      Logger.log('cmdData', cmdData)

      const res = await this.data.bleClient?.sendCmd({ cmdType: this.data.cmdType, data: cmdData })

      Logger.log('sendCmd', res)

      this.setData({
        result: JSON.stringify(res) + `收到回复： ${res?.resMsg}`,
      })
    },
  },
})
