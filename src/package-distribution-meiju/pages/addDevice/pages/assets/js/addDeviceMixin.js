/* eslint-disable @typescript-eslint/no-this-alias */
import { checkApExists, queryAuthGetStatus } from '../../../../../../apis/index'
import { Logger } from '../../../../../../utils/index'
import { homeStore } from '../../../../../../store/index'

import { showToast } from '../../../../../utils/util'
import { creatErrorCode, failTextData } from './errorCode'
import paths from '../../../../../utils/paths'
import app from '../../../../../common/app'
import { imgBaseUrl } from '../../../../../common/js/api'

// eslint-disable-next-line no-undef
module.exports = Behavior({
  behaviors: [],
  properties: {},
  data: {
    // deviceInfo: '',
    isIpx: app.globalData.isPx,
    imgBaseUrl: imgBaseUrl.url,
    imges: {
      meiPhone: '/addDeviceAboutImg/ic_meiphone@1x.png',
      zhuyi: '/addDeviceAboutImg/link_ic_zhuyi.png',
      nearby: '/addDeviceAboutImg/kaojinshebei.png',
      blueCD: '/addDeviceAboutImg/blue_cd.png',

      successRight: '/addDeviceAboutImg/succeed_icon_right.png',
      right: '/addDeviceAboutImg/right.png',

      wifiConnect: '/addDeviceAboutImg/wifi_ic_img_connect.png',
      wifiShow: '/addDeviceAboutImg/WiFi_ic_kejian.png',
      wifiHide: '/addDeviceAboutImg/wifi_ic_bukejian.png',

      loading: '/addDeviceAboutImg/loading_spot.png',
      linkCheck: '/addDeviceAboutImg//link_ic_checked.png',
      linkLoading: '/addDeviceAboutImg/link_ic_loading.png',

      fail: '/addDeviceAboutImg/shibai_icon_shibai.png',

      linkGuide: '/addDeviceAboutImg/wifi_img_lianjiezhiyin.png',
      noSel: '/addDeviceAboutImg/btn_off@3x.png',
      sel: '/addDeviceAboutImg/btn_on@3x.png',

      psw: '/addDeviceAboutImg/ic_mima@3x.png',
      wifi: '/addDeviceAboutImg/ic_wifi@3x.png',
      apName: '/addDeviceAboutImg/wifi_img_guide@3x.png',
      noFound: '/addDeviceAboutImg/img_no found shebei.png',

      //找不到wifi弹窗相关
      closeImg: '/addDeviceAboutImg/pop_ic_close@1x.png',
      noFoundApDiscover: '/addDeviceAboutImg/no_found_ap_discover@2x.png',
      noFoundApSwitch: '/addDeviceAboutImg/no_found_ap_WiFi_switch@2x.png',

      noLocation: '/addDeviceAboutImg/img_no_location@3x.png',

      questino: '/addDeviceAboutImg/ic_2.4GHzremind@3x.png',

      //输入wifi页相关
      refresh: '/addDeviceAboutImg/list_ic_refresh@3x.png',
      wifiSignalStrength1: '/addDeviceAboutImg/ic_wifi@3x.png',
      wifiSignalStrength2: '/addDeviceAboutImg/smart_wifi_01@3x.png',
      wifiSignalStrength3: '/addDeviceAboutImg/smart_wifi_02@3x.png',
      wifiSignalStrength4: '/addDeviceAboutImg/smart_wifi_03@3x.png',

      noWifiList: '/addDeviceAboutImg/img_no home@3x.png',

      //linkAp
      linkDeviceWifiMidea: '/addDeviceAboutImg/Midea_iOS.gif',
      linkDeviceWifiMidea_new: '/addDeviceAboutImg/link_Device_wifi_midea.png',
      android_ApName: '/addDeviceAboutImg/Midea_android.gif',
      android_ApName_new: '/addDeviceAboutImg/android_guidance.png',
      android_linkDeviceWifiBugu: '/addDeviceAboutImg/bugu_Android.gif',
      linkDeviceWifiBugu: '/addDeviceAboutImg/bugu_iOS.gif',
      detailPackUp: '/addDeviceAboutImg/ic_zhankai@3x.png',
      detailExpand: '/addDeviceAboutImg/ic_shouqi@3x.png',
      detailStep2: '/addDeviceAboutImg/img_step2@3x.png',
      detailStep3: '/addDeviceAboutImg/img_step3@3x.png',
      detailStep4: '/addDeviceAboutImg/img_step4@3x.png',
      detailStep4_1: '/addDeviceAboutImg/img_step4_1@2x.png',
      detailStep5: '/addDeviceAboutImg/img_step5@2x.png',
      android_step1: '/addDeviceAboutImg/img_Android_step1@2x.png',
      android_step2: '/addDeviceAboutImg/img_Android_step2@2x.png',
      android_step3: '/addDeviceAboutImg/img_Android_step3@2x.png',
    },
    isStopGetExists: false, //是否停止查询设备已连上云
    isStartwifi: false, //是否初始化了wifi模块
    failTextData: failTextData,
    isStopLinkWifi: false,
  },
  methods: {
    //数码管字体替换图片
    replaceInco(guideDesc) {
      let list = ['#AP#', '#00#', '#0A#', '#0L#', '#01#', '#02#']
      let imgList = [
        'code_ap@3x.png',
        'code_00@3x.png',
        'code_0a@3x.png',
        'code_0l@3x.png',
        'code_01@3x.png',
        'code_02@3x.png',
      ]
      for (let i = 0; i <= list.length - 1; i++) {
        if (guideDesc.includes(list[i])) {
          let imgUrl = imgBaseUrl.url + '/shareImg/' + app.globalData.brand + '/' + imgList[i]
          let content = ' <img class="nixie-tube" src=' + imgUrl + '></img> '
          guideDesc = guideDesc.replaceAll(list[i], content)
        }
      }
      return guideDesc
    },
    //校验手机系统版本
    checkPhoneSystemVerion(version = '14.0.0') {
      let phoneSystemVersion = app.globalData.systemInfo.system.split(' ')[1]
      let phoneSystemVersionArr = phoneSystemVersion.split('.')
      let paramsVersionArr = version.split('.')
      console.log('[phoneSystemVersion]', phoneSystemVersionArr, paramsVersionArr)
      if (Number(paramsVersionArr[0]) < phoneSystemVersionArr[0]) {
        return true
      }

      if (
        Number(paramsVersionArr[0]) === Number(phoneSystemVersionArr[0]) &&
        Number(paramsVersionArr[1]) < Number(phoneSystemVersionArr[1])
      ) {
        return true
      }

      return (
        Number(paramsVersionArr[0]) === Number(phoneSystemVersionArr[0]) &&
        Number(paramsVersionArr[1]) === Number(phoneSystemVersionArr[1]) &&
        Number(paramsVersionArr[2]) < Number(phoneSystemVersionArr[2])
      )
    },
    //延迟函数
    delay(milSec) {
      return new Promise((resolve) => {
        setTimeout(resolve, milSec)
      })
    },
    //异步延迟函数
    async delayAwait(milSec) {
      await new Promise((resolve) => setTimeout(resolve, milSec))
    },
    //获取当前ip地址
    getLocalIPAddress() {
      return new Promise((resolve, reject) => {
        if (!wx.canIUse('getLocalIPAddress')) {
          console.log('不支持获取ip')
          resolve(null)
          return
        }
        wx.getLocalIPAddress({
          success(res) {
            // const localip = res.localip
            resolve(res)
          },
          fail(error) {
            console.log('获取ip失败================', error)
            reject(error)
          },
        })
      })
    },
    /**
     * 尝试连接wifi
     * @param {*} wifiInfo      wifi信息
     * @param {*} frequency     频率            秒
     * @param {*} callBack      成功
     * @param {*} callBack      失败
     */
    async tryConectWifi(wifiInfo, frequency = 2, callBack, callFail) {
      let { ssid, password, isGoSet } = wifiInfo
      if (!this.data.isSuccessLinkDeviceAp && !this.data.isStopLinkWifi) {
        try {
          await this.connectWifi(ssid, password, isGoSet)
          this.data.isSuccessLinkDeviceAp = true
          callBack && callBack()
        } catch (error) {
          console.log('tryConectWifi error', error)
          if (this.data.isStopLinkWifi) return
          setTimeout(() => {
            this.tryConectWifi(wifiInfo, (frequency = 2), callBack, callFail)
          }, frequency * 1000)
        }
      }
    },
    /**
     * 连接wifi
     * @param {*} SSID          wifi ssid
     * @param {*} password      密码
     * @param {*} isGoSet       是否跳转到设置页
     */
    connectWifi(SSID, password, isGoSet = false) {
      console.log('driving link  wifi', SSID, password)
      return new Promise((resolve, reject) => {
        wx.startWifi({
          success(resp) {
            console.log('startWifi', resp)
            wx.connectWifi({
              SSID: SSID,
              password: password,
              maunal: isGoSet, //是否去设置页连接
              // forceNewApi: true, //使用原生连接wifi方法
              success(res) {
                console.log('主动连接wifi成功', res)
                resolve(res)
              },
              fail(error) {
                console.log('driving link wifi error', error)
                reject(error)
              },
            })
          },
        })
      })
    },
    //是否可以主动连接设备ap
    isCanDrivingLinkDeviceAp(ssid) {
      let res = wx.getSystemInfoSync()
      return res.system.includes('Android') || ssid
    },
    //获取系统信息
    wxGetSystemInfo() {
      return new Promise((resolve) => {
        wx.getSystemInfo({
          success(res) {
            resolve(res)
          },
        })
      })
    },
    //获得连接方式
    getLinkType(mode) {
      let linkType = ''
      if (mode == 0) {
        linkType = 'ap'
      }
      if (mode == 3 || mode == 5) {
        linkType = 'bluetooth'
      }
      if (mode == 31) {
        linkType = '蓝牙直连后wifi配网'
      }
      if (mode == 9 || mode == 10) {
        linkType = '本地蓝牙直连'
      }
      return linkType
    },
    //查询设备是否连上云
    async checkApExists(sn, forceValidRandomCode, randomCode = '') {
      const res = await checkApExists({
        houseId: homeStore.currentHomeId,
        sn,
        randomCode,
        forceValidRandomCode,
      }).catch((error) => {
        console.log('查询设备是否连上云 error', error)
        if (error.data) {
          app.addDeviceInfo.errorCode = this.creatErrorCode({
            errorCode: error.data.code,
            isCustom: true,
          })
        }
        if (app.addDeviceInfo && app.addDeviceInfo.mode === 0) {
          //
          if (error.data && error.data.code === 1384) {
            //随机数校验不一致
            app.addDeviceInfo.errorCode = this.creatErrorCode({
              errorCode: 4169,
              isCustom: true,
            })
          }
        }
      })

      console.log('查询设备是否连上云res', res)

      return res
    },
    //新 轮询查询设备是否连上云
    newAgainGetAPExists(sn, forceValidRandomCode, randomCode = '', timeout, callBack, callFail) {
      let timeoutID
      const timeoutPromise = new Promise((resolve) => {
        timeoutID = setTimeout(resolve, 5000, { success: false, msg: 'WEB TIMEOUT' })
      })
      Promise.race([timeoutPromise, this.checkApExists(sn, forceValidRandomCode, randomCode, timeout)])
        .then((resp) => {
          Logger.console('查询设备是否连上云', resp)
          if (resp.success && resp.result.applianceList?.length) {
            callBack && callBack(resp.result.applianceList[0])
          } else {
            console.log('设备未连上云', 'this.data.isStopGetExists', this.data.isStopGetExists)
            if (this.data.isStopGetExists) return
            if (resp.success) {
              setTimeout(() => {
                this.newAgainGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
              }, 3000)
            } else {
              Logger.console('请求超时', resp)
              let time = 5000
              if (
                (resp.errMsg && resp.errMsg.includes('ERR_NAME_NOT_RESOLVED')) ||
                (resp.errMsg && resp.errMsg.includes('ERR_CONNECTION_ABORTED'))
              ) {
                Logger.console('ERR_NAME_NOT_RESOLVED', resp)
                time = 7000
              }
              setTimeout(() => {
                this.newAgainGetAPExists(sn, forceValidRandomCode, randomCode, timeout, callBack, callFail)
              }, time)
              callFail && callFail(resp)
            }
          }
        })
        .finally(() => clearTimeout(timeoutID))
    },
    //轮询查询设备是否连上云
    againGetAPExists(sn, randomCode = '', callBack, callFail) {
      console.log('this.data.isStopGetExists===', this.data.isStopGetExists)
      this.checkApExists(sn, !!randomCode, randomCode)
        .then((resp) => {
          console.log('查询设备是否连上云', resp)
          if (resp.success && resp.result.available) {
            console.log('resolve------------')
            callBack && callBack(resp.result)
          } else {
            if (!this.data.isStopGetExists) {
              setTimeout(() => {
                this.againGetAPExists(sn, randomCode, callBack, callFail)
              }, 2000)
            }
          }
        })
        .catch(() => {
          if (!this.data.isStopGetExists) {
            setTimeout(() => {
              this.againGetAPExists(sn, randomCode, callBack, callFail)
            }, 2000)
          }
        })
    },
    //未配置指引统一处理
    noGuide() {
      wx.showModal({
        content: '获取不到设备操作指引',
        showCancel: false,
        confirmText: '我知道了',
        success(res) {
          if (res.confirm) {
            wx.reLaunch({
              url: paths.index,
            })
          }
        },
      })
    },
    //根据企业码返回企业热点名
    getBrandBname() {
      return 'midea'
    },
    //生成错误码
    creatErrorCode({ platform, module, errorCode, isCustom }) {
      return creatErrorCode({
        platform,
        module,
        errorCode,
        isCustom,
      })
    },
    //当前手机网络状态
    nowNetType() {
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
    //初始化wifi，模块
    startWifi() {
      let self = this
      return new Promise((resolve, reject) => {
        if (self.data.isStartwifi) {
          resolve()
        } else {
          wx.startWifi({
            success: () => {
              self.data.isStartwifi = true
              resolve()
            },
            fail() {
              reject()
            },
          })
        }
      })
    },

    /**
     * 切换wifi
     * @param {Boolean} iOSReConfirm iOS二次确认弹窗
     */
    switchWifi(iOSReConfirm = true) {
      this.data.isSwitchWifi = true
      const res = wx.getSystemInfoSync()
      if (res.system.includes('Android')) {
        // 直接跳转
        this.jumpSystemSetting()
      }
      if (res.system.includes('iOS')) {
        if (iOSReConfirm) {
          // 展示二次确认弹窗
          const self = this
          wx.showModal({
            content: '请到手机设置连接家庭Wi-Fi，连接后返回本页面',
            cancelText: '暂不设置',
            cancelColor: '#999',
            confirmText: '立即前往',
            confirmColor: '#458BFF',
            success(res) {
              if (res.confirm) {
                self.jumpSystemSetting()
              }
            },
          })
        } else {
          // 直接跳转
          this.jumpSystemSetting()
        }
      }
    },
    /**
     * 跳转系统设置页
     */
    jumpSystemSetting() {
      wx.startWifi({
        success(res) {
          console.log('调用微信接口wx.startWifi成功', res)
          wx.connectWifi({
            SSID: '',
            password: '',
            maunal: true, // 是否去设置页连接
            success(res) {
              console.log('调用微信接口wx.connectWifi跳转设置页成功', res)
            },
            fail(error) {
              if (error.errCode == 12005) {
                showToast('请先打开手机WiFi')
              }
              console.log('调用微信接口wx.connectWifi跳转设置页失败', error)
            },
          })
        },
        fail(error) {
          console.log('调用微信接口wx.startWifi失败', error)
        },
      })
    },

    //指引文案格式化显示
    guideDescFomat(guideDesc) {
      guideDesc = guideDesc.replaceAll('<', '&lt;') //<转为&lt; 才能在微信rich-text组件显示
      guideDesc = guideDesc.replaceAll('>', '&gt;') //>转为&lt; 才能在微信rich-text组件显示
      guideDesc = guideDesc.replace(/\n/g, '<br/>') //换行
      guideDesc = guideDesc.replace(/「(.+?)」/g, '<span class="orange-display-txt">$1</span>') //标澄
      guideDesc = this.replaceInco(guideDesc)
      guideDesc = guideDesc.replace(/#([a-zA-Z0-9_-]+?)#/g, '<span class="orange-display-txt digitalFont"> $1 </span>') //数码管字体
      return guideDesc
    },

    //扫码
    scanCode() {
      return new Promise((resolve, reject) => {
        wx.scanCode({
          success(res) {
            console.log('扫码=====', res)
            // resolve(res.result)
            resolve(res)
          },
          fail(error) {
            console.log('扫码失败返回', error)
            reject(error)
          },
          complete() {},
        })
      })
    },
    /**
     * 补位
     * 1
     * len 2
     * return hex 01
     */
    padLen(str, len) {
      let temp = str
      let strLen = (str + '').length
      if (strLen < len) {
        for (let i = 0; i < len - strLen; i++) {
          temp = '0' + temp
        }
      }
      return temp
    },

    /**
     * 查询确权
     * @param {*} applianceCode
     * @returns
     */
    async getApplianceAuthType(applianceCode) {
      Logger.console('addDeviceMixin.js,  getApplianceAuthType')
      const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId: applianceCode })

      return res
    },
  },
})
