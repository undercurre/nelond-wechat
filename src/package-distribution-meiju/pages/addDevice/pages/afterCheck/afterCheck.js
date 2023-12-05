/* eslint-disable @typescript-eslint/no-var-requires */
import app from '../../../../common/app'
const netWordMixin = require('../../../assets/js/netWordMixin')
const addDeviceMixin = require('../assets/js/addDeviceMixin')

import { requestService } from '../../../../utils/requestService'
import { getPluginUrl } from '../../../../utils/getPluginUrl'
import { getReqId, getStamp } from 'm-utilsdk/index'
import { getFullPageUrl } from '../../../../utils/util'
import { goTopluginPage, isSupportPlugin } from '../../../../utils/pluginFilter'
import paths from '../../../../utils/paths'
import { typesPreserveAfterCheckGuideByA0 } from '../../config/index'
import Dialog from '../../../../../miniprogram_npm/m-ui/mx-dialog/dialog'
import { brand } from '../../../assets/js/brand'

let timer

Page({
  behaviors: [addDeviceMixin, netWordMixin],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '',
    time: Number,
    deviceInfo: '',
    isStopCheck: false,
    backTo: '',
    checkGuideInfo: {
      mainConnectTypeUrl: '',
      mainConnectTypeDesc: '',
    },
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight'], //顶部状态栏的高度
    randomCode: '', // 组合配网携带参数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.data.brand = brand
    this.setData({
      brand: this.data.brand,
    })
    if (options.backTo) {
      this.setData({
        backTo: options.backTo,
      })
    }
    if (options.randomCode) {
      this.setData({
        randomCode: options.randomCode, // 组合配网新增
      })
    }
    this.data.randomCode = options.randomCode || app.addDeviceInfo.randomCode || ''
    console.warn('afterCheck randomCode---', this.data.randomCode)
    // 组合配网新增逻辑
    let applianceCode, deviceInfo, type, deviceName, A0
    if (app.addDeviceInfo.cloudBackDeviceInfo) {
      deviceInfo = app && app.addDeviceInfo.cloudBackDeviceInfo
      applianceCode = app.addDeviceInfo.cloudBackDeviceInfo.applianceCode
      deviceName = app.addDeviceInfo.cloudBackDeviceInfo.deviceName
        ? app.addDeviceInfo.cloudBackDeviceInfo.deviceName
        : app.addDeviceInfo.cloudBackDeviceInfo.name
      type = app.addDeviceInfo.cloudBackDeviceInfo.type
      A0 = app.addDeviceInfo.cloudBackDeviceInfo.modelNumber ? app.addDeviceInfo.cloudBackDeviceInfo.modelNumber : ''
    } else {
      deviceInfo = app.addDeviceInfo
      applianceCode = app.addDeviceInfo.applianceCode
      deviceName = app.addDeviceInfo.deviceName
      type = app.addDeviceInfo.type
      A0 = ''
    }
    let sn8 = app.addDeviceInfo.sn8 ? app.addDeviceInfo.sn8 : app.addDeviceInfo.cloudBackDeviceInfo.sn8

    console.log('options---', options)
    console.log('后确权addDeviceinfo====', deviceInfo)
    this.timing()
    this.getGuideInfo(type, sn8, A0)
    this.setData({
      deviceName: deviceName,
    })

    if (applianceCode) {
      let ApplianceAuthTypeResp = await this.getApplianceAuthType(applianceCode)
      console.log('ApplianceAuthTypeResp', ApplianceAuthTypeResp)
      const status = ApplianceAuthTypeResp.data.data.status
      if (status == 0) {
        console.log('后确权成功')
        clearInterval(timer)
        // 组合配网新增跳转
        app.addDeviceInfo.status = status // 组合设备更新确权状态
        let { combinedDeviceFlag } = app.addDeviceInfo // combinedDeviceFlag在首页会置为false
        if (combinedDeviceFlag) {
          wx.reLaunch({
            url: `${paths.linkCombinedDevice}?randomCode=${this.data.randomCode}`,
          })
        } else {
          wx.navigateTo({
            url: getPluginUrl(type) + '?backTo=/pages/index/index&deviceInfo=' + deviceInfo,
            fail(error) {
              let page = getFullPageUrl()
              if (!page.includes('addDevice/pages/afterCheck/afterCheck')) {
                return
              }
              Dialog.confirm({
                title: '无法跳转设备控制页面',
                message: '未获取到控制页面，请检查网络后重试，若仍无法获取，请联系客服',
                confirmButtonText: '返回首页',
                showCancelButton: false,
              }).then((res) => {
                if (res.action == 'confirm') {
                  wx.reLaunch({
                    url: paths.index,
                  })
                }
              })
            },
          })
        }
      }
      if (status > 0) {
        // 兼容status=1,2,3的情况，等于3当做未确权处理(组合配网新增)
        //未确权
        console.log(`${status == 3 ? '不支持确权' : '未确权'}`)
        await this.applianceAuthConfirm(applianceCode) //进入待确权
        this.sleep(10000).then((end) => {
          //新增10秒后在开始查询
          this.checkApplianceAuth(applianceCode, type, sn8, deviceInfo)
        })
      }
    }
  },

  getGuideInfo(type, sn8, A0, enterprise = '0000') {
    type = type.includes('0x') ? type.substr(2, 2) : type
    let code = sn8
    console.log('@module afterCheck.js\n@method getGuideInfo\n@desc 设备品类信息\n', { type, sn8, A0 })
    // 部分品类使用A0获取后确权指引
    if (typesPreserveAfterCheckGuideByA0.includes(type) && A0) {
      console.log('@module afterCheck.js\n@method getGuideInfo\n@desc 使用A0获取后确权指引\n', { type, A0 })
      code = A0
    }
    let reqData = {
      category: type,
      code: code,
      enterprise: enterprise,
    }
    console.log('reqDasta====', reqData)
    requestService
      .request('getIotConfirmInfoV2', reqData)
      .then((resp) => {
        console.log('确权指引信息', resp.data.data)
        if (!resp.data.data.confirmDesc && !resp.data.data.confirmImgUrl) {
          //未配置确权指引
          this.noGuide()
          return
        }
        this.setData({
          ['checkGuideInfo.mainConnectTypeDesc']: this.guideDescFomat(resp.data.data.confirmDesc),
          ['checkGuideInfo.mainConnectTypeUrl']: resp.data.data.confirmImgUrl,
        })
      })
      .catch((error) => {
        console.log(error)
        if (error.data.code == 1) {
          this.noGuide()
        }
      })
  },

  timing() {
    this.data.time = 60
    timer = setInterval(() => {
      if (this.data.time > 0) {
        this.setData({
          time: this.data.time - 1,
        })
      }
      if (this.data.time == 0) {
        clearInterval(timer)
        wx.redirectTo({
          url: '/package-distribution-meiju/pages/addDevice/pages/authTimeout/authTimeout',
        })
      }
    }, 1000)
  },

  //进入待确权
  applianceAuthConfirm(applianceCode) {
    let reqData = {
      applianceCode: applianceCode,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('applianceAuthConfirm', reqData)
        .then((resp) => {
          console.log('进入待确权')
          resolve(resp)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  //校验是否完成后确权
  checkApplianceAuth(applianceCode, type, sn8, deviceInfo) {
    this.getApplianceAuthType(applianceCode).then((resp2) => {
      if (resp2.data.data.status == 0) {
        console.log('后确权成功：', resp2)
        clearInterval(timer)
        // 组合配网新增跳转
        app.addDeviceInfo.status = resp2.data.data.status // 组合设备更新确权状态
        let { combinedDeviceFlag } = app.addDeviceInfo // combinedDeviceFlag在首页会置为false
        if (combinedDeviceFlag) {
          wx.reLaunch({
            url: `${paths.linkCombinedDevice}?randomCode=${this.data.randomCode}`,
          })
        } else {
          let type = app.addDeviceInfo.cloudBackDeviceInfo.type
          let A0 = app.addDeviceInfo.cloudBackDeviceInfo.modelNumber
            ? app.addDeviceInfo.cloudBackDeviceInfo.modelNumber
            : ''
          if (!isSupportPlugin(type, sn8, A0)) {
            //不支持
            wx.reLaunch({
              url: '/pages/unSupportDevice/unSupportDevice?deviceInfo=' + encodeURIComponent(deviceInfo),
            })
            return
          }
          goTopluginPage(app.addDeviceInfo.cloudBackDeviceInfo, '/pages/index/index', true, 'afterCheck')
        }
      } else {
        if (this.data.time != 0 && !this.data.isStopCheck) {
          this.sleep(5000).then((end) => {
            this.checkApplianceAuth(applianceCode, type, sn8, deviceInfo)
          })
        }
      }
    })
  },
  sleep(milSec) {
    return new Promise((resolve) => {
      setTimeout(resolve, milSec)
    })
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
    clearInterval(timer)
    this.data.isStopCheck = true
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},
})
