/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import app from '../../../common/app'
import { ab2hex } from 'm-utilsdk/index'
import { getDeviceCategoryAndSn8, getScanRespPackInfo } from '../../../utils/blueAdDataParse'
import { openAdapter } from '../pages/utils/blueApi'
import { brandConfig } from '../../assets/js/brand'

const bluetooth = require('../../../common/mixins/bluetooth.js')

// eslint-disable-next-line no-undef
module.exports = Behavior({
  behaviors: [bluetooth],
  methods: {
    /**
     * 获取确权距离阈值
     * @param {String} type 设备品类
     * @param {String} sn8 设备sn8
     */
    getNetworkThreshold() {
      return {
        distanceThreshold: '1.2',
        downlinkThreshold: -60,
        signalReference: '',
      }
    },
    /**
     * 搜索蓝牙信号匹配设备
     * @param {string} type 品类
     * @param {string} sn8
     * @param {string} ssid
     */
    searchBlueByType(type, sn8, ssid) {
      return new Promise((resolve) => {
        console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 需匹配的参数\n', type, sn8, ssid)
        const self = this
        openAdapter()
          .then(() => {
            wx.startBluetoothDevicesDiscovery({
              allowDuplicatesKey: true,
              interval: 0,
              powerLevel: 'high',
              success: (res) => {
                console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 开始搜寻蓝牙成功\n', res)
              },
              fail(error) {
                console.error('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 开始搜寻蓝牙失败\n', error)
              },
            })
            let typeMatchList = [] // 搜索到品类匹配的设备列表
            // 2s后停止搜索，处理搜索结果
            this.searchBlueStopTimeout = setTimeout(() => {
              wx.offBluetoothDeviceFound()
              wx.stopBluetoothDevicesDiscovery({
                fail(error) {
                  console.error('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 停止蓝牙搜索失败\n', error)
                },
              })
              console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 最终合并结果\n', typeMatchList)
              // 过滤蓝牙强度
              typeMatchList = typeMatchList.filter((el) => el.RSSI >= -80)
              console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 蓝牙强度过滤\n', typeMatchList)
              if (typeMatchList.length === 0) {
                console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 匹配失败')
                return
              }
              if (sn8) {
                console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 开始匹配sn8\n', sn8)
                const sn8MatchList = typeMatchList.filter((el) => el.sn8 === sn8)
                if (sn8MatchList.length > 0) {
                  // 信号强度由强至弱排序
                  sn8MatchList.sort((a, b) => b.RSSI - a.RSSI)
                  console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc sn8匹配结果\n', sn8MatchList)
                  resolve(sn8MatchList[0])
                  return
                } else {
                  console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc sn8匹配失败')
                }
              }
              // 信号强度由强至弱排序
              typeMatchList.sort((a, b) => b.RSSI - a.RSSI)
              console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 品类匹配结果\n', typeMatchList)
              resolve(typeMatchList[0])
            }, 2000)
            // 监听搜索到新设备的事件
            wx.onBluetoothDeviceFound((res) => {
              let typeMatchListTemp = []
              res.devices.forEach((device) => {
                // 品牌名校验
                const localName = device.localName || device.name || ''
                if (!brandConfig.apNameHeader.some((value) => localName.includes(value))) {
                  return
                }
                // RSSI为正值的异常情况均舍弃
                if (device.RSSI > 0) {
                  console.log('设备蓝牙强度异常', device)
                  return
                }
                // 校验设备品牌a806
                if (!self.filterMideaDevice(device)) {
                  return
                }
                // 校验设备品类
                const typeAndSn8 = getDeviceCategoryAndSn8(device)
                if (typeAndSn8?.type !== type) {
                  return
                }
                const adData = ab2hex(device.advertisData) // ArrayBuffer转16进度字符串
                device.adData = adData
                if (app.addDeviceInfo.deviceId === device.deviceId && !app.addDeviceInfo.adData) {
                  app.addDeviceInfo.adData = device.adData
                }
                // 校验二代蓝牙广播包长度对不对
                if (!this.checkAdsData(device)) {
                  console.log('二代蓝牙广播包长度异常', adData)
                  return
                }
                // 解析蓝牙功能状态
                const packInfo = getScanRespPackInfo(adData)
                // 将判断是否组合设备标志位放到全局变量中
                app.addDeviceInfo.isFeature = packInfo.isFeature
                // 过滤已配网设备
                if (packInfo.isConfig || packInfo.isLinkWifi || packInfo.isBindble) {
                  return
                }
                // 设备符合条件
                device.type = typeAndSn8.type
                device.sn8 = typeAndSn8.sn8
                device.adData = adData
                typeMatchListTemp.push(device)
              })
              if (typeMatchListTemp.length > 0) {
                console.log(
                  '@module checkAuthMixin.js\n@method searchBlueByType\n@desc 本次搜索结果\n',
                  typeMatchListTemp,
                )
                typeMatchList = self.updateDeviceList(typeMatchList, typeMatchListTemp)
              }
              // 优先匹配ssid
              if (ssid) {
                console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 开始匹配ssid\n', ssid)
                const ssidMatch = typeMatchList.find((el) => {
                  const blueVersion = self.getBluetoothType(el.adData)
                  if (self.getBluetoothSSID(el.adData, blueVersion, el.type, el.localName) == ssid) return true
                })
                if (ssidMatch) {
                  console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc ssid匹配结果\n', ssidMatch)
                  this.searchBlueStopTimeout && clearTimeout(this.searchBlueStopTimeout)
                  wx.offBluetoothDeviceFound()
                  wx.stopBluetoothDevicesDiscovery({
                    fail(error) {
                      console.error(
                        '@module checkAuthMixin.js\n@method searchBlueByType\n@desc 停止蓝牙搜索失败\n',
                        error,
                      )
                    },
                  })
                  resolve(ssidMatch)
                } else {
                  console.log('@module checkAuthMixin.js\n@method searchBlueByType\n@desc ssid匹配失败')
                }
              }
            })
          })
          .catch((error) => {
            console.error('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 打开蓝牙适配器失败\n', error)
          })
      })
    },
    /**
     * 更新设备列表
     * @param {Array} oldList 旧列表
     * @param {Array} newList 新列表
     */
    updateDeviceList(oldList, newList) {
      newList.forEach((newEl) => {
        const index = oldList.findIndex((oldEl) => oldEl.deviceId == newEl.deviceId)
        if (index == -1) {
          // 旧列表不存在该设备，添加设备
          oldList.push(newEl)
        } else {
          // 旧列表存在该设备，取更大的信号强度
          if (newEl.RSSI > oldList[index].RSSI) {
            oldList[index].RSSI = newEl.RSSI
          }
        }
      })
      return oldList
    },
    /**
     * 计算和设备的距离
     * @param {String} deviceId 设备蓝牙ID
     * @param {Number} referenceRSSI 标准信号强度
     * @param {Number} downlinkThreshold 信号下行阈值
     * @param {Number} checkDistance 确权阈值
     * @param {Boolean} ifResolveOnCheck 确权成功是否resolve
     */
    checkNearby(deviceId, referenceRSSI, downlinkThreshold, checkDistance, ifResolveOnCheck) {
      console.log('@module checkAuthMixin.js\n@method checkNearby\n@desc 开始计算距离\n', {
        deviceId,
        referenceRSSI,
        downlinkThreshold,
        checkDistance,
        ifResolveOnCheck,
      })
      return new Promise((resolve) => {
        let RSSIList = []
        openAdapter()
          .then(() => {
            wx.startBluetoothDevicesDiscovery({
              allowDuplicatesKey: true,
              powerLevel: 'high',
              success: (res) => {
                console.log('@module checkAuthMixin.js\n@method checkNearby\n@desc 开始搜寻蓝牙成功\n', res)
              },
              fail(err) {
                console.error('@module checkAuthMixin.js\n@method checkNearby\n@desc 开始搜寻蓝牙失败\n', err)
              },
            })
            wx.onBluetoothDeviceFound((res) => {
              res.devices.forEach((device) => {
                // 校验设备ID
                if (device.deviceId !== deviceId) return
                const average = this.getAverageRSSI(device.RSSI, 5, RSSIList, downlinkThreshold)
                console.log('本次扫描值', device.RSSI, RSSIList, 'average', average)
                if (average) {
                  this.computedDistance = Math.pow(10, (Math.abs(average) - referenceRSSI) / (10 * 2))
                  console.log(
                    '@module checkAuthMixin.js\n@method checkNearby\n@desc 距离计算\n',
                    `平均值${average}, 标准值【${referenceRSSI}】，计算结果${this.computedDistance}`,
                  )
                }

                console.log('computedDistance', this.computedDistance, 'checkDistance', checkDistance)
                if (this.computedDistance) {
                  if (this.computedDistance <= checkDistance) {
                    if (ifResolveOnCheck) {
                      console.log('@module checkAuthMixin.js 靠近确权成功')
                      wx.offBluetoothDeviceFound()
                      wx.stopBluetoothDevicesDiscovery({
                        fail(err) {
                          console.error('@module checkAuthMixin.js 停止蓝牙搜索失败\n', err)
                        },
                      })
                      app.addDeviceInfo.isCheck = true
                      resolve()
                    } else {
                      this.ifNearbyChecked = true
                    }
                  } else {
                    this.ifNearbyChecked = false
                  }
                }
                console.log(
                  '@module checkAuthMixin.js\n@method checkNearby\n@desc 目前确权状态\n',
                  `确权状态：${this.ifNearbyChecked} 目前距离：${this.computedDistance}`,
                )
              })
            })
          })
          .catch((err) => {
            console.error('@module checkAuthMixin.js\n@method searchBlueByType\n@desc 打开蓝牙适配器失败\n', err)
          })
      })
    },
    /**
     * 获取蓝牙信号的平均值
     * @param {Number} RSSI 本次信号强度
     * @param {Number} n 采样次数
     * @param {Array} RSSIList 信号强度数组
     * @param {Number} downlinkThreshold 信号下行阈值
     */
    //获取蓝牙信号的平均值
    getAverageRSSI(RSSI, n, RSSIList, downlinkThreshold) {
      if (RSSI >= downlinkThreshold && RSSI <= -10) {
        RSSIList.push(RSSI)
      }
      if (RSSIList.length > n) {
        RSSIList.sort((a, b) => a - b)
        RSSIList.shift()
      }
      if (RSSIList.length === n) {
        // 抛出均值
        let total = RSSIList.reduce((preValue, curValue) => preValue + curValue)
        return total / n
      }
    },
  },
})
