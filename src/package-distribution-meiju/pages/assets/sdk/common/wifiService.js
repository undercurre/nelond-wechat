/**
 * wifi相关的服务
 */
var platform
var wifiList = []

const wifiService = {
  constructor() {},

  /**
   * 判断系统及微信版本号
   * 仅 Android 6 与 iOS 11 以上版本支持
   */
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
  },

  /**
   * 获取周围wifi列表
   * 刷新wifi列表可以调用
   * //调用方式
    wifiService.getWifiList((wifiList) => {
      console.log(wifiList)
    })
   * @param {*} callBack 
   * @param {*} callFial 
   */
  getWifiList(callBack, callFial) {
    wx.startWifi({
      success(res) {
        wx.getWifiList({
          success: function (res) {
            // 监听获取到 WiFi 列表数据事件
            wx.onGetWifiList((res) => {
              wifiList = []
              let tmpList = []
              console.log('监听到获取的wifi', res.wifiList)
              if (res && res.wifiList) {
                res.wifiList.map((item) => {
                  if (tmpList.indexOf(item.SSID) == -1) {
                    //过滤SSID相同的记录
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
      },
      fail(res) {
        wx.showToast({
          title: '初始化WiFi失败',
          icon: 'none',
          duration: 3000,
        })
      },
    })
  },

  /**
   * 知道wifi信息的情况下，可以直接调用该接口连接wifi(对外接口)
   * @param {*} account
   * @param {*} password
   */
  startConnectWifi(account, password) {
    return new Promise((resolve, reject) => {
      wx.startWifi({
        success(res) {
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
            title: '初始化WiFi失败',
            icon: 'none',
            duration: 3000,
          })
          reject()
        },
      })
    })
  },

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
  },

  /**
   * 连接 WiFi。若已知 WiFi 信息，可以直接利用该接口连接。仅 Android 与 iOS 11 以上版本支持
   * @param {*} account
   * @param {*} password
   */
  connectWifi(account, password) {
    return new Promise((resolve, reject) => {
      //todo: 旧逻辑，30秒后连接还没有成功，reject
      // let wifiCount = 0
      // let wifiTimer = setInterval(() => {
      //   wifiCount++
      //   if (wifiCount >= 30) {
      //     clearInterval(wifiTimer)
      //     reject()
      //   }
      // }, 1000)

      //调用当前连接的wifi，如果当前连接的wifi跟待连接的wifi是同一个wifi，则不需要重新连接
      getConnectedWifi()
        .then((res) => {
          //当前方法中已经有包括startWifi方法，所以不需要额外套多一层
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
  },

  /**
   * 获取当前网络的名称(对外接口)
   */
  getConnectedWifi() {
    const system = wx.getSystemInfoSync()
    const isiOS = system.system.includes('iOS')
    return new Promise((resolve, reject) => {
      if (system.system.includes('Android') && !system.locationAuthorized) {
        reject({
          errMsg: '安卓未授权微信定位',
        })
        return
      }
      wx.startWifi({
        success(res) {
          wx.getConnectedWifi({
            partialInfo: isiOS, //是否只返回部分wifi信息
            success: (res) => {
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
  },

  /**
   * 获取当前手机网络状态(对外接口)
   */
  getNetworkType() {
    return new Promise((resolve, reject) => {
      wx.getNetworkType({
        success(res) {
          console.log('当前网络状况', res)
          resolve(res.networkType)
        },
        fail(error) {
          console.log('获取当前网络状况错误', error)
          reject(error)
        },
      })
    })
  },
}

module.exports = {
  wifiService,
}
