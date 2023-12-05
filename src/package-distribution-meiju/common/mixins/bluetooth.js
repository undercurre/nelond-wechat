/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import { service } from '../js/getApiPromise'
import app from '../app'
let timer = ''
let timer1 = ''

import { baseImgApi, deviceImgApi } from '../js/api'
import { getStamp, getReqId, isEmptyObject, hasKey } from 'm-utilsdk/index'
import { creatDeviceSessionId } from '../../utils/util.js'
import { requestService } from '../../utils/requestService'
import { locationdevice, ab2hex, hex2bin, inArray, hexCharCodeToStr } from '../js/bluetoothUtils.js'
import { deviceImgMap } from '../../utils/deviceImgMap'
import { isSupportPlugin } from '../../utils/pluginFilter'
import { inputWifiInfo, addGuide, linkDevice } from '../../utils/paths.js'
import { isAddDevice } from '../../utils/temporaryNoSupDevices'
import { getWxSystemInfo, getWxGetSetting } from '../../utils/wx/index.js'
import { addDeviceSDK } from '../../utils/addDeviceSDK.js'
import { getPrivateKeys } from '../../utils/getPrivateKeys'
import Dialog from '../../../miniprogram_npm/m-ui/mx-dialog/dialog'
const brandStyle = require('../../pages/assets/js/brand')

