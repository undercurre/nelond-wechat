import pageBehavior from '../../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import {
  BleClient,
  bleUtil,
  Logger,
  ZIGBEE_ROLE,
  CmdTypeMap,
  REPORT_TYPE,
  bleDeviceMap,
  storage,
  strUtil,
} from '../../../utils/index'

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
  bleClient: BleClient
}

// zigbee网络节点数据
interface INetItem {
  mac: string
  nodeId: string
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
        name: '反转开关状态',
      },
      {
        name: '查询开关状态',
      },
    ],
    isConnected: false,
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
      channel: '0x00',
      panId: '0x00',
      deviceList: [] as INetItem[],
      entry: '',
    },
  },

  computed: {
    selectDevice(data) {
      return data.deviceList.find((item) => item.deviceId === data.selectDeiceId) as IDeviceInfo
    },
  },

  lifetimes: {
    ready() {
      bleUtil.initBle()
      this.initBle()

      const netInfo = storage.get('netInfo')

      Logger.log('netInfo', netInfo)
      if (netInfo) {
        this.setData({
          netInfo: JSON.parse(
            typeof netInfo === 'string'
              ? netInfo
              : '{\n' +
                  "      channel: '0x00',\n" +
                  "      panId: '0x00',\n" +
                  '      deviceList: [],\n' +
                  "      entry: '',\n" +
                  '    }',
          ),
        })
      }
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
    reset() {
      storage.remove('netInfo')

      this.setData({
        netInfo: {
          channel: '0x00',
          panId: '0x00',
          deviceList: [] as INetItem[],
          entry: '',
        },
      })

      wx.closeBluetoothAdapter({
        success: (res) => {
          console.log('closeBluetoothAdapter', res)
          this.initBle()
        },
      })
    },
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

      const deviceId = device.deviceId

      const bleDevice = {
        ...msgObj,
        label: `${mac}${isConfig === '02' ? '-已配网' : ''}`,
        deviceId,
        bleClient: new BleClient({
          mac,
          deviceUuid: deviceId,
          modelId: '',
          proType: '',
          protocolVersion,
          onMessage: (message) => {
            Logger.debug(`【${mac}】BleClient-onMessage`, message)

            // 上报ZigBee配网结果
            if (REPORT_TYPE.REPORT_CONFIG_ZIGBEE_NET_RESULT === message.type) {
              const hexStr = message.data

              const result = hexStr.slice(2, 4)

              // 配网失败
              if (result !== '00') {
                Logger.error(`【${mac}】配网失败`)
                return
              }

              const info = {
                channel: hexStr.slice(4, 6), // 上报所在信道
                panId: strUtil.reverseHexStr(hexStr.slice(6, 10)), // 所在网络
                nodeId: strUtil.reverseHexStr(hexStr.slice(10, 14)), // 短地址
              }

              const zigbeeDeviceList = this.data.netInfo.deviceList

              if (this.data.netInfo.deviceList.findIndex((item) => item.mac === mac) < 0) {
                zigbeeDeviceList.push({
                  mac,
                  nodeId: info.nodeId,
                })
              }

              const targetDevice = this.data.deviceList.find((item) => item.deviceId === deviceId) as IDeviceInfo

              this.setData({
                'netInfo.channel': `0x${info.channel}`,
                'netInfo.panId': `0x${info.panId}`,
                'netInfo.deviceList': zigbeeDeviceList,
              })

              if (!this.data.netInfo.entry) {
                this.setData({
                  'netInfo.entry': targetDevice.mac,
                })
              }

              Logger.debug('netInfo.deviceList', this.data.netInfo.deviceList)

              this.changeNetInfo()
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
    clickGrid(event: WechatMiniprogram.CustomEvent) {
      Logger.log('clickGrid', event)

      const mac = event.target.dataset.mac

      this.setData({
        'netInfo.entry': mac,
      })
    },
    changeBle(e: { detail: { value: { deviceId: string } } }) {
      Logger.log('changeBle', e)

      const { deviceId } = e.detail.value

      this.setData({
        isConnected: bleDeviceMap[deviceId] === true,
        selectDeiceId: deviceId,
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

      if (!this.data.isConnected) {
        await selectDevice.bleClient.connect()

        wx.showToast({
          title: '连接成功',
        })
      } else {
        await selectDevice.bleClient.close()
      }

      this.setData({
        isConnected: bleDeviceMap[selectDevice.deviceId] === true,
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

      const channel = parseInt(this.data.netInfo.channel, 16)
      const panId = parseInt(this.data.netInfo.panId, 16)
      const entryDevice = this.data.deviceList.find((item) => item.mac === this.data.netInfo.entry) as IDeviceInfo

      let res

      switch (event.detail.name) {
        case '试一试':
          res = await selectDevice.bleClient.flash()

          break

        case '作为router进入配网':
          // 开启当前zigbee网络节点入网权限
          if (entryDevice) {
            await entryDevice.bleClient.startZigbeeNet({
              channel,
              panId,
              role: ZIGBEE_ROLE.entry,
            })
          }

          res = await selectDevice.bleClient.startZigbeeNet({
            channel,
            panId,
            role: ZIGBEE_ROLE.router,
          })

          break

        case '作为coord进入配网':
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

    changeNetInfo() {
      storage.set('netInfo', JSON.stringify(this.data.netInfo))
    },
  },
})
