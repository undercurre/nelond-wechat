/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-this-alias */
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { Logger } from '../../../utils/index'
import { homeStore } from '../../../store/index'
import { queryGuideInfo } from '../../../apis/index'

import { addDeviceTime } from '../assets/js/utils'
import { deviceImgMap } from '../../utils/deviceImgMap'
import computedBehavior from '../../utils/miniprogram-computed.js'
import { deviceImgApi, imgBaseUrl } from '../../common/js/api'
import { openAdapter } from '../addDevice/pages/utils/blueApi'
import { ab2hex } from 'm-utilsdk/index'
import { getFullPageUrl, showToast } from '../../utils/util'
import { getDeviceCategoryAndSn8, getScanRespPackInfo } from '../../utils/blueAdDataParse'
import paths from '../../utils/paths'
import { addDeviceSDK } from '../../utils/addDeviceSDK'
import { checkPermission } from '../../common/js/checkPermissionTip'
import { imgesList } from '../assets/js/shareImg.js'

import app from '../../common/app'
const addDeviceMixin = require('../addDevice/pages/assets/js/addDeviceMixin')
const checkAuthMixin = require('../addDevice/mixins/checkAuthMixin')
const netWordMixin = require('../assets/js/netWordMixin')
const bluetooth = require('../../common/mixins/bluetooth')
const dialogCommonData = require('../../common/mixins/dialog-common-data.js')

const brandStyle = require('../assets/js/brand.js')
const imgUrl = imgBaseUrl.url + '/shareImg/' + brandStyle.brand
let timer