const searchTime = 30000
const blueWifi = 'wifiAndBle'
let enterTime = 0
// eslint-disable-next-line no-undef
module.exports = Behavior({
  behaviors: [],
  properties: {},
  data: {
    dcpDeviceImgList: [],
    devices: [],
    isDeviceLength: false,
    isBluetoothMixinNotOpenWxLocation: false,
    isBluetoothMixinGoSetting: false,
    isBluetoothMixinNotOpen: false,
    isBluetoothMixinOpenLocation: false,
    isBluetoothMixinHasAuthBluetooth: true, //用户是否授权小程序使用蓝牙权限

    scanType: 'on', // on:进行中 、end：完成 、none：未发现设备
    noSupportDevices: [],
    connected: false,
    chs: [],
    deviceImg: locationdevice,
    tempIndex: 0,
    distance: '',
    showOpenLocation: false, //是否显示打开位置信息提示
    showOpenBluetooth: false, //是否显示打开蓝牙提示
    dialogStyle: brandStyle.brandConfig.dialogStyle,
  },
  methods: {
    //根据广播包 获取设备品类和sn8
    getBlueSn8(advertisData) {
      let len = advertisData.length
      const blueVersion = this.getBluetoothType(advertisData)
      const sn8 =
        blueVersion == 2
          ? hexCharCodeToStr(advertisData.slice(6, 22))
          : hexCharCodeToStr(advertisData.substr(len - 16, len))
      return sn8
    },
    //获取设备的品类
    getDeviceCategory(device) {
      const advertisData = ab2hex(device.advertisData)
      const name = device.localName ? device.localName : device.name
      if (!device.localName) {
        console.log('device:', device)
      }
      const blueVersion = this.getBluetoothType(advertisData)
      // console.log("blueVersion222------------", blueVersion, advertisData)
      let category = blueVersion == 2 ? hexCharCodeToStr(advertisData.substring(22, 26)) : this.getApCategory(name)
      return category
    },
    //根据品类 获取设备名字和图片
    getNameAndImg(category) {
      // console.log("图片+++++", locationdevice[category])
      let deviceImg
      let deviceName
      if (locationdevice[category]) {
        deviceImg = locationdevice[category].onlineIcon
        deviceName = locationdevice[category].title
      } else {
        deviceImg = locationdevice[category].onlineIcon
        deviceName = locationdevice[category].title
      }
      return {
        deviceImg: deviceImg,
        deviceName: deviceName,
      }
    },
    //获取蓝牙设备的ssid
    getBluetoothSSID(advertisData, blueVersion, category, name) {
      if (blueVersion == 1) return name
      if (blueVersion == 2) {
        if (!advertisData.substring(26, 34)) return ''
        const serial = hexCharCodeToStr(advertisData.substring(26, 34))
        const result = `${name}_${category.toLowerCase()}_${serial}`
        return result
      }
      return ''
    },
    getBlueSn8Img(category, sn8) {
      console.log('获取图片')
      return new Promise((resolve) => {
        let data = {
          iotDeviceList: [
            {
              sn8: sn8,
              category: category,
            },
          ],
        }
        requestService.request('getIotDeviceByCode', data).then((res) => {
          console.log('getIotDeviceByCode', res.data.data[0])
          if (res.data.code == 0) {
            let obj = {
              deviceImg: res.data.data[0].deviceImgUrl,
              deviceName: res.data.data[0].deviceName,
              category: category,
            }
            resolve(obj)
          }
        })
      })
    },
    getIosMac(advertisData) {
      let a = advertisData.substr(42, 12).toUpperCase()
      let b
      let arr = []
      for (let i = 0; i < a.length; i += 2) {
        arr.push(a.substr(i, 2))
      }
      b = arr.reverse().join(':')
      return b
    },
    //获取蓝牙类型
    getBluetoothType(advertisData) {
      // console.log("获取蓝牙类型", advertisData)
      const str = advertisData.slice(4, 6)
      return str == '00' ? 1 : 2
    },
    getScanRespPackInfo(advertisData) {
      const blueVersion = this.getBluetoothType(advertisData)
      // console.log('getScanRespPackInfo打印', advertisData, blueVersion)
      let hex = blueVersion == 2 ? advertisData.substr(36, 2) : advertisData.substr(6, 2)
      let binArray = hex2bin(hex)

      return {
        moduleType: binArray[0] ? 'wifiAndBle' : 'ble',
        isLinkWifi: !!binArray[1],
        isBindble: !!binArray[2],
        isBleCheck: !!binArray[3],
        // "isWifiCheck": binArray[4] ? true : false,
        // "isBleCanBind": binArray[5] ? true : false,
        // "isSupportBle": binArray[6] ? true : false,
        // "isSupportOTA": binArray[7] ? true : false,
        // "isSupportMesh": binArray[8] ? true : false,
        isFeature: blueVersion == 2 && binArray[7] == 1 ? true : false, // 是否支持扩展功能
      }
    },
    //获取蓝牙参考rssi
    getReferenceRSSI(advertisData) {
      return parseInt(advertisData.substr(40, 2), 16)
    },
    inArray(arr, key, val) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
          return i
        }
      }
      return -1
    },
    /**
     * 开始蓝牙自发现
     * @param {Number} isIndex 是否首页
     */
    openBluetoothAdapter(isIndex = 1) {
      if (!brandStyle.brandConfig.bluetooth) return
      app.globalData.bluetoothUnSupport = []
      this.closeBluetoothAdapter()
      // this.clearDevices()
      wx.openBluetoothAdapter({
        success: (res) => {
          console.log('openBluetoothAdapter success', res)
          this.startBluetoothDevicesDiscovery(isIndex)
          //自定义搜索30S以后关闭
          if (isIndex == 1) {
            this.setMixinsBluetoothClose()
          }
        },
        fail: (res) => {
          if (res.errCode === 10001) {
            console.log('6666wx.openBluetoothAdapter失败', res)
            wx.onBluetoothAdapterStateChange((res) => {
              console.log('onBluetoothAdapterStateChange', res)
              if (res.available) {
                this.startBluetoothDevicesDiscovery(isIndex)
                if (isIndex == 1) {
                  this.setMixinsBluetoothClose()
                }
              }
            })
          }
        },
      })
    },
    startBluetoothDevicesDiscovery(isIndex) {
      if (this._discoveryStarted) {
        return
      }
      this._discoveryStarted = true
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        interval: 500,
        powerLevel: 'low',
        success: (res) => {
          console.log('startBluetoothDevicesDiscovery success', res)
          setTimeout(() => {
            this.onBluetoothDeviceFound(isIndex)
          }, 1000)
        },
      })
    },
    stopBluetoothDevicesDiscovery() {
      wx.stopBluetoothDevicesDiscovery()
      wx.offBluetoothDeviceFound()
      clearTimeout(timer)
      console.log('关闭定时器', timer)
      this._discoveryStarted = false
    },
    //蓝牙自发现 打上同名称图片设备 距离最近标签
    setBLueSameSn8DeviceTag(deviceParam) {
      let isHasSameTypeDevice = false
      let index = null //已发现的
      let curDevicesIsNearest = false //传入设备是否是最近的
      let maxRSSI = deviceParam.RSSI
      this.data.devices.forEach((item, ind) => {
        if (
          item.RSSI &&
          item.SSID != deviceParam.SSID &&
          item.deviceName == deviceParam.deviceName &&
          item.deviceImg == deviceParam.deviceImg
        ) {
          isHasSameTypeDevice = true
          if (item.RSSI > maxRSSI) {
            index = ind
            maxRSSI = item.RSSI
            curDevicesIsNearest = false
          }
        }
      })
      if (index == null) {
        curDevicesIsNearest = true
      }
      return {
        isHasSameTypeDevice,
        index,
        curDevicesIsNearest, //当前设备是否是最近的
      }
    },
    //更新已发现蓝牙设备的 设备信号强度
    reNewDeviceRSSI(device, interval) {
      let backTime = new Date()
      if (backTime - enterTime < interval) return //节流
      let deviceParam = this.getDeviceParam(device)
      let index = null
      this.data.devices.forEach((item, ind) => {
        if (item.deviceId == deviceParam.deviceId) {
          item.RSSI = device.RSSI
          index = ind
          console.log('更新了rssi======', device.RSSI)
        }
      })
      let nearestRes = this.setBLueSameSn8DeviceTag(deviceParam)
      console.log('=========nearestRes=====', nearestRes)
      if (nearestRes.isHasSameTypeDevice) {
        //有同sn8的设备
        if (nearestRes.curDevicesIsNearest) {
          //当前发现的距离最近
          this.data.devices[index].isSameSn8Nearest = true
          this.data.devices.forEach((item) => {
            if (
              item.RSSI &&
              item.deviceName == deviceParam.deviceName &&
              item.deviceImg == deviceParam.deviceImg &&
              item.deviceId != deviceParam.deviceId
            ) {
              //同设备名图片的其它设备
              console.log('同设备名图片的低强度其它设备==========', item)
              item.isSameSn8Nearest = false
            }
          })
        } else {
          this.data.devices[nearestRes.index].isSameSn8Nearest = true
          this.data.devices.forEach((item) => {
            if (
              item.RSSI &&
              item.deviceName == deviceParam.deviceName &&
              item.deviceImg == deviceParam.deviceImg &&
              item.deviceId != this.data.devices[nearestRes.index].deviceId
            ) {
              //同设备名图片的其它设备
              console.log('同设备名图片的低强度其它设备==========', item)
              item.isSameSn8Nearest = false
            }
          })
        }
      }
      enterTime = backTime
      this.setData({
        devices: this.data.devices,
      })
    },

    onBluetoothDeviceFound(isIndex) {
      const self = this
      const rssiThreshold = isIndex == 0 ? -70 : -58 // 设备发现页信号强度过滤阈值为-70 首页或其他页面为-58
      wx.onBluetoothDeviceFound((res) => {
        res.devices.forEach((device) => {
          // 品牌名校验
          const localName = device.localName || device.name || ''
          if (!brandStyle.brandConfig.apNameHeader.some((value) => localName.includes(value))) {
            return
          }

          // RSSI为正值的异常情况均舍弃 或者信号强度小于-58或-70也过滤掉
          if (device.RSSI > 0 || device.RSSI < rssiThreshold) {
            return
          }
          const foundDevices = this.data.devices
          const idx = inArray(foundDevices, 'deviceId', device.deviceId)
          //mode=0为AP配网搜出来，蓝牙搜出来的设备优先级比AP配网高，需要原地覆盖原来搜到到AP设备
          if (idx === -1 || foundDevices[idx].mode === 0) {
            //校验广播包开头公司标识
            if (!this.filterMideaDevice(device)) return

            const adData = ab2hex(device.advertisData) // ArrayBuffer转16进度字符串
            device.adData = adData
            // 校验二代蓝牙广播包长度对不对
            if (!this.checkAdsData(device)) {
              console.log('二代蓝牙广播包长度异常', adData)
              return
            }
            //校验已连接设备
            if (this.filterHasConnectDevice(ab2hex(device.advertisData), device, isIndex)) return
            const deviceParam = this.getDeviceParam(device)
            //首页不显示不支持控制或配网的蓝牙自发现设备
            if (!deviceParam.isSupport && !app.globalData.isShowUnSuppport) {
              console.log('蓝牙自发现不支持控制配网的设备信息', deviceParam)
              let index = inArray(foundDevices, 'SSID', deviceParam.SSID) //ap和蓝牙自发现同一个设备 以蓝牙不支持配网优先为准
              if (index != -1) {
                let update = `devices[${index}].isSupport`
                self.setData({
                  [update]: false,
                })
              }
              app.globalData.bluetoothUnSupport.push(deviceParam)
              return
            }
            // 若首页则需处理wx.getWifiList缓存，校验是否是已配网的设备
            if (isIndex == 1) {
              console.log(
                '@module bluetooth.js\n@method onBluetoothDeviceFound\n@desc 已配网缓存数据\n',
                app.globalData.curAddedApDeviceList,
              )
              if (addDeviceSDK.checkIsAddedApDevice(deviceParam.SSID)) {
                console.log(
                  '@module bluetooth.js\n@method onBluetoothDeviceFound\n@desc 过滤已配网设备\n',
                  app.globalData.curAddedApDeviceList,
                  deviceParam.SSID,
                )
                return
              }
            }
            let nearestRes = this.setBLueSameSn8DeviceTag(deviceParam)
            console.log('=========nearestRes=====', nearestRes)
            if (nearestRes.isHasSameTypeDevice) {
              //有同sn8的设备
              if (nearestRes.curDevicesIsNearest) {
                //当前发现的距离最近
                deviceParam.isSameSn8Nearest = true
                foundDevices.forEach((item) => {
                  if (
                    item.RSSI &&
                    item.deviceName == deviceParam.deviceName &&
                    item.deviceImg == deviceParam.deviceImg &&
                    item.SSID != deviceParam.SSID
                  ) {
                    //同设备名图片的其它非信号最强设备
                    item.isSameSn8Nearest = false
                  }
                })
              } else {
                foundDevices[nearestRes.index].isSameSn8Nearest = true
                foundDevices.forEach((item) => {
                  if (
                    item.RSSI &&
                    item.deviceName == deviceParam.deviceName &&
                    item.deviceImg == deviceParam.deviceImg &&
                    item.SSID != foundDevices[nearestRes.index].SSID
                  ) {
                    //同设备名图片的其它非信号最强设备
                    item.isSameSn8Nearest = false
                  }
                })
              }
            }
            let sortData = this.sortDevice(foundDevices, deviceParam, idx)
            //自发现设备里去掉找朋友发现的朋友设备信息
            // console.log('朋友设备信息', app.globalData.friendDevices)
            // let friendDevices = app.globalData.friendDevices ? app.globalData.friendDevices : []
            // let ssids = friendDevices.map((item) => {
            //   return item.ssid
            // })
            // sortData = sortData.filter((item) => {
            //   return !ssids.includes(item.SSID)
            // })
            this.setData({
              devices: sortData,
            })
          } else {
            //已发现设备
            this.reNewDeviceRSSI(device, 2000)
          }
          console.log('已发现设备=======', this.data.devices)
          this.setMixinsDialogShow()
        })
      })
    },
    getDeviceParam(device) {
      const advertisData = ab2hex(device.advertisData)
      const blueVersion = this.getBluetoothType(advertisData)
      const scanRespPackInfo = this.getScanRespPackInfo(advertisData)
      const mac = this.getIosMac(advertisData)
      const sn8 = this.getBlueSn8(advertisData)
      const moduleType = this.getDeviceModuleType(scanRespPackInfo)
      const category = this.getDeviceCategory(device)?.toUpperCase()
      const mode = this.getDeviceMode(moduleType, category, sn8)
      const SSID = this.getBluetoothSSID(ab2hex(device.advertisData), blueVersion, category, device.localName)
      const enterprise = this.getEnterPrise(SSID)
      const isSupport = this.checkIfSupport(mode, moduleType, category, sn8)
      const typeAndName = this.getDeviceImgAndName(category, sn8)
      const referenceRSSI = this.getReferenceRSSI(advertisData)
      const obj = {}
      obj.sn8 = sn8
      obj.category = category
      obj.mac = mac
      obj.moduleType = moduleType
      obj.blueVersion = blueVersion
      obj.adData = advertisData
      obj.RSSI = device.RSSI
      obj.mode = mode
      obj.tsn = ''
      obj.SSID = SSID
      obj.deviceImg = typeAndName.deviceImg
      obj.deviceName = typeAndName.deviceName
      obj.isSupport = isSupport
      obj.deviceId = device.deviceId
      obj.enterprise = enterprise
      obj.referenceRSSI = referenceRSSI
      obj.fm = 'autoFound'
      obj.fmType = 'bluetooth' //添加是蓝牙自发现设备信息标识
      console.log('@module bluetooth.js\n@method getDeviceParam\n@desc 设备详细参数\n', obj)
      console.log('@module bluetooth.js\n@method getDeviceParam\n@desc 原始设备详细参数\n', device)
      return obj
    },
    getDeviceModuleType(scanRespPackInfo) {
      return scanRespPackInfo.moduleType == blueWifi ? '1' : '0'
    },
    getDeviceMode(moduleType, category, sn8) {
      console.log('getDeviceMode====', category, sn8)
      if (addDeviceSDK.isBlueAfterLinlNetAc(category, sn8)) {
        //走直连后配网
        return 20
      }
      return moduleType == '1' ? 3 : 5
    },
    checkAdsData(device) {
      const sourceAds = device.advertisData
      const advertisData = ab2hex(device.advertisData)
      // console.log("过滤广播包不规范设备", advertisData,sourceAds.byteLength, this.getBluetoothType(advertisData))
      const blueVersion = this.getBluetoothType(advertisData)
      return blueVersion == 2 && sourceAds.byteLength < 27 ? false : true
    },
    sortDevice(foundDevices, item) {
      let device = this.data.devices
      const idx2 = inArray(device, 'SSID', item.SSID)
      if (idx2 !== -1) {
        // console.log("已搜到的用户",foundDevices, item)
        device[idx2] = item
        return this.sortScanDevice(foundDevices, item, 'set')
      } else {
        // console.log("新增加的用户",foundDevices, item)
        return this.sortScanDevice(foundDevices, item)
      }
    },
    /**
     * 获取设备图片和名称
     * @param {string} category 品类
     * @param {string} sn8 sn8
     */
    getDeviceImgAndName(category, sn8) {
      const list = ''
      let item = {
        deviceImg: '',
        deviceName: '',
      }
      // 获取设备图片
      if (!list) {
        item.deviceImg = baseImgApi.url + 'scene/sence_img_lack.png'
      } else {
        if (Object.keys(list).includes(sn8) && list[sn8]['icon']) {
          item.deviceImg = list[sn8]['icon']
        } else if (list.common.icon) {
          item.deviceImg = list.common.icon
        } else if (hasKey(deviceImgMap, category.toUpperCase())) {
          //品类图
          item.deviceImg = deviceImgApi.url + 'blue_' + category.toLowerCase() + '.png'
        } else {
          //缺省图
          item.deviceImg = deviceImgApi.url + 'blue_default_type.png'
        }
      }
      // 获取设备名称
      if (list) {
        if (Object.keys(list).includes(sn8) && list[sn8]['name']) {
          item.deviceName = list[sn8]['name']
        } else if (list.common.name) {
          item.deviceName = list.common.name
        }
      }
      if (!item.deviceName) {
        if (hasKey(deviceImgMap, category.toUpperCase())) {
          item.deviceName = deviceImgMap[category]['title']
        } else {
          item.deviceName = deviceImgMap['DEFAULT_ICON']['title']
        }
      }
      return item
    },
    //图片接口和自发现同时进行，有些自发现设备信息已发现显示，图片接口还没执行完，这个时候需要更新自发现设备图片为空的图片和名字
    updateFoundDeviceIcon() {
      this.data.devices.forEach((item, index) => {
        let { deviceImg, category, sn8 } = item
        if (deviceImg.includes('sence_img_lack')) {
          let nameAndIcon = this.getDeviceImgAndName(category, sn8)
          let updateName = `devices[${index}].deviceName`
          let updateIcon = `devices[${index}].deviceImg`
          this.setData({
            [updateName]: nameAndIcon.deviceName,
            [updateIcon]: nameAndIcon.deviceImg,
          })
        }
      })
    },
    dcpMixinsDeviceImgList() {
      return new Promise((resolve) => {
        let reqData = {
          version: '',
        }
        console.log('9999999999', !isEmptyObject(app.globalData.dcpDeviceImgList), app.globalData.dcpDeviceImgList)
        if (!isEmptyObject(app.globalData.dcpDeviceImgList)) {
          resolve(app.globalData.dcpDeviceImgList)
          return
        }
        requestService.request('getIotDeviceImg', reqData).then((res) => {
          // console.log("设备图片", res.data.data.iconList)
          this.setData({
            dcpDeviceImgList: res.data.data.iconList,
          })
          app.globalData.dcpDeviceImgList = res.data.data.iconList
          resolve(app.globalData.dcpDeviceImgList)
        })
      })
    },
    filterHasConnectDevice(advertisData, device, isIndex) {
      const blueVersion = this.getBluetoothType(advertisData)
      const scanRespPackInfo = this.getScanRespPackInfo(advertisData)
      const category = '0x' + this.getDeviceCategory(device).toUpperCase()
      const mac = this.getIosMac(advertisData).replace(/:/g, '').toUpperCase()
      const sn8 = this.getBlueSn8(advertisData)
      //1.0华凌空调特殊处理，添加设备发现页才处理逻辑
      //2.0华凌空调特殊处理，首页发现页、添加设备发现页都要处理处理逻辑 A用户已蓝牙直连，则首页、添加设备自发现没有，B用户只有在添加设备页才出现
      // && !isIndex
      if (category == '0xAC' && addDeviceSDK.isBlueAfterLinlNetAc(category, sn8)) {
        let item
        let { curUserMatchNetAcDevices, curUserBluetoothAcDevices } = app.globalData
        let curUserAcDevices = [...curUserMatchNetAcDevices, ...curUserBluetoothAcDevices]
        if (curUserAcDevices?.length) {
          console.log('curUserAcDevices==========', curUserAcDevices)
          for (let i = 0; i <= curUserAcDevices.length; i++) {
            item = curUserAcDevices[i]
            if (item && item.btMac.replace(/:/g, '').toUpperCase() == mac) {
              //无论是否被绑定 只要当前用户下没该设备都允许发现显示
              console.log('当前用户有wifi绑定该设备1', item, mac)
              return true
            }
            if (item && item.btMac.replace(/:/g, '').toUpperCase().slice(0, 10) == mac.slice(0, 10)) {
              //无论是否被绑定 只要当前用户下没该设备都允许发现显示
              console.log('当前用户有wifi绑定该设备2', item, mac)
              return true
            }
            if (!scanRespPackInfo.isBindble && isIndex == 1) {
              //判断设备是否在A用户已蓝牙直连，且B用户不能在首页自发现
              console.log('判断设备是否在A用户已蓝牙直连，且B用户不能在首页自发现')
              return true
            }
          }
        }
        console.log('当前用户没有绑定该设备', advertisData, device)
        return false
      }
      let { isLinkWifi, isBindble, moduleType } = scanRespPackInfo
      // 二代单BLE模组
      if (blueVersion == 2) {
        return isLinkWifi || isBindble
      } else if (moduleType === blueWifi) {
        return isLinkWifi
      }
      return false
    },
    getBluetooyhMixinDcpDeviceImg() {
      return new Promise((resolve) => {
        let reqData = {
          version: '',
        }

        const obj = app.globalData.dcpDeviceImgList
        console.log('设备图片', obj)
        if (JSON.stringify(obj) != '{}') {
          console.log('设备图片2', app.globalData.dcpDeviceImgList)
          resolve(app.globalData.dcpDeviceImgList)
          return
        }
        requestService.request('getIotDeviceImg', reqData).then((res) => {
          console.log('设备图片3', res.data.data.iconList)
          this.setData({
            dcpDeviceImgList: res.data.data.iconList,
          })
          app.globalData.dcpDeviceImgList = res.data.data.iconList
          resolve()
        })
      })
    },
    filterMideaDevice(obj) {
      if (obj.advertisData != null) {
        const hexStr = ab2hex(obj.advertisData)
        const brand = hexStr.slice(0, 4)
        return brand === 'a806'
      }
    },

    createBLEConnection(e) {
      const ds = e.currentTarget.dataset
      const deviceId = ds.deviceId
      const name = ds.name
      wx.createBLEConnection({
        deviceId,
        success: () => {
          this.setData({
            connected: true,
            name,
            deviceId,
          })
          this.getBLEDeviceServices(deviceId)
        },
      })
      this.stopBluetoothDevicesDiscovery()
    },
    closeBLEConnection() {
      wx.closeBLEConnection({
        deviceId: this.data.deviceId,
      })
      this.setData({
        connected: false,
        chs: [],
        canWrite: false,
      })
    },
    getBLEDeviceServices(deviceId) {
      wx.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          for (let i = 0; i < res.services.length; i++) {
            if (res.services[i].isPrimary) {
              this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
              return
            }
          }
        },
      })
    },
    getBLEDeviceCharacteristics(deviceId, serviceId) {
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
              this.setData({
                canWrite: true,
              })
              this._deviceId = deviceId
              this._serviceId = serviceId
              this._characteristicId = item.uuid
              this.writeBLECharacteristicValue()
            }
            if (item.properties.notify || item.properties.indicate) {
              wx.notifyBLECharacteristicValueChange({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
                state: true,
              })
            }
          }
        },
        fail(res) {
          console.error('getBLEDeviceCharacteristics', res)
        },
      })
      // 操作之前先监听，保证第一时间获取数据
      wx.onBLECharacteristicValueChange((characteristic) => {
        const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
        const data = {}
        if (idx === -1) {
          data[`chs[${this.data.chs.length}]`] = {
            uuid: characteristic.characteristicId,
            value: ab2hex(characteristic.value),
          }
        } else {
          data[`chs[${idx}]`] = {
            uuid: characteristic.characteristicId,
            value: ab2hex(characteristic.value),
          }
        }
        // data[`chs[${this.data.chs.length}]`] = {
        //   uuid: characteristic.characteristicId,
        //   value: ab2hex(characteristic.value)
        // }
        this.setData(data)
      })
    },
    writeBLECharacteristicValue() {
      // 向蓝牙设备发送一个0x00的16进制数据
      let buffer = new ArrayBuffer(1)
      let dataView = new DataView(buffer)
      dataView.setUint8(0, (Math.random() * 255) | 0)
      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: this._deviceId,
        characteristicId: this._characteristicId,
        value: buffer,
      })
    },
    closeBluetoothAdapter() {
      wx.closeBluetoothAdapter()
      clearTimeout(timer)
      console.log('关闭定时器', timer)
      this._discoveryStarted = false
    },
    setBlueStatus() {
      this.setData({
        isBluetoothMixinNotOpenWxLocation: true,
      })
    },
    /**
     *
     * @param {boolean} forceUpdate 是否强制更新systeminfo settinginfo
     * @returns
     */
    checkSystemInfo(forceUpdate = true) {
      this.clearMixinInitData()
      return new Promise((resolve) => {
        Promise.all([
          getWxSystemInfo({ forceUpdate }),
          getWxGetSetting({
            forceUpdate,
          }),
        ]).then((res) => {
          if (!res[0].locationEnabled || !res[0].locationAuthorized || !res[1]['authSetting']['scope.userLocation']) {
            this.setData({
              isBluetoothMixinNotOpenWxLocation: true,
            })
          } else {
            this.setData({
              isBluetoothMixinNotOpenWxLocation: false,
            })
          }
          if (!res[0].bluetoothEnabled) {
            this.setData({
              isBluetoothMixinNotOpen: true,
            })
          } else {
            this.setData({
              isBluetoothMixinNotOpen: false,
            })
          }
          if (res[1]['authSetting']['scope.bluetooth']) {
            this.setData({
              isBluetoothMixinHasAuthBluetooth: true,
            })
          } else {
            this.setData({
              isBluetoothMixinHasAuthBluetooth: false,
            })
          }
          resolve(res)
          console.log(
            'getSystemInfo',
            res,
            this.data.isBluetoothMixinNotOpenWxLocation,
            this.data.isBluetoothMixinNotOpen,
            this.data.isBluetoothMixinHasAuthBluetooth,
            app.globalData.hasAuthLocation,
            app.globalData.hasAuthBluetooth,
          )
        })
      })
    },
    getAuthSetting(forceUpdate = true) {
      return new Promise((resolve) => {
        getWxGetSetting({
          forceUpdate,
          success(res) {
            resolve(res.authSetting)
          },
        })
      })
    },
    setMixinsBluetoothClose() {
      timer = setTimeout(() => {
        // this.closeBluetoothAdapter()
        this.stopBluetoothDevicesDiscovery()
        console.log('扫描到的设备', this.data.devices)
        console.log('关闭发现蓝牙')
      }, searchTime)
    },
    setMixinsDialogShow() {
      if (this.data.isDeviceLength) return // 避免重复赋值
      if (this.data.devices.length == 0) return
      this.setData({
        isDeviceLength: true,
      })
    },
    clearMixinInitData() {
      this.setData({
        isBluetoothMixinGoSetting: false,
        isBluetoothMixinOpenLocation: false,
      })
    },
    checkIfSupport(mode, moduleType, category, sn8) {
      //校验是否支持控制的设备
      let formatType = '0x' + category.toLocaleUpperCase()
      if (!isSupportPlugin(formatType, sn8)) {
        console.log('自发现 插件不支持')
        return false
      }
      // if (mode !== 0 && moduleType === '0' && (category !== 'C0')) {
      //   return false
      // }
      if (!isAddDevice(category.toLocaleUpperCase(), sn8)) {
        console.log('自发现 未测试不支持')
        return false
      }
      return true
    },
    //获取配网指引
    getAddDeviceGuide(fm = 'scanCode', deviceInfo = {}) {
      let { mode, type, sn8, enterprise, ssid, productId, tsn, sn } = deviceInfo
      return new Promise((resolve, reject) => {
        if (fm == 'autoFound') {
          let reqData = {
            reqId: getReqId(),
            stamp: getStamp(),
            ssid: ssid,
            enterpriseCode: enterprise,
            category: type.includes('0x') ? type.substr(2, 2) : type,
            code: sn8,
            mode: mode + '',
            queryType: 2,
          }
          console.log('自发现请求确权指引', reqData)
          requestService
            .request('multiNetworkGuide', reqData, 'POST', '', 2000)
            .then((resp) => {
              console.log('自发现获得确权指引', resp)
              console.log('配网指引信息', resp.data.data.mainConnectinfoList[0].connectDesc)
              resolve(resp)
            })
            .catch((error) => {
              console.log(error)
              reject(error)
            })
        }
        if (fm == 'selectType') {
          let reqData = {
            code: sn8,
            reqId: getReqId(),
            stamp: getStamp(),
            enterpriseCode: enterprise,
            category: type.includes('0x') ? type.substr(2, 2) : type,
            productId: productId,
            queryType: 1,
          }
          console.log('自发现请求确权指引', reqData)
          requestService
            .request('multiNetworkGuide', reqData)
            .then((resp) => {
              console.log('配网指引信息 选型', resp.data.data.mainConnectinfoList)
              resolve(resp)
            })
            .catch((error) => {
              console.log(error)
              reject(error)
            })
        }
        if (fm == 'scanCode') {
          let reqData = {
            sn: sn,
            reqId: getReqId(),
            stamp: getStamp(),
            ssid: ssid,
            enterpriseCode: enterprise,
            category: type.includes('0x') ? type.substr(2, 2) : type,
            code: sn8,
            mode: mode + '',
            tsn: tsn,
            queryType: 2,
          }
          console.log('扫码请求确权指引', reqData)
          requestService
            .request('multiNetworkGuide', reqData)
            .then((resp) => {
              console.log('配网指引信息 扫码', resp.data.data.mainConnectinfoList)
              resolve(resp)
            })
            .catch((error) => {
              console.log(error)
              reject(error)
            })
        }
      })
    },
    //指引获取失败处理
    getGuideFail(fm) {
      let self = this
      let cancelText = '此二维码获取配网指引失败，请使用选择型号添加'
      if (fm !== 'scanCode') {
        wx.showModal({
          content: '未获取到该产品的操作指引，请检查网络后重试，若仍失败，请联系售后处理',
          confirmText: '好的',
          confirmColor: '#458BFF',
          showCancel: false,
          success() {},
        })
      } else {
        wx.showModal({
          content: cancelText,
          cancelText: '重新扫码',
          confirmText: '选型添加',
          cancelColor: '#458BFF',
          confirmColor: '#458BFF',
          success(res) {
            if (res.confirm) {
              //选型
              self.goSelectDevice()
            } else if (res.cancel) {
              //扫码
              self.actionScan()
            }
          },
        })
      }
    },

    async actionGoNetwork(item) {
      // 节流
      if (this.actionGoNetworkLock) return
      this.actionGoNetworkLock = setTimeout(() => {
        this.actionGoNetworkLock = null
      }, 1000)
      console.log('item===========', item)

      const addDeviceInfo = {
        adData: item.adData || '',
        uuid: item.advertisServiceUUIDs || '',
        localName: item.localName || '',
        isFromScanCode: item.isFromScanCode || false,
        deviceName: item.deviceName || '',
        deviceId: item.deviceId || '', //设备蓝牙id
        mac: item.mac || '', //设备mac 'A0:68:1C:74:CC:4A'
        type: item.category || '', //设备品类 AC
        sn8: item.sn8 || '',
        deviceImg: item.deviceImg || '', //设备图片
        moduleType: item.moduleType || '', //模组类型0：ble  1:ble+weifi
        blueVersion: item.blueVersion || '', //蓝牙版本1:1代  2：2代
        mode: item.mode,
        tsn: item.tsn || '',
        bssid: item.bssid || '',
        ssid: item.SSID || '',
        enterprise: item.enterprise || '',
        fm: item.fm || 'autoFound',
        rssi: item.RSSI,
        referenceRSSI: item.referenceRSSI || '',
        guideInfo: item.guideInfo || null,
        plainSn: item.plainSn || '',
        sn: item.sn || '',
        fmType: item.fmType || '', //判断自发现设备信息是ap自发现还是蓝牙自发现
      }
      if (!addDeviceInfo.deviceImg || !addDeviceInfo.deviceName) {
        // 设备图片或名称缺失则补全
        const typeAndName = this.getDeviceImgAndName(addDeviceInfo.type, addDeviceInfo.sn8)
        if (!addDeviceInfo.deviceImg) addDeviceInfo.deviceImg = typeAndName.deviceImg
        if (!addDeviceInfo.deviceName) addDeviceInfo.deviceName = typeAndName.deviceName
      }
      app.addDeviceInfo = addDeviceInfo
      console.log('addDeviceInfo数据', addDeviceInfo)
      // wx.setStorageSync('addDeviceInfo', addDeviceInfo)
      // wx.stopBluetoothDevicesDiscovery()
      this.stopBluetoothDevicesDiscovery()
      // this.closeWifiScan()
      clearTimeout(timer)
      clearTimeout(timer1)
      if (item.fm === 'scanCode') {
        //兼容扫码触发蓝牙自发现处理
        this.data.isScanCodeSuccess = true
      }
      //获取后台配置对应的配网方式
      if (item.fm === 'scanCode' || item.fm === 'autoFound') {
        try {
          let guideInfo = addDeviceInfo.guideInfo
          // ap自发现不请求配网指引
          if (addDeviceInfo.fmType != 'ap' && !addDeviceInfo.guideInfo) {
            guideInfo = await this.getAddDeviceGuide(item.fm, addDeviceInfo)
          }
          if (item.fm === 'scanCode') {
            //扫码去后台配置的配网方式
            app.addDeviceInfo.mode = guideInfo.data.data.mainConnectinfoList[0].mode //重置配网方式
          }
          app.addDeviceInfo.mode = addDeviceSDK.getMode(app.addDeviceInfo.mode)
          app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(app.addDeviceInfo.mode) //重置连接方式
          if (guideInfo?.data?.data?.mainConnectinfoList?.length) {
            console.log('后台配置的配网方式=====', guideInfo.data.data.mainConnectinfoList[0].mode)
            app.addDeviceInfo.guideInfo = guideInfo.data.data.mainConnectinfoList //暂存指引
          }
          let codeExtInfo = ''
          let cateExtInfo = ''
          let sn8ExtInfo = ''
          if (guideInfo?.data) {
            let { code, data } = guideInfo.data
            codeExtInfo = code ? code + '' : ''
            cateExtInfo = data?.category ? data.category : ''
            sn8ExtInfo = data?.mainConnectinfoList?.length ? data.mainConnectinfoList[0].code : ''
          }
        } catch (error) {
          console.log('[get add device guide error]', error)
          //微信扫一扫二维码进入配网，没获取到配网指引跳转到下载app页面
          if (app.globalData.fromWechatScan) {
            wx.showModal({
              title: '',
              content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
              showCancel: false,
              confirmText: '我知道了',
            })
            return
          }
          if (item.blueVersion != 2) {
            /**
             * 一代蓝牙需要配网指引，无指引的情况getGuideFail处理
             * 二代蓝牙不需要配网指引，直接放行
             */
            this.getGuideFail(item.fm)
            return
          }
        }
      }
      // 校验小程序支持的配网方式
      if (!addDeviceSDK.isSupportAddDeviceMode(app.addDeviceInfo.mode)) {
        if (this.setDialogMixinsData) {
          this.setDialogMixinsData(true, '该设备暂不支持小程序配网，我们会尽快开放，敬请期待', '', false, [
            {
              btnText: '我知道了',
              flag: 'confirm',
            },
          ])
        } else {
          // wx.showModal({
          //   content: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
          //   confirmText: '我知道了',
          //   confirmColor: '#488FFF',
          //   showCancel: false,
          // })
          Dialog.confirm({
            title: '该设备暂不支持小程序配网，我们会尽快开放，敬请期待',
            confirmButtonText: '我知道了',
            confirmButtonColor: this.data.dialogStyle.confirmButtonColor2,
            showCancelButton: false,
          })
        }
      }
      // 判断全局的密钥有没有，有就跳过，没有就重新拉取
      if (!app.globalData.privateKey && app.addDeviceInfo.mode != '103' && app.addDeviceInfo.mode != '100') {
        if (app.globalData.privateKeyIntervalNum) {
          clearInterval(app.globalData.privateKeyIntervalNum)
        }
        try {
          await getPrivateKeys.getPrivateKey()
          this.actionGoNetwork(item)
        } catch (err) {
          this.privateKeyErrorHand(item)
        }
        return
      }
      // 结束判断全局的密钥有没有，有就跳过，没有就重新拉取
      if (addDeviceSDK.isCanWb01BindBLeAfterWifi(addDeviceInfo.type, addDeviceInfo.sn8)) {
        //需要wb01直连后配网判断
        app.addDeviceInfo.mode = 30
        wx.navigateTo({
          url: addGuide,
        })
      }
      let mode = app.addDeviceInfo.mode
      if (mode == 0 || mode == 3) {
        wx.navigateTo({
          url: inputWifiInfo,
        })
      } else if (mode == 5 || mode == 9 || mode == 10 || mode == 20 || mode == 100 || mode == 103) {
        wx.navigateTo({
          url: addGuide,
        })
      } else if (mode == 8) {
        app.addDeviceInfo.linkType = 'NB-IOT'
        app.globalData.deviceSessionId = creatDeviceSessionId(app.globalData.userData.uid) //创建一次配网标识
        wx.navigateTo({
          url: linkDevice,
        })
      }
    },
    clearDevices() {
      this.setData({
        devices: [],
        isDeviceLength: false,
      })
    },
    //ap 配网相关2021-08-01 新增
    /**
     * 开始AP自发现
     * @param {Number} isIndex 是否首页
     */
    async getWifiList(isIndex = 1) {
      if (!brandStyle.brandConfig.ap) return
      const res = await this.checkSystem()
      if (res) return
      service.getWxApiPromise(wx.startWifi).then((res1) => {
        console.log('@module bluetooth.js\n@method getWifiList\n@desc startWifi成功\n', res1)
        if (isIndex == 1) {
          this.setMixinsWifiClose()
        }
        setTimeout(() => {
          service.getWxApiPromise(wx.getWifiList)
        }, 1000)
        wx.onGetWifiList((res3) => {
          console.log('@module bluetooth.js\n@method getWifiList\n@desc 获取到WiFi列表\n', res3)
          res3.wifiList.forEach((device) => {
            // 校验设备热点名称
            if (!this.filterAPName(brandStyle.brandConfig.apNameHeader, device.SSID)) return
            console.log('@module bluetooth.js\n@method getWifiList\n@desc 通过名称校验\n', device)
            // WiFi强度校验
            if (device.signalStrength < 99) return
            console.log('@module bluetooth.js\n@method getWifiList\n@desc 通过ap强度校验\n', device)
            //校验是否蓝牙已发现
            if (!this.filterBluetoothScan(device.SSID)) return
            // 若首页则需处理wx.getWifiList缓存，校验是否是已配网的设备
            if (isIndex == 1) {
              console.log(
                '@module bluetooth.js\n@method getWifiList\n@desc 已配网缓存数据\n',
                app.globalData.curAddedApDeviceList,
              )
              if (addDeviceSDK.checkIsAddedApDevice(device.SSID)) {
                console.log(
                  '@module bluetooth.js\n@method getWifiList\n@desc 过滤已配网设备\n',
                  app.globalData.curAddedApDeviceList,
                  device.SSID,
                )
                return
              }
            }
            //获取已发现设备的需要字段
            const deviceData = this.getDeviceData(device)
            //蓝牙和ap自发现到同一个SSID，以蓝牙不支持配网为准
            if (!this.filterBluetoothUnSupport(device.SSID)) {
              deviceData.isSupport = false
            }
            //获取已发现列表
            const foundDevices = this.data.devices
            let sortDevice = this.sortScanDevice(foundDevices, deviceData)
            //AP自发现设备里去掉找朋友发现的朋友设备信息
            // console.log('朋友设备信息', app.globalData.friendDevices)
            // let friendDevices = app.globalData.friendDevices ? app.globalData.friendDevices : []
            // let ssids = friendDevices.map((item) => {
            //   return item.ssid
            // })
            // sortDevice = sortDevice.filter((item) => {
            //   return !ssids.includes(item.SSID)
            // })
            this.setData({
              devices: sortDevice,
            })
            console.log('添加的AP自发现设备', this.data.devices)
            this.setMixinsDialogShow()
          })
          setTimeout(() => {
            wx.getWifiList({
              fail: () => {},
            })
          }, 2000)
        })
      })
    },
    sortScanDevice(foundDevices, deviceData, str) {
      return this.getSortDataByFindTime(foundDevices, deviceData, str)
    },
    closeWifiScan() {
      service.getWxApiPromise(wx.stopWifi)
    },
    clearMixinsTime() {
      clearTimeout(timer)
      clearTimeout(timer1)
    },
    setMixinsWifiClose() {
      timer1 = setTimeout(() => {
        console.log('关闭wifi')
        wx.offGetWifiList()
      }, searchTime)
    },
    /**
     * 校验设备热点名称
     * @param {string} header 设备热点名称开头
     * @param {string} SSID 设备热点名称
     */
    filterAPName(header, SSID) {
      const headerReg = header
        .reduce((previous, current) => {
          previous.push(current + '_')
          return previous
        }, [])
        .join('|')
      const reg = new RegExp(`(${headerReg})[0-9a-fA-F]{2}_[0-9a-zA-Z]{4}`)

      return reg.test(SSID)
    },
    filterBluetoothScan(SSID) {
      const fonudDevices = this.data.devices
      const idx = inArray(fonudDevices, 'SSID', SSID)
      console.log('SSID 筛查', fonudDevices, idx)
      return idx === -1 ? true : false
    },
    //ap和蓝牙自发现到同一个SSID的设备，以蓝牙不支持配网结果为准，不显示在自发现弹窗
    filterBluetoothUnSupport(SSID) {
      let { bluetoothUnSupport } = app.globalData
      if (bluetoothUnSupport && bluetoothUnSupport.length != 0) {
        const idx = inArray(bluetoothUnSupport, 'SSID', SSID)
        return idx === -1 ? true : false
      } else {
        return true
      }
    },
    getApCategory(SSID) {
      const arr = SSID.split('_')
      console.log('SSSSSSSsSSS', arr[1])
      // return SSID.slice(6,8)
      return arr[1]
    },
    //构造数据
    getDeviceData(deviceData) {
      console.log('deviceData=========', deviceData)
      const result = {}
      const category = this.getApCategory(deviceData.SSID).toUpperCase()
      const typeAndName = this.getDeviceImgAndName(category)
      const isSupport = true //ap 自发现是否有插件只校验品类
      const enterprise = this.getEnterPrise(deviceData.SSID)
      result.category = category
      result.signalStrength = deviceData.signalStrength
      result.bssid = deviceData.BSSID
      result.deviceImg = typeAndName.deviceImg
      result.deviceName = typeAndName.deviceName
      result.SSID = deviceData.SSID
      result.mode = 0
      result.isSupport = isSupport
      result.enterprise = enterprise
      result.fm = 'autoFound'
      result.fmType = 'ap' //AP自发现设备信息添加标识
      return result
    },
    getEnterPrise(SSID) {
      const arr = SSID.split('_')
      return arr[0] == 'bugu' ? '0010' : '0000'
    },

    getDeviceApImgAndName(dcpDeviceImgList, category) {
      let item = {}
      console.log('获取图标命名称1', dcpDeviceImgList, category)
      if (dcpDeviceImgList[category]) {
        item.deviceImg = dcpDeviceImgList[category].common
      } else {
        console.log('没找到', deviceImgMap)
        if (deviceImgMap[category]) {
          item.deviceImg = deviceImgApi.url + 'blue_' + category.toLocaleLowerCase() + '.png'
        } else {
          item.deviceImg = deviceImgApi.url + 'blue_default_type.png'
        }
      }
      if (deviceImgMap[category]) {
        const filterObj = deviceImgMap[category]
        item.deviceName = filterObj.title
      } else {
        item.deviceName = ''
      }
      console.log('获取图标命名称2', item)
      return item
    },
    checkWxVersion() {
      const version = app.globalData.systemInfo.version
      const arr = version.split('.')
      console.log('version11', parseInt(arr[0]) < 8)
      if (parseInt(arr[0]) < 8) return false
      return !(parseInt(arr[0]) >= 8 && parseInt(arr[1]) === 0 && parseInt(arr[2]) < 7)
    },
    checkSystem() {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        const systemInfo = await getWxSystemInfo()
        const platform = systemInfo && systemInfo.platform
        const result = platform.indexOf('ios') > -1
        resolve(result)
      })
    },
    getSortDataByFindTime(currArr, info, str) {
      let supportArr = currArr.filter((item) => {
        return item.isSupport
      })
      let unsupportArr = currArr.filter((item) => {
        return !item.isSupport
      })
      //str - 'set'时只排序，不增加
      if (str != 'set') {
        if (!info.isSupport) {
          unsupportArr.push(info)
        } else {
          supportArr.push(info)
        }
      }
      currArr = [...supportArr, ...unsupportArr]
      return currArr
    },
    /**
     * 请求授权小程序使用位置权限
     */
    locationAuthorize() {
      let _this = this
      if (!app.globalData.hasAuthLocation && !app.globalData.showLocationAuthCount) {
        app.globalData.showLocationAuthCount = 1
        wx.authorize({
          scope: 'scope.userLocation',
          async success() {
            if (!app.globalData.isBluetoothMixinNotOpenWxLocation) {
              await _this.checkSystemInfo()
            }
            app.globalData.hasAuthLocation = true
          },
          fail(err) {
            if (err.errMsg.includes('deny')) {
              app.globalData.hasAuthLocation = true
            }
          },
          complete() {
            app.globalData.showLocationAuthCount = 0
          },
        })
      }
    },
    /**
     * 请求授权小程序使用蓝牙权限
     */
    bluetoothAuthorize() {
      let _this = this
      if (!app.globalData.hasAuthBluetooth && !app.globalData.showBluetoothAuthCount) {
        app.globalData.showBluetoothAuthCount = 1
        //用户授权小程序使用蓝牙权限预览埋点
        wx.authorize({
          scope: 'scope.bluetooth',
          async success() {
            if (!app.globalData.isBluetoothMixinHasAuthBluetooth) {
              await _this.checkSystemInfo()
            }
            app.globalData.hasAuthBluetooth = true
          },
          fail(err) {
            if (err.errMsg.includes('deny')) {
              app.globalData.hasAuthBluetooth = true
            }
          },
          complete() {
            app.globalData.showBluetoothAuthCount = 0
            try {
              _this.timing(_this.data.time)
            } catch (error) {
              console.log('不执行timing')
            }
          },
        })
      }
    },
  },
})
