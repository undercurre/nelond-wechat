/**
 * 蓝牙相关服务接口
 */
import app from '../../../../common/app'
const bluetoothService = {
  openAdapter() {
    if (app.globalData.bluetoothFail) {
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
  },
}
module.exports = {
  bluetoothService,
}