Page({
  behaviors: [
    pageBehaviors,
    addDeviceMixin,
    netWordMixin,
    computedBehavior,
    bluetooth,
    dialogCommonData,
    checkAuthMixin,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    mode: null,
    deviceName: '',
    deviceId: '',
    moduleType: Number,
    time: 60,
    distance: '',
    deviceImg: '',
    checkGuideInfo: {
      connectDesc: '',
      connectUrlA: '',
    },
    addDeviceInfo: {},
    guideType: '', //set 设置  near 靠近
    noFound: false, //没发现附近
    isFinishUpAp: false, //是否起ap
    selTypeImg: '', //勾选状态图片
    blueArrowImg: imgUrl + imgesList['network_icon'],
    readingTimer: 4, //阅读指引等待时间 s
    curDeviceISCheck: false,
    guideIndex: 0, //当前显示配网所在的数组索引
    guideInfo: [], //配网指引数组
    ifAllowSkipNear: false, // 是否允许跳过靠近确权
    brand: '',
    dialogStyle: brandStyle.brandConfig.dialogStyle, //弹窗样式
    ishowBlueRes: false, //蓝牙权限弹窗
    bluePermissionTextAll: '', //蓝牙权限弹窗-内容
    sel: imgUrl + imgesList['sel'],
    noSel: imgUrl + imgesList['noSel'],
    noFoundImg: imgUrl + imgesList['noFound'],
    guideFlag: false,
    guideBlueRes: '',
    bigScreenBind: brandStyle.brandConfig.bigScreenBind,
  },

  computed: {
    currGuideInfo() {
      let { connectDesc, connectUrlA } = this.data.checkGuideInfo
      let currConnectDesc = connectDesc
      let currConnectUrl = connectUrlA
      return {
        currConnectDesc,
        currConnectUrl,
      }
    },
    showSwitchFlag() {
      return this.data.guideInfo.length > 1
    },
    isShowBleWifiguide() {
      let { blueVersion, mode, guideType, noFound } = this.data
      let res1 = false
      let res2 = false
      if (blueVersion != 1 && mode != 0 && mode != 5 && guideType == 'near' && !noFound) {
        res1 = true
      }
      if (mode == 20 && !noFound) {
        res2 = true
      }
      return res1 || res2
    },
  },
  switchSet() {
    const { guideIndex, guideInfo } = this.data
    const nextIndex = guideIndex < guideInfo.length - 1 ? guideIndex + 1 : 0
    this.setData({
      time: 60,
      guideIndex: nextIndex,
      ['checkGuideInfo.connectDesc']: this.guideDescFomat(guideInfo[nextIndex].connectDesc),
      ['checkGuideInfo.connectUrlA']: guideInfo[nextIndex].connectUrlA,
    })
    Toast(`已切换至第${nextIndex + 1}种方式`)
  },
  async initAddGuide() {
    let {
      isFromScanCode,
      moduleType,
      deviceName,
      type,
      sn8,
      deviceId,
      blueVersion,
      deviceImg,
      mode,
      fm, //无来源 默认扫码
      guideInfo, //配网指引
      ifNearby,
    } = app.addDeviceInfo
    let needTimingMode = [3, 5, 20, 21, 30]
    if (needTimingMode.includes(mode)) {
      clearTimeout(timer)
      console.log('蓝牙相关的配网方式才有----------------------------')
      //蓝牙相关的配网方式才有
      this.timing()
    }
    if (!deviceImg || !deviceName) {
      // 设备图片或名称缺失则补全
      let typeAndName
      if (fm === 'selectType') {
        typeAndName = this.getDeviceImgAndName(type)
      } else {
        typeAndName = this.getDeviceImgAndName(type, sn8)
      }
      if (!deviceImg) app.addDeviceInfo.deviceImg = typeAndName.deviceImg
      if (!deviceName) app.addDeviceInfo.deviceName = typeAndName.deviceName
    }
    console.log('mode===', mode)
    //设置连接方式
    app.addDeviceInfo.linkType = this.getLinkType(mode)
    this.readingGuideTiming() //开始阅读计时
    this.setData({
      deviceName: app.addDeviceInfo.deviceName,
      moduleType: moduleType,
      addDeviceInfo: app.addDeviceInfo,
      deviceImg: app.addDeviceInfo.deviceImg,
      mode: mode,
      isFromScanCode: isFromScanCode,
      blueVersion: blueVersion,
      guideInfo: guideInfo || [],
    })
    // app.globalData.bluetoothFail = !(await this.checkBluetoothAuth()) //蓝牙配网检查蓝牙是否开启以及是否蓝牙授权
    if (addDeviceSDK.bluetoothAuthModes.includes(mode)) {
      console.log('[需要校验蓝牙权限]')
      let isCanBlue = await this.checkBluetoothAuth()
      console.log('[是否可以使用蓝牙]', isCanBlue)
      if (!isCanBlue) {
        clearInterval(timer)
        // 修改没有开蓝牙时，靠近确权页会跑到配网指引页的问题
        if (
          fm === 'noActive' ||
          fm === 'nfc' ||
          isFromScanCode ||
          blueVersion == 1 ||
          mode == 0 ||
          (mode == 30 && fm != 'autoFound') ||
          mode == 5 ||
          mode == 9 ||
          mode == 10 ||
          mode == 100 ||
          mode == 103 ||
          (mode == 3 && !ifNearby)
        ) {
          this.setData({
            guideType: 'set',
          })
        }
        if ((mode == 3 && ifNearby) || mode == 20 || (mode == 30 && fm === 'autoFound')) {
          this.setData({
            guideType: 'near',
          })
        }
        return
      } else {
        app.globalData.bluetoothFail = false
      }
    }

    if (
      fm === 'noActive' ||
      fm === 'nfc' ||
      isFromScanCode ||
      blueVersion == 1 ||
      mode == 0 ||
      (mode == 30 && fm !== 'autoFound') ||
      mode == 5 ||
      mode == 9 ||
      mode == 10 ||
      mode == 100 ||
      mode == 103 ||
      (mode == 3 && !ifNearby)
    ) {
      this.setData({
        guideType: 'set',
      })
      console.log('fm=====', fm)
      this.getGuideFormat(guideInfo, fm) //获取指引格式化显示
      if (mode == 3 || mode == 5 || mode == 30) {
        //单蓝牙
        let scanObj = {
          mode: mode,
          type: type,
          sn8: sn8,
          fm: fm,
          checkSetConfig: true,
        }
        app.globalData.scanObj = scanObj
        console.log(app.globalData.scanObj)
        this.checkSetConfig(type, sn8, fm)
      }
      // todo: 暂时屏蔽蓝牙配网逻辑，接口不全
      // if (mode === 0 && fm !== 'autoFound' && !hadChangeBlue) {
      //   // AP配网非自发现入口，扫描蓝牙信号
      //   this.searchBlueByType(type, sn8, ssid).then((device) => {
      //     console.log('@module addGuide.js\n@method initAddGuide\n@desc 匹配到设备信息\n', device)
      //     wx.showModal({
      //       title: '',
      //       content: '搜索到设备蓝牙信号，可为您自动完成连接',
      //       cancelText: '取消',
      //       cancelColor: '#488FFF',
      //       confirmText: '自动连接',
      //       confirmColor: '#488FFF',
      //       success(res) {
      //         if (res.confirm) {
      //           // 转换为蓝牙配网
      //           app.addDeviceInfo.adData = device.adData
      //           app.addDeviceInfo.blueVersion = self.getBluetoothType(device.adData)
      //           app.addDeviceInfo.deviceId = device.deviceId
      //           app.addDeviceInfo.mac = self.getIosMac(device.advertisData)
      //           if (!app.addDeviceInfo.referenceRSSI) {
      //             app.addDeviceInfo.referenceRSSI = self.getReferenceRSSI(device.adData)
      //           }
      //           app.addDeviceInfo.sn8 = self.getBlueSn8(device.adData)
      //           app.addDeviceInfo.ssid = self.getBluetoothSSID(
      //             device.adData,
      //             app.addDeviceInfo.blueVersion,
      //             device.type,
      //             device.localName,
      //           )
      //           app.addDeviceInfo.mode = 3
      //           app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(3)
      //           app.addDeviceInfo.hadChangeBlue = true
      //           console.log('@module addGuide.js\n@method initAddGuide\n@desc 更新设备信息\n', app.addDeviceInfo)
      //           // 解析蓝牙功能状态
      //           const packInfo = getScanRespPackInfo(device.adData)
      //           console.log('@module addGuide.js\n@method initAddGuide\n@desc 蓝牙功能状态\n', packInfo)
      //           if (packInfo.isWifiCheck || packInfo.isBleCheck || packInfo.isCanSet) {
      //             // 设备已确权
      //             app.addDeviceInfo.isCheck = true
      //             wx.navigateTo({
      //               url: paths.linkDevice,
      //             })
      //           } else if (app.addDeviceInfo.blueVersion == 1) {
      //             // 一代蓝牙
      //             wx.navigateTo({
      //               url: paths.linkDevice,
      //             })
      //           } else {
      //             // 二代蓝牙
      //             app.addDeviceInfo.ifNearby = true
      //             wx.redirectTo({
      //               url: paths.addGuide,
      //             })
      //           }
      //         }
      //       },
      //     })
      //   })
      // }
    }
    if ((mode == 3 && ifNearby) || mode == 20 || (mode == 30 && fm === 'autoFound')) {
      if (mode == 3) app.addDeviceInfo.ifNearby = false
      this.setData({
        guideType: 'near',
      })
      await this.getNearbyParams()
      this.checkNearby(
        deviceId,
        app.addDeviceInfo.referenceRSSI,
        app.addDeviceInfo.downlinkThreshold,
        this.data.distance,
        true,
      ).then(() => {
        clearInterval(timer)
        wx.navigateTo({
          url: paths.linkDevice,
        })
      })
    }
  },
  /**
   * 获取靠近确权相关参数
   */
  async getNearbyParams() {
    this.setData({
      distance: '1.2',
    })
    app.addDeviceInfo.downlinkThreshold = -60
  },
  /**
   * 重试靠近确权
   */
  async retryCheckNearby() {
    const this_ = this
    if (this.retryClickFlag) return
    this.retryClickFlag = true
    this.timing()
    await this.getNearbyParams()
    this.checkNearby(
      app.addDeviceInfo.deviceId,
      app.addDeviceInfo.referenceRSSI,
      app.addDeviceInfo.downlinkThreshold,
      this.data.distance,
      true,
    )
      .then(() => {
        clearInterval(timer)
        wx.navigateTo({
          url: paths.linkDevice,
          complete() {
            this_.retryClickFlag = false
          },
        })
      })
      .catch(() => {
        this_.retryClickFlag = false
      })
  },
  getAddDeviceInfo() {},
  //获取指引格式化显示
  getGuideFormat(guideInfo) {
    let { type, sn8, mode } = app.addDeviceInfo
    //guideInfo 有可能为null, 逻辑都进不去，没有请求到配网指引，故添加 guideInfo是否存在的判断
    if (guideInfo && guideInfo.length !== 0) {
      //有提前获取的配网指引
      this.setData({
        ['checkGuideInfo.connectDesc']: this.guideDescFomat(guideInfo[0].connectDesc),
        ['checkGuideInfo.connectUrlA']: guideInfo[0].connectUrlA,
      })
    } else {
      this.queryGuideInfo(mode, type, sn8)
    }
  },
  //阅读指引计时
  readingGuideTiming() {
    let { readingTimer } = this.data
    const timer = setInterval(() => {
      if (readingTimer >= 0) {
        console.log('倒计时')
        this.setData({
          readingTimer: readingTimer--,
        })
      } else {
        clearInterval(timer)
      }
    }, 1000)
  },
  timing(time) {
    let self = this
    this.setData({
      time: time || 60,
    })
    timer = setInterval(() => {
      if (this.data.time > 0) {
        this.setData({
          time: this.data.time - 1,
        })
      }
      if (this.data.time == 0) {
        clearInterval(timer)
        if (this.data.guideType === 'near') {
          wx.offBluetoothDeviceFound()
          wx.stopBluetoothDevicesDiscovery()
          let page = getFullPageUrl()
          console.log('靠近确权============getFullPageUrl', page)
          if (page.includes('addDevice/pages/addGuide/addGuide')) {
            if (!this.data.ifAllowSkipNear) {
              // 不允许跳过
              wx.showModal({
                title: '未靠近设备',
                content: '请尝试重新靠近',
                cancelText: '退出',
                cancelColor: '#488FFF',
                confirmText: '重试',
                confirmColor: '#488FFF',
                success(res) {
                  if (res.confirm) {
                    // 重试
                    self.retryCheckNearby()
                  }
                },
              })
            } else {
              // 允许跳过
              wx.showModal({
                title: '未靠近设备',
                content: '你可以跳过该步骤，后续再通过操作设备进行验证',
                cancelText: '重试',
                cancelColor: '#488FFF',
                confirmText: '跳过',
                confirmColor: '#488FFF',
                success(res) {
                  if (res.confirm) {
                    //跳过
                    app.addDeviceInfo.isCheck = false
                    wx.navigateTo({
                      url: paths.linkDevice,
                    })
                  } else if (res.cancel) {
                    //重试
                    self.retryCheckNearby()
                  }
                },
              })
            }
          }
        }
        if (this.data.guideType === 'set') {
          this.setData({
            noFound: true,
          })
          if (this.data.mode == 3) {
            wx.offBluetoothDeviceFound()
            wx.stopBluetoothDevicesDiscovery()
          }
        }
      }
    }, 1000)
  },
  //勾选
  finish() {
    if (this.data.readingTimer > 0) {
      //未阅读完毕
      return
    }
    this.setData({
      isFinishUpAp: !this.data.isFinishUpAp,
    })
  },
  //ap完成手动确权
  async next() {
    let { mode, ssid, hadChangeBlue } = app.addDeviceInfo
    if (!this.data.isFinishUpAp) {
      showToast('请先勾选')
      return
    }
    if (hadChangeBlue && mode) {
      // AP转换蓝牙配网，配网进度页手势右滑返回时转回AP配网
      app.addDeviceInfo.mode = 0
      mode = 0
      app.addDeviceInfo.linkType = addDeviceSDK.getLinkType(0)
    }
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    if (mode == 0) {
      this.searchBlueStopTimeout && clearTimeout(this.searchBlueStopTimeout)
      //ap
      if (this.isCanDrivingLinkDeviceAp(ssid)) {
        wx.navigateTo({
          url: paths.linkAp,
        })
      } else {
        wx.navigateTo({
          url: paths.linkAp, //手动连接ap页
          events: {
            backFn: (backParams) => {
              console.log(backParams)
              if (backParams.backPath === 'linkAp' || backParams.backPath === 'linkNetFail') {
                //页面返回
                this.setData({
                  isFinishUpAp: false,
                })
              }
            },
          },
        })
      }
    }
  },
  async retry() {
    this.setData({
      noFound: false,
    })
    this.timing()
    app.globalData.bluetoothFail = !(await this.checkBluetoothAuth()) //蓝牙配网检查蓝牙是否开启以及是否蓝牙授权
    const { type, sn8, fm } = app.addDeviceInfo
    if (this.data.guideType === 'near') {
      this.checkNearby(
        app.addDeviceInfo.deviceId,
        app.addDeviceInfo.referenceRSSI,
        app.addDeviceInfo.downlinkThreshold,
        this.data.distance,
        true,
      ).then(() => {
        clearInterval(timer)
        wx.navigateTo({
          url: paths.linkDevice,
        })
      })
    } else {
      this.checkSetConfig(type, sn8, fm)
    }
  },
  //本地蓝牙跳转  储存
  async openPlugin() {
    let { type, A0, sn8, deviceName, deviceImg } = app.addDeviceInfo
    let typeFomat = type.includes('0x') ? type.toLocaleUpperCase() : '0x' + type.toLocaleUpperCase()
    let deviceInfo = {
      modelNumber: A0,
      name: deviceName,
      sn8,
      type: typeFomat,
      deviceImg,
      activeTime: addDeviceTime(new Date()),
      cardType: 'localBlue', //本地蓝牙
    }
    console.log('deviceInfo', deviceInfo)

    let localBlueDevices = wx.getStorageSync('localBlueDevices') || {}
    wx.setStorageSync('localBlueDevices', localBlueDevices)
  },

  async touchScanCode() {
    if (!this.data.isFinishUpAp) {
      return
    }
    //大屏这里是扫码按钮
    let { deviceName } = app.addDeviceInfo
    let scanResult = {}
    try {
      scanResult = await this.scanCode()
      console.log('scanResult==================:', scanResult)
    } catch (error) {
      console.log('扫码失败====', error)
      if (!error.errMsg.includes('fail cancel')) {
        //非主动取消扫码
        wx.showModal({
          title: '',
          content: '该二维码无法识别，请扫描设备屏幕二维码',
          confirmText: '我知道了',
          confirmColor: '#488FFF',
          showCancel: false,
          success() {},
        })
      }
      return
    }
    let scanCdoeResObj = addDeviceSDK.dynamicCodeAdd.getTouchScreenScanCodeInfo(scanResult.result)
    console.log('bigScreenScanCodeInfo=======', scanCdoeResObj)
    if (scanCdoeResObj.verificationCode && scanCdoeResObj.verificationCodeKey) {
      //有验证码信息
      app.addDeviceInfo.type = scanCdoeResObj.type.toUpperCase()
      app.addDeviceInfo.sn = scanCdoeResObj.sn
      app.addDeviceInfo.bigScreenScanCodeInfo = scanCdoeResObj

      wx.showModal({
        title: '',
        content: `你正在添加${deviceName},确定要继续吗？`,
        cancelText: '取消',
        cancelColor: '#488FFF',
        confirmText: '确定',
        confirmColor: '#488FFF',
        success(res) {
          if (res.confirm) {
            //确定
            wx.navigateTo({
              url: paths.linkDevice,
            })
          }
        },
      })
    } else {
      wx.showModal({
        title: '',
        content: '该二维码无法识别，请扫描设备屏幕二维码',
        confirmText: '我知道了',
        confirmColor: '#488FFF',
        showCancel: false,
      })
    }
  },
  //校验是否手动确权
  async checkSetConfig(type) {
    console.log('@module addGuide.js\n@method checkSetConfig\n@desc 手动确权品类\n', type)
    const self = this
    openAdapter()
      .then(() => {
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          powerLevel: 'low',
          interval: 500,
          success: (res) => {
            console.log('startBluetoothDevicesDiscovery success', res)
          },
        })
        //监听发现设备
        wx.onBluetoothDeviceFound((res) => {
          res.devices.forEach((device) => {
            // 品牌名校验
            const localName = device.localName || device.name || ''
            if (!brandStyle.brandConfig.apNameHeader.some((value) => localName.includes(value))) {
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
            // 校验是否已匹配成功
            if (self.data.curDeviceISCheck) {
              return
            }
            // 校验设备品类
            const typeAndSn8 = getDeviceCategoryAndSn8(device)
            if (typeAndSn8?.type !== type) {
              return
            }
            const deviceAds = ab2hex(device.advertisData) // ArrayBuffer转16进度字符串
            // 解析蓝牙功能状态
            const packInfo = getScanRespPackInfo(deviceAds)
            // 过滤已配网设备
            if (packInfo.isConfig || packInfo.isLinkWifi || packInfo.isBindble) {
              return
            }
            if (packInfo.isWifiCheck || packInfo.isBleCheck || packInfo.isCanSet) {
              console.log(
                '@module addGuide.js\n@method checkSetConfig\n@desc 手动确权成功\n',
                device,
                deviceAds,
                packInfo,
              )
              self.data.curDeviceISCheck = true
              wx.offBluetoothDeviceFound()
              wx.stopBluetoothDevicesDiscovery()
              app.addDeviceInfo.isFeature = packInfo.isFeature
              app.addDeviceInfo.adData = deviceAds
              app.addDeviceInfo.blueVersion = self.getBleVersion(device.advertisData)
              app.addDeviceInfo.deviceId = device.deviceId
              app.addDeviceInfo.mac = self.getIosMac(device.advertisData)
              app.addDeviceInfo.sn8 = self.getBlueSn8(deviceAds)
              app.addDeviceInfo.ssid = self.getBluetoothSSID(
                deviceAds,
                app.addDeviceInfo.blueVersion,
                typeAndSn8.type,
                device.localName,
              )
              app.addDeviceInfo.isCheck = true
              console.log('@module addGuide.js\n@method checkSetConfig\n@desc 确权成功设备信息\n', app.addDeviceInfo)
              clearInterval(timer)
              wx.navigateTo({
                url: paths.linkDevice,
              })
            }
          })
        })
      })
      .catch((error) => {
        console.log('打开蓝牙适配器失败', error)
      })
  },
  async queryGuideInfo(mode, type, sn8) {
    const res = await queryGuideInfo({ houseId: homeStore.currentHomeId, sn8, type, mode: mode.toString() })

    if (!res.success) {
      this.noGuide()
      return
    }

    const guideInfo = res.result

    if (guideInfo) {
      this.setData({
        ['checkGuideInfo.connectDesc']: this.guideDescFomat(guideInfo.mainConnectTypeDesc),
        ['checkGuideInfo.connectUrlA']: guideInfo.mainConnectTypeUrlList[0],
      })
    }
  },

  //获取设备图片
  getDeviceImg(type, sn8) {
    let dcpDeviceImgList = app.globalData.dcpDeviceImgList ? app.globalData.dcpDeviceImgList : {}
    if (dcpDeviceImgList[type]) {
      // console.log("找到了这个品类")
      if (dcpDeviceImgList[type][sn8]) {
        // console.log("找到对应的sn8")
        return dcpDeviceImgList[type][sn8]
      } else {
        return dcpDeviceImgList[type].common
      }
    } else {
      console.log('没找到', deviceImgMap)
      if (deviceImgMap[type] && deviceImgMap[type].onlineIcon) {
        return deviceImgApi.url + deviceImgMap[type].onlineIcon + '.png'
      } else {
        return deviceImgApi.url + 'blue_default_type.png'
      }
    }
  },

  async skipNear() {
    const this_ = this
    if (this.clickFlag) return
    this.clickFlag = true
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    app.addDeviceInfo.isCheck = false
    openAdapter()
      .then(() => {
        clearInterval(timer)
        console.log('跳过清除了定时器')
        wx.navigateTo({
          url: paths.linkDevice,
          complete() {
            this_.clickFLag = false
          },
        })
      })
      .catch(() => {
        this_.clickFlag = false
      })
  },

  getBleVersion(advertisData) {
    let str = ab2hex(advertisData).substr(4, 2)
    return str === '00' ? 1 : 2
  },

  //根据广播包获取mac
  getIosMac(advertisData) {
    advertisData = ab2hex(advertisData)
    console.log('getIosMacm advdata===', advertisData)
    let a = advertisData.substr(42, 12).toUpperCase()
    let b
    let arr = []
    for (let i = 0; i < a.length; i += 2) {
      arr.push(a.substr(i, 2))
    }
    b = arr.reverse().join(':')
    return b
  },
  //蓝牙配网检查蓝牙是否授权以及是否打开蓝牙
  async checkBluetoothAuth() {
    let blueRes = await checkPermission.blue()
    this.data.guideBlueRes = blueRes
    console.log('[blueRes]', blueRes)
    if (!blueRes.isCanBlue) {
      this.setData({
        ishowBlueRes: true,
        bluePermissionTextAll: blueRes.permissionTextAll,
      })
      return false
    }
    return true
  },

  closeBlueRes() {
    this.setData({
      ishowBlueRes: false,
    })
  },

  async makeSure(e) {
    e = e.detail
    console.log('kkkkkkkkk', e)
    if (e.flag === 'bottomBtn') {
      if (e.type === 'confirm') {
        this.initAddGuide()
      }
      if (e.type === 'cancel') {
        wx.switchTab({
          url: paths.index,
        })
      }
    }
  },
  //查看指引
  clickLink(e) {
    console.log('[clich Link]', e)
    e = e.detail
    if (e.flag === 'lookGuide') {
      if (e.type === 'blue') {
        wx.navigateTo({
          url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(e.permissionTypeList)}`,
        })
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.data.brand = brandStyle.brand
    this.setData({
      brand: this.data.brand,
    })
    console.log('adddeviceinfo===', app.addDeviceInfo)
    this.initAddGuide()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('页面返回清除了定时器')
    this.searchBlueStopTimeout && clearTimeout(this.searchBlueStopTimeout)
    wx.offBluetoothDeviceFound()
    wx.stopBluetoothDevicesDiscovery()
    clearInterval(timer)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('下拉刷新======')
    let { mode, guideInfo, fm } = app.addDeviceInfo
    let needRefreshMode = [0, 9, 10, 100]
    if (needRefreshMode.includes(Number(mode))) {
      this.setData({
        ['checkGuideInfo.connectDesc']: '',
        ['checkGuideInfo.connectUrlA']: '',
      })
      setTimeout(() => {
        this.getGuideFormat(guideInfo, fm)
      }, 1000)
      console.log('getGuideFormat========')
    }
    wx.stopPullDownRefresh()
  },

  goHome() {
    wx.switchTab({
      url: paths.index,
    })
  },

  hasFinish() {
    this.initAddGuide()
  },

  async checkGuide() {
    if (this.data.guideFlag) return
    this.data.guideFlag = true
    let blueRes = this.data.guideBlueRes
    wx.navigateTo({
      url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(blueRes.permissionTypeList)}`,
    })
    setTimeout(() => {
      this.data.guideFlag = false
    }, 1000)
  },

  iseeBtn() {
    if (!this.data.isFinishUpAp) {
      showToast('请先勾选')
      return
    }
    wx.reLaunch({
      url: paths.index,
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
