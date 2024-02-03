import pageBehavior from '../../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BleClient, bleUtil, Logger, ZIGBEE_ROLE, CmdTypeMap, REPORT_TYPE } from '../../../utils/index'

type IDeviceInfo = {
  brand: string
  isConfig: string
  mac: string
  zigbeeMac: string
  proType: string
  bluetoothPid: string
  version: string
  protocolVersion: string
  label: string
  deviceId: string
  isConnected: boolean
  bleClient: BleClient
}

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
    isShowActionSheet: false,
    activeNames: ['noGateway'] as string[],
    actions: [
      {
        name: '试一试',
      },
      {
        name: '作为router进入配网',
      },
      {
        name: '作为coord进入配网',
      },
      {
        name: '作为已入网设备开启入网权限',
      },
      {
        name: '反转开关状态',
      },
      {
        name: '查询开关状态',
      },
    ],
    isDiscovering: false,
    selectDeiceId: '',
    deviceList: [] as IDeviceInfo[],
    cmdType: 0x00,
    cmd: '05',
    cmdTypeList: [
      {
        text: '查询',
        value: CmdTypeMap.DEVICE_INFO_QUREY,
      },
      {
        text: '控制',
        value: CmdTypeMap.DEVICE_CONTROL,
      },
    ],
    netInfo: {
      channel: 0,
      panId: 0,
      deviceList: [] as IDeviceInfo[],
      coord: '',
    },
  },

  computed: {
    selectDevice(data) {
      return data.deviceList.find((item) => item.deviceId === data.selectDeiceId) as IDeviceInfo
    },
  },

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
    onChangeCollapse(event: { detail: string[] }) {
      Logger.debug(event)
      this.setData({
        activeNames: event.detail,
      })
    },
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

      const { protocolVersion, mac, isConfig } = msgObj
      if (protocolVersion !== '03') {
        return
      }

      const bleDevice = {
        ...msgObj,
        label: `${mac}${isConfig === '02' ? '-已配网' : ''}`,
        deviceId: device.deviceId,
        isConnected: false,
        bleClient: new BleClient({
          mac,
          deviceUuid: device.deviceId,
          modelId: '',
          proType: '',
          protocolVersion,
          onMessage: (message) => {
            Logger.debug('BleClient-onMessage', message)

            // 上报ZigBee配网结果
            if (REPORT_TYPE.REPORT_CONFIG_ZIGBEE_NET_RESULT === message.type) {
              const hexStr = message.data

              const result = hexStr.slice(2, 4)

              // 配网失败
              if (result !== '00') {
                return
              }

              const info = {
                channel: hexStr.slice(4, 6), // 上报所在信道
                panId: hexStr.slice(6, 10), // 所在网络
                nodeId: hexStr.slice(10, 14), // 短地址
              }

              Logger.debug('info', info)

              const device = this.data.deviceList.find((item) => item.deviceId === mac)

              this.setData({
                'netInfo.channel': parseInt(info.channel, 16),
                'netInfo.panId': parseInt(info.panId, 16),
                'netInfo.deviceList': this.data.netInfo.deviceList.concat([device as IDeviceInfo]),
              })
            }
          },
        }),
      }

      this.data.deviceList.push(bleDevice)

      if (!this.data.selectDeiceId) {
        this.setData({
          selectDeiceId: bleDevice.deviceId,
        })
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
    changeBle(e: { detail: { value: IDeviceInfo } }) {
      Logger.debug('changeBle', e)

      this.setData({
        selectDeiceId: e.detail.value.deviceId,
      })
    },

    changeCmdType(value: { detail: number }) {
      Logger.debug('changeCmdType', value)
      this.setData({
        cmdType: value.detail,
      })
    },

    async toggleConnect() {
      this.stopScanBle()
      const selectDevice = this.data.selectDevice

      if (!selectDevice.isConnected) {
        await selectDevice.bleClient.connect()

        selectDevice.isConnected = true

        wx.showToast({
          title: '连接成功',
        })
      } else {
        await selectDevice.bleClient.close()

        selectDevice.isConnected = false
      }

      this.setData({
        deviceList: this.data.deviceList.concat([]),
      })
    },

    async sendCmd() {
      const selectDevice = this.data.selectDevice

      const regex = /.{1,2}/g
      let cmdData: number[] = []

      if (this.data.cmd) {
        cmdData = this.data.cmd.match(regex)?.map((item) => parseInt(item, 16)) as number[]
      }

      Logger.debug('cmdData', cmdData)

      const res = await selectDevice.bleClient.sendCmd({ cmdType: this.data.cmdType, data: cmdData })

      Logger.debug('sendCmd', res)
      wx.showToast({
        title: res?.success ? '发送成功' : '发送失败',
        icon: res?.success ? 'success' : 'error',
      })
    },

    toggleShowAction() {
      this.setData({
        isShowActionSheet: !this.data.isShowActionSheet,
      })
    },

    async handelControl(event: WechatMiniprogram.CustomEvent) {
      console.log('handelControl', event.detail)
      const selectDevice = this.data.selectDevice

      const channel = this.data.netInfo.channel
      const panId = this.data.netInfo.panId
      let res

      switch (event.detail.name) {
        case '试一试':
          res = await selectDevice.bleClient.flash()

          break

        case '作为router进入配网':
          res = await selectDevice.bleClient.startZigbeeNet({
            channel,
            panId,
            role: ZIGBEE_ROLE.router,
          })

          break

        case '作为coord进入配网':
          this.setData({
            'netInfo.coord': selectDevice.deviceId,
          })
          res = await selectDevice.bleClient.startZigbeeNet({
            channel,
            panId,
            role: ZIGBEE_ROLE.coord,
          })

          break

        case '作为已入网设备开启入网权限':
          res = await selectDevice.bleClient.startZigbeeNet({
            channel,
            panId,
            role: ZIGBEE_ROLE.entry,
          })

          break

        case '反转开关状态':
          res = await selectDevice.bleClient.ctlOnOff({})

          break

        case '查询开关状态':
          res = await selectDevice.bleClient.queryOnOffStatus({})

          break
      }

      wx.showToast({
        title: res?.success ? '发送成功' : '发送失败',
        icon: res?.success ? 'success' : 'error',
      })

      this.setData({
        isShowActionSheet: false,
      })
    },
  },
})
