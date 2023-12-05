const app = {
  addDeviceInfo: {
    roomId: '',
    plainSn: '', //设备原始sn
    msmartBleWrite: null, //蓝牙写入
    combinedDeviceFlag: false, // 存在辅设备标识
    type: '', // 品类码
    sn8: '', // sn8
    linkType: '',
    mode: 0,
    productId: '',
    deviceImg: '', // 设备图片
    isFromScanCode: false,
    enterprise: '0000',
    fm: 'selectType',
    guideInfo: [
      {
        bluetoothName: null,
        code: '79700Z76',
        connectDesc: '① 将智能窗帘插上电源\n② 快速点按「SET-2」键4次，再长按「SET-2」键1次，直至指示灯闪烁',
        connectUrlA: 'http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/7/7/15/NZxmnjoefmcMealUPBmt.gif',
        connectUrlB: '',
        connectUrlC: '',
        controlVersion: null,
        customerModel: 'SC-1/M2-Z',
        isAutoConnect: 0,
        isBluetoothControl: 0,
        leadingWords: '已完成上述操作',
        marketModel: 'SC-1/M2-Z',
        mode: 0,
        note: null,
        productCode: '21079710000001',
        productId: 'SC-1/M2-Z',
        productImg: 'http://midea-file.oss-cn-hangzhou.aliyuncs.com/2021/6/21/13/pJeBIFcVqOdjdODAiSRK.png',
        productName: '智能电动窗帘',
        wifiFrequencyBand: 1,
        wifiName: null,
      },
    ],
  },
  globalData: {
    privateKey: 'xhdiwjnchekd4d512chdjx5d8e4c394D2D7S',
    isLogon: true,
    userData: {
      key: '',
    },
    isPx: false,
    isCanClearFound: true,
    systemInfo: {},
  },
}

wx.getSystemInfo({
  success: (res) => {
    app.globalData.systemInfo = res
    app.globalData.isPx = res && res.safeArea.top > 20
    console.log('getWxSystemInfo, success, forceUpdate', res)
  },
  fail: (e) => {
    console.log('getWxSystemInfo, fail', e)
  },
})

export function getApp() {
  return app
}

export default app
