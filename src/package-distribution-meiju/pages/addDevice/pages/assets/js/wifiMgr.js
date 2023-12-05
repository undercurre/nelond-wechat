var platform
var wifiList = []
var callBackFunc

export default class WifiMgr {
  constructor() {}

  // 仅 Android 6 与 iOS 11 以上版本支持
  checkPlatform() {
    return new Promise((resolve, reject) => {
      // 检测手机型号
      wx.getSystemInfo({
        success: function (res) {
          var system = ''
          if (res.platform == 'android') system = parseInt(res.system.substr(8))
          if (res.platform == 'ios') system = parseInt(res.system.substr(4))
          if (res.platform == 'android' && system < 6) {
            reject()
          }
          if (res.platform == 'ios' && system < 11) {
            reject()
          }

          platform = res.platform
          resolve(res.platform)
        },
        fail: function (res) {
          wx.showToast({
            title: '请求失败',
            icon: 'none',
            duration: 3000,
          })
        },
      })
    })
  }

  // 1. 可直接使用该方法去连接 Wi-Fi
  startConnectWifi(account, password) {
    return new Promise((resolve, reject) => {
      wx.startWifi({
        success(res) {
          // eslint-disable-next-line no-undef
          connectWifi(account, password)
            .then(() => {
              resolve()
            })
            .catch((res) => {
              reject(res)
            })
        },
        fail(res) {
          wx.showToast({
            title: '初始化Wi-Fi失败',
            icon: 'none',
            duration: 3000,
          })
          reject()
        },
      })
    })
  }

  // 2. 可直接使用该方法去搜索 Wi-Fi
  startSearchWifi(func) {
    callBackFunc = func
    this.startWifi()
  }

  // 初始化 WiFi 模块
  startWifi() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let that = this
    wx.startWifi({
      success() {
        that.getWifiListFunc()
      },
      fail() {
        wx.showToast({
          title: '初始化Wi-Fi失败',
          icon: 'none',
          duration: 3000,
        })
      },
    })
  }

  // 请求获取 WiFi 列表
  getWifiListFunc() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let that = this
    if (platform == 'ios') {
      that.getWifiList()
    } else {
      wx.getSetting({
        success(res) {
          //地理位置
          if (!res.authSetting['scope.userLocation']) {
            wx.authorize({
              scope: 'scope.userLocation',
              success(res) {
                that.getWifiList()
              },
              fail(res) {
                wx.showModal({
                  title: '提示',
                  content: '定位失败，您未开启定位权限，点击开启定位权限',
                  success: function (res) {
                    if (res.confirm) {
                      wx.openSetting({
                        success: function (res) {
                          if (res.authSetting['scope.userLocation']) {
                            that.getWifiList()
                          } else {
                            wx.showToast({
                              title: '用户未开启地理位置权限',
                              icon: 'none',
                              duration: 3000,
                            })
                          }
                        },
                      })
                    }
                  },
                })
              },
            })
          } else {
            that.getWifiList()
          }
        },
      })
    }
  }

  getWifiList(callBack, callFial) {
    wx.getWifiList({
      success: function (res) {
        console.log('开始获取wifi列表=====', res.wifiList)
        // 监听获取到 WiFi 列表数据事件
        wx.onGetWifiList((res) => {
          wifiList = []
          let tmpList = []
          console.log('监听到获取到wifi', res.wifiList)
          if (res && res.wifiList) {
            res.wifiList.map((item) => {
              if (tmpList.indexOf(item.SSID) == -1) {
                tmpList.push(item.SSID)
                wifiList.push(item)
              }
            })
            callBack(wifiList)
          }
        })
      },
      fail(error) {
        callFial && callFial(error)
      },
    })
  }

  //根据frequency频率排序的wifi列表
  getWifiSortByFrequency(callBack, callFial) {
    wx.getWifiList({
      success: function () {
        wx.onGetWifiList((res) => {
          if (res && res.wifiList) {
            let need = []
            let ssid = res.wifiList.reduce((prev, cur) => {
              if (!(prev && prev.includes(cur.SSID))) {
                prev.push(cur.SSID)
                let item = res.wifiList.filter((ele) => {
                  return ele.SSID == cur.SSID
                })
                item.sort((a, b) => {
                  return a.frequency - b.frequency
                })
                need.push(item[0])
              }
              return prev
            }, [])
            console.log('根据frequency频率排序的wifi列表', need)
            callBack(need)
          }
        })
      },
      fail(error) {
        callFial && callFial(error)
      },
    })
  }

  // 连接 WiFi。若已知 WiFi 信息，可以直接利用该接口连接。仅 Android 与 iOS 11 以上版本支持
  connectWifi(account, password) {
    return new Promise((resolve, reject) => {
      let wifiCount = 0
      let wifiTimer = setInterval(() => {
        wifiCount++
        if (wifiCount >= 30) {
          clearInterval(wifiTimer)
          reject()
        }
      }, 1000)

      // 获取当前网络的名称
      // eslint-disable-next-line no-undef
      getConnectedWifi()
        .then((res) => {
          if (res.SSID == account) {
            clearInterval(wifiTimer)
            resolve()
          } else {
            // 值得注意的是：ios 无论连网成功还是失败，都会走 success 方法，所以 ios 需要特别判断一下
            wx.connectWifi({
              SSID: account,
              password: password,
              success(res) {
                // ios 判断当前手机已连网账号与要连网的账号是否一致，来确定是否连网成功
                if (platform == 'ios') {
                  // 6.监听连接上 WiFi 的事件
                  wx.onWifiConnected(function (res) {
                    clearInterval(wifiTimer)
                    if (res.wifi.SSID == account) {
                      resolve()
                    } else {
                      reject()
                    }
                  })
                } else {
                  clearInterval(wifiTimer)
                  resolve()
                }
              },
              fail(res) {
                clearInterval(wifiTimer)
                reject(res)
              },
            })
          }
        })
        .catch((res) => {
          clearInterval(wifiTimer)
          reject(res)
        })
    })
  }

  // 获取当前网络的名称
  getConnectedWifi() {
    const system = wx.getSystemInfoSync()
    const isiOS = system.system.includes('iOS')
    return new Promise((resolve, reject) => {
      if (system.system.includes('Android') && !system.locationAuthorized) {
        reject({ errMsg: '安卓未授权微信定位' })
        return
      }
      wx.startWifi({
        success() {
          wx.getConnectedWifi({
            partialInfo: isiOS, //是否只返回部分wifi信息，去掉可能拿不到 SSID
            success: (res) => {
              /**
               * 微信低版本存在缺陷：BSSID每一段如果以0开头会被省略
               * 以下做兼容处理，若被省略则补上0
               */
              if (res.wifi?.BSSID) {
                res.wifi.BSSID = res.wifi.BSSID.split(':') // 以':'为分隔符分割为数组
                  .map((element) => {
                    while (element.length < 2) element = '0' + element
                    return element
                  }) // 每段的长度小于2则在前面补'0'
                  .join(':') // 处理完成后连接成字符串
              }
              if (res.wifi && res.wifi.SSID.includes('unknown ssid')) {
                //ssid返回异常
                reject(res)
              } else {
                resolve(res.wifi)
              }
            },
            fail: (res) => {
              reject(res)
            },
          })
        },
        fail(res) {
          wx.showToast({
            title: '初始化WiFi失败',
            icon: 'none',
            duration: 1000,
          })
          reject(res)
        },
      })
    })
  }
}
