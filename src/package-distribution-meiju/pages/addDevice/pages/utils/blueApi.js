const openAdapter = () => {
  if (getApp().globalData.bluetoothFail) {
    return
  }
  return new Promise((resolve, rejcet) => {
    wx.openBluetoothAdapter({
      success(res) {
        resolve(res)
      },
      fail(error) {
        rejcet(error)
        console.log('打开适配器失败', error)
      },
    })
  })
}

const startBluetoothDevicesDiscovery = () => {
  new Promise((resolve, reject) => {
    wx.startBluetoothDevicesDiscovery({
      // services: ["FF90", "FF80"],
      // powerLevel: "high",
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        resolve(res)
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}

const stopBluetoothDevicesDiscovery = () => {
  wx.stopBluetoothDevicesDiscovery()
}

const onBluetoothDeviceFound = () => {
  new Promise((resolve, reject) => {
    wx.onBluetoothDeviceFound((res) => {
      resolve(res)
    })
  })
}

const createBLEConnection = (deviceId) => {
  new Promise((resolve, reject) => {
    console.log('deviceId=====', deviceId)
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        console.log('蓝牙连接成功')
        resolve(res)
      },
      fail: (error) => {
        reject(error)
        console.log('链接失败', JSON.stringify(error))
      },
    })
  })
}

const setBLEMTU = (deviceId, mtu) => {
  new Promise((resolve, reject) => {
    wx.setBLEMTU({
      deviceId,
      mtu: mtu,
      success: (res) => {
        resolve(res)
      },
      fail: (error) => {
        reject(error)
        console.log('设置MTU失败==============', error)
      },
    })
  })
}

const onBLEConnectionStateChange = () => {
  new Promise((resolve, reject) => {
    wx.onBLEConnectionStateChange((res) => {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed,蓝牙连接状态: ${res.connected}`)
      resolve(res)
    })
  })
}

const getBLEDeviceServices = (deviceId, serviceType) => {
  wx.getBLEDeviceServices({
    deviceId,
    success: (res) => {
      console.log('连接后获取到的蓝牙服务', res)
      for (let i = 0; i < res.services.length; i++) {
        if (res.services[i].isPrimary && res.services[i].uuid.includes(serviceType)) {
          //isPrimary是否为主服务
          getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
          return
        }
      }
    },
  })
}

const getBLEDeviceCharacteristics = (deviceId, serviceId) => {
  new Promise((resolve, rejcet) => {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
            })
          }
          if (item.properties.write) {
            let obj = {}
            obj.deviceId = deviceId
            obj.serviceId = serviceId
            obj.characteristicId = item.uuid
            resolve(obj)
          }
          if (item.properties.notify || item.properties.indicate) {
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success(res) {
                console.log('notifyBLECharacteristicValueChange success', res)
              },
            })
          }
        }
      },
      fail(error) {
        reject(error)
        console.error('getBLEDeviceCharacteristics', error)
      },
    })
  })
}

function onBLECharacteristicValueChange() {
  new Promise((resolve, rejcet) => {
    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((characteristic) => {
      resolve(characteristic)
    })
  })
}

module.exports = {
  openAdapter: openAdapter,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  onBluetoothDeviceFound,
  createBLEConnection,
  setBLEMTU,
  onBLEConnectionStateChange,
  getBLEDeviceServices,
  onBLECharacteristicValueChange,
}
