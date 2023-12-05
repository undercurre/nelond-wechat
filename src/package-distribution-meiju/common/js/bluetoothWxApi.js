export const wxOpenBluetoothAdapter = () => {
  return new Promise((resolve, reject) => {
    wx.openBluetoothAdapter({
      success() {
        resolve()
      },
      fail() {
        reject()
      },
    })
  })
}
export const wxStartBluetoothDevicesDiscovery = () => {
  return new Promise((resolve, reject) => {
    wx.startBluetoothDevicesDiscovery({
      services: ['FEE7'],
      success(res) {
        console.log(res)
        resolve(res)
      },
      fail() {
        reject()
      },
    })
  })
}
export const wxStopBluetoothDevicesDiscovery = () => {
  return new Promise((resolve, reject) => {
    wx.stopBluetoothDevicesDiscovery({
      success(res) {
        console.log(res)
        resolve(res)
      },
      fail() {
        reject()
      },
    })
  })
}
