/* eslint-disable @typescript-eslint/no-this-alias */
import { requestService } from '../../utils/requestService'
import { getSnTicket } from './deviceSubscribe.js'
import {
  getStamp,
  getReqId,
  hasKey,
  isEmptyObject,
  wxCardAesEncrypt,
  aesDecrypt,
  urlParamsJoin,
  cloneDeep,
} from 'm-utilsdk/index'
import { showToast } from '../../utils/util'
import { checkCanIUserWxApi } from '../../utils/wx/utils.js'
import config from '../js/config.js'

import app from '../app'
const wxList = {
  config: {
    launch_source: 'click_wechat_device_card',
  },
  modelIdMap(type) {
    const map = {
      '0xAC': 'flu0BqiKL5EPaA2rcO3NAQ', //空调
      '0xFA': 'Ccvb6Mbr9z_WnnJWiuHwjg', //风扇
    }
    return map[type]
  },
  /**
   * 获取授权接口-事业部插件调用
   * @param {Object} params
   *  * 例：
   *  {
   *     deviceInfo: 设备信息
   *     path: `/plugin/T0xAC/index/index 点击卡片跳转路径
   *     envVersion: '', develop-开发版 trial-体验版 release-线上
   *  }
   * @return void
   */
  async addWxList(params) {
    console.log('调用addWxList微信授权框的参数', params)
    const deviceInfo = this.getPlainDeviceInfo(params) //获取明文设备信息
    const modelId = this.modelIdMap(deviceInfo.type) //根据映射表获取modelId
    const sn = deviceInfo.sn
    const applianceCode = deviceInfo.applianceCode
    const encryptApplianceCode = this.getEncryptApplianceCode(applianceCode)
    this.componentWxListTrack('user_behavior_event', 'click_add', deviceInfo)
    const snTicket = await getSnTicket(modelId, encryptApplianceCode)
    const customData = this.getCustomData(modelId, sn, deviceInfo)
    const envVersion = params?.envVersion
    return this.actionWxDevicePanel(snTicket, modelId, params, deviceInfo, customData, envVersion, encryptApplianceCode)
  },
  /**
   * 删除设备绑定接口-事业部插件调用
   * @param {Object} params
   * 例：
   *  {
   *     deviceInfo: 设备信息
   *  }
   * @return void
   */
  async delWxList(params) {
    console.log('调用delWxList微信授权框的参数', params)
    const deviceInfo = this.getPlainDeviceInfo(params)
    console.log('解析出来的deviceInfo：', deviceInfo)
    const modelId = this.modelIdMap(deviceInfo.type)
    const sn = deviceInfo.sn
    const applianceCode = deviceInfo.applianceCode
    const encryptApplianceCode = this.getEncryptApplianceCode(applianceCode)
    this.componentWxListTrack('user_behavior_event', 'click_del', deviceInfo)
    const snTicket = await getSnTicket(modelId, encryptApplianceCode)
    const customData = this.getCustomData(modelId, sn, deviceInfo) // 保存接口和删除接口传参
    console.log('delWxList 各项参数：', snTicket, modelId, params, deviceInfo, customData, sn)
    return this.actionDelWxDevicePanel(snTicket, modelId, deviceInfo, customData, encryptApplianceCode)
  },
  /**
   * 查询设备是否已经添加为设备卡片接口-事业部插件调用
   * @param {Object} data
   * 例：
   *  {
   *     applianceCode: '', // 必填 设备编码
   *     reqId: getReqId(), // 非必填 请求id
   *     stamp: getStamp(), // 非必填 时间戳
   *  }
   * @returns {Promise}
   */
  wxSearchBindStatus(data) {
    return new Promise((resolve, reject) => {
      if (!data?.applianceCode) {
        reject('未传入必填参数')
      }
      const encryptApplianceCode = this.getEncryptApplianceCode(data.applianceCode)
      const reqData = {
        wxAccessToken: app.globalData.wxAccessToken,
        applianceCode: encryptApplianceCode,
        reqId: data?.reqId || getReqId(),
        stamp: data?.stamp || getStamp(),
      }
      requestService.request('wxSearchBindStatus', reqData).then(
        (resp) => {
          console.log('查询设备状态接口的传参：', reqData)
          console.log('查询设备状态接口的返回：', resp.data.data)
          resolve(resp.data.data || {})
        },
        (error) => {
          console.log('查询设备状态接口的传参：', error)
          console.log('查询设备状态接口失败的返回', error)
          reject(error)
        },
      )
    })
  },
  /**
   * 查询当前基础库是否支持设备卡片接口-事业部插件调用
   * @returns {Boolean} true - 支持 false - 不支持
   */
  wxCheckCanIUseAddDevicePanel() {
    return new Promise((resolve) => {
      resolve(false)
    })
  },
  /**
   * 查询当前基础库是否支持设备卡片接口-事业部插件调用
   * @returns {Boolean} true - 支持 false - 不支持
   */
  wxCheckCanIUseBatchAddDevicePanel() {
    return new Promise((resolve) => {
      this.checkIsInWhiteList()
        .then((res) => {
          console.log(res, 'checkIsInWhiteList')
          if (!res?.data?.isAllow) {
            resolve(false)
            return
          }
          const canIUseBatchAddDevicePanel = checkCanIUserWxApi('batchAddDevicePanel', false)
          const canIUseDevicePanel = app.globalData.canIUseDevicePanel
          const canIUseDevicePanelHasSaved = canIUseDevicePanel !== null && canIUseDevicePanel !== undefined
          console.log(
            canIUseDevicePanelHasSaved,
            canIUseDevicePanel,
            'canIUseDevicePanel canIUseDevicePanelHasSaved wxBatchAddDevicePanel',
          )
          if (canIUseDevicePanelHasSaved) {
            console.log(canIUseDevicePanel, 'canIUseDevicePanel hasSaved wxBatchAddDevicePanel')
            resolve(canIUseDevicePanel)
          } else {
            if (!canIUseBatchAddDevicePanel) {
              console.log('canIUseDevicePanel !checkCanIUserWxApi wxBatchAddDevicePanel')
              resolve(false)
            } else {
              console.log('canIUseDevicePanel checkCanIUserWxApi wxBatchAddDevicePanel')
              wx.canIUseDevicePanel({
                success: (res) => {
                  const result = res?.result
                  console.log(
                    res,
                    canIUseBatchAddDevicePanel,
                    'canIUseDevicePanel result, canIUseAddDevicePanel wxBatchAddDevicePanel',
                  )
                  app.globalData.canIUseDevicePanel = result && canIUseBatchAddDevicePanel
                  resolve(result && canIUseBatchAddDevicePanel)
                },
                fail: (err) => {
                  console.log(err, 'canIUseDevicePanel err wxBatchAddDevicePanel')
                  resolve(false)
                },
              })
            }
          }
        })
        .catch(() => {
          resolve(false)
        })
    })
  },
  /**
   * 校验当前设备状态 - 事业部调用 第一个版本使用微信返回字段
   * @return {boolean} true - disabled异常状态 false - 设备正常
   */
  checkIsDeviceDisabled() {
    return new Promise((resolve) => {
      const options = this.getCurrentPageOptions()
      const applianceCode = options?.applianceCode
      const isFromWxDeviceCard = this.checkIsFromWxDeviceCard()
      console.log(applianceCode, isFromWxDeviceCard, 'checkIsDeviceDisabled')
      if (isFromWxDeviceCard && applianceCode) {
        app.checkGlobalExpiration().then(() => {
          const isLogon = app.globalData.isLogon
          console.log(isLogon, 'checkIsDeviceDisabled isLogon')
          if (isLogon) {
            this.getDeviceAvailabilityVerify(applianceCode)
              .then(() => {
                resolve(false)
              })
              .catch((e) => {
                console.log(e, 'e getDeviceAvailabilityVerify')
                resolve(true)
              })
          }
        })
      } else {
        resolve(false)
      }
    })
  },
  /**
   * 根据渠道来源获取插件页数据并返回给插件页 -事业部插件调用
   */
  checkAndGetOptionsData() {
    return new Promise((resolve, reject) => {
      let options = this.getCurrentPageOptions()
      const isFromDeviceCard = this.checkIsFromWxDeviceCard()
      if (isFromDeviceCard) {
        const applianceCode = this.getPlainApplianceCode(options?.applianceCode)
        this.getDeviceData(applianceCode)
          .then((res) => {
            options.deviceInfo = this.getCipDeviceInfo(res)
            resolve(options)
          })
          .catch((e) => {
            reject(e)
          })
      } else {
        resolve(options)
      }
    })
  },
  /**
   * 判断并展示添加设备卡片指引 -事业部插件调用
   * 例：
   *  {
   *     deviceInfo: 设备信息
   *     path: `/plugin/T0xAC/index/index 点击卡片跳转路径
   *     envVersion: '', develop-开发版 trial-体验版 release-线上
   *     success: () => {}, 成功回调
   *     fail: () => {}，失败回调
   *  }
   */
  async checkAndShowAddDeviceGuideCard(params) {
    const deviceInfo = this.getPlainDeviceInfo(params) //获取明文设备信息
    const success = params?.success // 成功回调
    const fail = params?.fail // 失败回调
    try {
      const applianceType = deviceInfo?.applianceType
      const wxCheckCanIUseAddDevicePanel = await this.wxCheckCanIUseAddDevicePanel() // 是否支持使用微信卡片
      const wxSearchBindStatus = await this.wxSearchBindStatus({
        applianceCode: deviceInfo.applianceCode,
      }) // 查询设备是否已添加到设备卡片
      const wxDeviceCardGuideHasShowed = wx.getStorageSync(`wx_deviceCard_guide_has_showed_${applianceType}`) // 查询是否已经显示过设备卡片添加指引
      console.log(
        wxCheckCanIUseAddDevicePanel,
        wxSearchBindStatus,
        wxDeviceCardGuideHasShowed,
        'checkAndShowAddDeviceCard',
      )
      if (wxCheckCanIUseAddDevicePanel && +wxSearchBindStatus !== 1 && !wxDeviceCardGuideHasShowed) {
        console.log('展示设备卡片添加指引 checkAndShowAddDeviceCard')
        this.addWxList(params)
          .then((res) => {
            wx.setStorageSync(`wx_deviceCard_guide_has_showed_${applianceType}`, true)
            success && success(res)
          })
          .catch((error) => {
            console.log(error, 'checkAndShowAddDeviceCard error addWxList')
            const errString = JSON.stringify(error)
            if (errString.includes('errMsg')) {
              wx.setStorageSync(`wx_deviceCard_guide_has_showed_${applianceType}`, true)
            }
            fail && fail(error)
          })
      }
    } catch (error) {
      console.log(error, 'checkAndShowAddDeviceCard error catch')
      fail && fail(error)
    }
  },
  /**
   * 判断是否是从设备卡片进入插件页 - 事业部插件调用
   * @return {boolean} true - 微信卡片进入 false - 其他渠道进入
   */
  checkIsFromWxDeviceCard() {
    let options = this.getCurrentPageOptions()
    const launchSource = options?.launch_source
    console.log(launchSource, options, 'options checkAndGetOptionsData')
    return launchSource === this.config.launch_source
  },
  /**
   * 获取解密applianceCode
   */
  getPlainApplianceCode(encodeApplianceCode) {
    const decodeApplianceCode = aesDecrypt(encodeApplianceCode, app.globalData.aesKey, app.globalData.aesIv)
    return decodeApplianceCode
  },
  /**
   * 查询设备状态
   */
  getDeviceAvailabilityVerify(applianceCode) {
    return new Promise((resolve, reject) => {
      const data = {
        applianceCode,
        wxAccessToken: app.globalData.wxAccessToken,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('wxGetDeviceAvailabilityVerify', data)
        .then((res) => {
          console.log(res, 'getDeviceAvailabilityVerify')
          const data = res?.data
          if (data?.code === 0) {
            resolve(data)
          } else {
            reject(data)
          }
        })
        .catch((e) => {
          console.log(e, 'getDeviceAvailabilityVerify')
          if (e?.data?.code === 1352) {
            resolve(e)
          } else {
            reject(e)
          }
        })
    })
  },
  // 根据applianceCode获取插件页数据 - 调用云端接口
  getDeviceData(applianceCode) {
    return new Promise((resolve, reject) => {
      const data = {
        applianceCode,
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService
        .request('wxGetDeviceInfo', data)
        .then((res) => {
          console.log(res, 'getDeviceData')
          const data = res?.data
          if (data?.code === 0) {
            resolve(data?.data)
          } else {
            reject(res)
          }
        })
        .catch((e) => {
          console.log(e, 'getDeviceData')
          reject(e)
        })
    })
  },
  getCurrentPageOptions() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = currentPage.options
    return options
  },
  //微信授权弹框
  actionWxDevicePanel(snTicket, modelId, params, deviceInfo, data, envVersion, encryptApplianceCode) {
    const this_ = this
    const launch_source = this.config.launch_source
    const queryObj = {
      backTo: '/pages/index/index',
      launch_source,
      from: 'wx',
      applianceCode: encryptApplianceCode,
    }
    const query = urlParamsJoin('', queryObj).replace('?', '')
    const wxParamy = {
      sn: encryptApplianceCode || '',
      snTicket: snTicket || '',
      modelId: modelId || '',
      path: params.path || '',
      query: query || '',
      deviceName: deviceInfo.name || '',
      location: deviceInfo.roomName || '',
      envVersion: envVersion || config.wxBatchAddDevicePanelEnv[config.environment], //develop,trial,release
    }
    console.log('调用微信添加接口的传参:', wxParamy)
    return new Promise((resolve, reject) => {
      wx.addDevicePanel({
        ...wxParamy,
        success(res) {
          console.log('添加设备成功微信回调', res)
          this_.componentWxListTrack('user_behavior_event', 'click_allow', deviceInfo, res, 'success')
          this_
            .actionAddCard(data)
            .then((resp) => {
              // showToast('添加成功！', 'success')
              resolve(resp)
            })
            .catch((e) => {
              showToast('操作失败！')
              this_.actionDelWxDevicePanel(snTicket, modelId, deviceInfo, data, encryptApplianceCode)
              reject(e)
            })
        },
        fail(err) {
          console.log('添加设备失败微信回调', err)
          this_.componentWxListTrack('user_behavior_event', 'click_cancel', deviceInfo, err, 'fail')
          // 微信报错设备已添加的情况下，再重新请求云端接口添加一次
          if (err?.errCode === 10001) {
            console.log('添加设备失败微信回调 10001')
            this_
              .actionAddCard(data)
              .then((resp) => {
                resolve(resp)
              })
              .catch((e) => {
                showToast('操作失败！')
                this_.actionDelWxDevicePanel(snTicket, modelId, deviceInfo, data, encryptApplianceCode)
                reject(e)
              })
            return
          }
          reject(err)
          this_.actionDeleteCard(data)
        },
      })
    })
  },
  //微信移除绑定
  actionDelWxDevicePanel(snTicket, modelId, deviceInfo, data, encryptApplianceCode) {
    const this_ = this
    const wxParamy = {
      sn: encryptApplianceCode || '',
      snTicket: snTicket || '',
      modelId: modelId || '',
    }
    console.log('调用微信移除接口的传参:', wxParamy)
    return new Promise((resolve, reject) => {
      wx.removeDevicePanel({
        ...wxParamy,
        success(res) {
          console.log('移除设备成功微信回调', res)
          this_.componentWxListTrack('user_behavior_event', 'click_del_wechat_api_return', deviceInfo, res, 'success')
          this_
            .actionDeleteCard(data)
            .then((resp) => {
              console.log('调用云端删除接口的返回：', resp)
              resolve(resp)
            })
            .catch((err) => {
              showToast('操作失败！')
              reject(err)
            })
          // showToast('删除成功！', 'success')
        },
        fail(err) {
          console.log('删除设备失败微信回调', err)
          this_.componentWxListTrack('user_behavior_event', 'click_del_wechat_api_return', deviceInfo, err, 'fail')
          showToast('操作失败！')
          reject(err)
        },
        complete(res) {
          console.log(res, 'removeDevicePanel')
        },
      })
    })
  },
  checkIsInWhiteList() {
    return new Promise((resolve, reject) => {
      requestService
        .request('checkIsInWhiteList', {
          reqId: getReqId(),
          stamp: getStamp(),
        })
        .then((res) => {
          const data = res?.data
          if (data?.code === 0) {
            resolve(data)
          } else {
            reject(data)
          }
        })
        .catch((e) => {
          reject(e)
        })
    })
  },
  // 微信批量添加设备卡片授权 getWxGetSetting
  authWxDevicePanelBatch() {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: 'scope.devicePanel',
        success(res) {
          console.log(res, 'wxBatchAddDevicePanel scope.devicePanel success')
          resolve(res)
        },
        fail(err) {
          console.log(err, 'wxBatchAddDevicePanel scope.devicePanel fail')
          reject(err)
        },
      })
    })
  },
  // 获取用户的设备卡片 - 调用微信接口获取到用户已添加的设备卡片列表
  getWxDevicePanelList() {
    return new Promise((resolve, reject) => {
      const canIUserGetDevicePanelList = checkCanIUserWxApi('getDevicePanelList', false)
      if (canIUserGetDevicePanelList) {
        wx.getDevicePanelList({
          success(res) {
            console.log('wxBatchAddDevicePanel 调用微信接口获取到用户已添加的设备卡片列表success:', res)
            const deviceList = res?.data?.device_list || []
            deviceList.map((item) => {
              item.applianceCode = aesDecrypt(item.sn, app.globalData.aesKey, app.globalData.aesIv)
            })
            resolve(deviceList)
          },
          fail(error) {
            console.log('wxBatchAddDevicePanel 调用微信接口获取到用户已添加的设备卡片列表fail:', error)
            reject(error)
          },
        })
      } else {
        resolve([])
      }
    })
  },
  // 批量添加设备卡片-授权+匹配数据
  batchAddDeviceCard_step1() {
    return new Promise((resolve, reject) => {
      this.wxCheckCanIUseBatchAddDevicePanel().then((canIUseBatchAddDevicePanel) => {
        if (canIUseBatchAddDevicePanel) {
          this.authWxDevicePanelBatch()
            .then(() => {
              this.getWxDevicePanelList()
                .then((res) => {
                  const wxDevicePanelList = res
                  console.log('wxBatchAddDevicePanel 调用wxDevicePanelList获取已添加卡片数据', wxDevicePanelList)
                  resolve(wxDevicePanelList)
                })
                .catch((e) => {
                  reject(e)
                })
            })
            .catch((e) => {
              reject(e)
            })
        }
      })
    })
  },
  // 调用微信批量添加设备卡片接口 调用云端接口+调用微信api
  batchAddDeviceCard_step2(uploadList) {
    this.wxCheckCanIUseBatchAddDevicePanel().then((canIUseBatchAddDevicePanel) => {
      if (canIUseBatchAddDevicePanel) {
        const launch_source = this.config.launch_source
        this.actionAddCardBatch(uploadList).then((res) => {
          const { reqUploadList, hasUploadList } = res
          console.log('wxBatchAddDevicePanel 匹配上传的设备数据&&云端添加接口返回数据', res)
          hasUploadList?.deviceBillList &&
            hasUploadList?.deviceBillList.map((item) => {
              const currentDevice = reqUploadList.find((reqUploadItem) => {
                const applianceCode = this.getEncryptApplianceCode(reqUploadItem?.applianceCode)
                return applianceCode === item.sn
              })
              const queryObj = {
                launch_source,
                from: 'wx',
                applianceCode: this.getEncryptApplianceCode(currentDevice?.applianceCode),
                isSupported: currentDevice?.isSupported,
              }
              const path = urlParamsJoin('/sub-package/wx-bind-deviceCard/redirect/index', queryObj)
              item.path = path
              // item.query = query
              item.deviceName = currentDevice?.name
              item.location = currentDevice?.roomName
              item.envVersion = config.wxBatchAddDevicePanelEnv[config.environment]
              item._appType = currentDevice?.type
              item._sn8 = currentDevice?.sn8
              item._sn = currentDevice?.sn
              item._applianceCode = this.getEncryptApplianceCode(currentDevice?.applianceCode)
            })
          console.log('wxBatchAddDevicePanel 传入微信批量添加设备卡片api数据：', hasUploadList?.deviceBillList)
          return this.wxBatchAddDevicePanel(hasUploadList?.deviceBillList || [])
        })
      }
    })
  },

  /**
   * 调用微信api添加到微信设备卡片
   * @param {*} devices 云端添加设备卡片成功的列表
   * @returns
   */
  wxBatchAddDevicePanel(sourceDevices) {
    return new Promise((resolve, reject) => {
      const canIUserBatchAddDevicePanel = checkCanIUserWxApi('batchAddDevicePanel', false)
      const sourceDevicesLen = sourceDevices?.length
      if (canIUserBatchAddDevicePanel && sourceDevicesLen) {
        let devices = cloneDeep(sourceDevices)
        devices.map((item) => {
          delete item._sn
          delete item._sn8
          delete item._appType
          delete item._applianceCode
        })
        wx.batchAddDevicePanel({
          devices,
          success(res) {
            console.log('wxBatchAddDevicePanel 调用batchAddDevicePanel成功回调success:', res)
            resolve(res)
            const successList = res?.data?.devices?.filter((item) => {
              return item.errMsg === 'ok'
            })
            console.log(successList, 'wxBatchAddDevicePanel successList')
            if (successList?.length) {
              let object_name = []
              let ext_info = []
              for (let i = 0, len = successList.length; i < len; i++) {
                const currentSuccessDevice = successList[i]
                const reportDevice = sourceDevices.find((item) => item._applianceCode === currentSuccessDevice.sn)
                object_name.push(reportDevice?.deviceName)
                ext_info.push({
                  sn: reportDevice?._sn,
                  sn8: reportDevice?._sn8,
                  app_type: reportDevice?._appType,
                })
              }
            }
          },
          fail(res) {
            console.log('wxBatchAddDevicePanel 调用batchAddDevicePanel失败回调fail', res)
            reject(res)
          },
        })
        let object_name = []
        let ext_info = []
        for (let i = 0, len = sourceDevices.length; i < len; i++) {
          const sourceDevice = sourceDevices[i]
          object_name.push(sourceDevice?.deviceName)
          ext_info.push({
            sn: sourceDevice?._sn,
            sn8: sourceDevice?._sn8,
            app_type: sourceDevice?._appType,
          })
        }
      }
    })
  },
  // 批量添加设备卡片接口 - 云端接口
  actionAddCardBatch(uploadList) {
    return new Promise((resolve, reject) => {
      const applianceCodeList = []
      for (let i = 0, len = uploadList.length; i < len; i++) {
        applianceCodeList.push({
          applianceCode: this.getEncryptApplianceCode(uploadList[i]?.applianceCode),
        })
      }
      const reqData = {
        wxAccessToken: app.globalData.wxAccessToken,
        reqId: getReqId(),
        stamp: getStamp(),
        applianceCodeList,
      }
      requestService.request('wxAddCardBatch', reqData).then(
        (resp) => {
          const data = resp?.data
          console.log('wxBatchAddDevicePanel 云端批量保存接口的传参：', reqData)
          console.log('wxBatchAddDevicePanel 云端批量保存接口的返回：', data)
          this.componentWxListTrack('user_behavior_event', 'click_add_cloud_api_return', {}, resp)
          const resolveData = {
            reqUploadList: uploadList,
            hasUploadList: data?.data,
          }
          data?.code == 0 ? resolve(resolveData) : reject(resp)
        },
        (error) => {
          console.log('wxBatchAddDevicePanel 云端批量保存接口失败的传参：', reqData)
          console.log('wxBatchAddDevicePanel 云端批量保存接口失败', error)
          this.componentWxListTrack('user_behavior_event', 'click_add_cloud_api_return', {}, error)
          reject(error)
        },
      )
    })
  },
  //设备卡片保存接口-云端接口
  actionAddCard(reqData) {
    return new Promise((resolve, reject) => {
      requestService.request('wxAddCard', reqData).then(
        (resp) => {
          console.log('云端保存接口的传参：', reqData)
          console.log('云端保存接口的返回：', resp.data)
          this.componentWxListTrack('user_behavior_event', 'click_add_cloud_api_return', {}, resp)
          resp?.data?.code == 0 ? resolve(resp) : reject(resp)
        },
        (error) => {
          console.log('云端保存接口失败的传参：', reqData)
          console.log('云端保存接口失败', error)
          this.componentWxListTrack('user_behavior_event', 'click_add_cloud_api_return', {}, error)
          reject(error)
        },
      )
    })
  },
  //设备卡片删除接口-云端
  actionDeleteCard(reqData) {
    return new Promise((resolve, reject) => {
      requestService.request('wxDeleCard', reqData).then(
        (resp) => {
          console.log('云端删除设备接口成功的传参：', reqData)
          console.log('云端删除接口的返回：', resp)
          this.componentWxListTrack('user_behavior_event', 'click_del_cloud_api_return', {}, resp)
          resp?.data?.code == 0 ? resolve(resp) : reject(resp)
        },
        (error) => {
          console.log('云端删除设备接口失败的传参：', reqData)
          console.log('云端删除接口失败的返回：', error)
          this.componentWxListTrack('user_behavior_event', 'click_del_cloud_api_return', {}, error)
          reject(error)
        },
      )
    })
  },
  getEncryptApplianceCode(applianceCode) {
    return wxCardAesEncrypt(applianceCode, getApp().globalData.aesKey, getApp().globalData.aesIv)
  },
  //保存接口和删除接口传参
  getCustomData(modelId, sn, deviceInfo) {
    const openId = app.globalData.openId || ''
    const encryptApplianceCode = this.getEncryptApplianceCode(deviceInfo.applianceCode)
    return {
      modelId: modelId || '',
      applianceCode: encryptApplianceCode || '',
      applianceType: deviceInfo.type || '',
      reqId: getReqId(),
      stamp: getStamp(),
      openId: openId,
      wxAccessToken: app.globalData.wxAccessToken,
    }
  },
  getPlainDeviceInfo(params) {
    if (hasKey(params, 'deviceInfo')) {
      return params.deviceInfo ? JSON.parse(decodeURIComponent(params.deviceInfo)) : ''
    } else {
      const deviceInfo = app.globalData.query.deviceInfo
      return JSON.parse(decodeURIComponent(deviceInfo))
    }
  },
  getCipDeviceInfo(currDeviceInfo) {
    return encodeURIComponent(JSON.stringify(currDeviceInfo))
  },
  componentWxListTrack(event, widget_id, data = {}, res = {}, status = '') {
    // const launch_source = this.config.launch_source
    // app.globalData.launch_source = launch_source
    // const params = this.getParamDate(data)
    // const extData = this.getTrackExtDate(data, res, status)
    // componentCommonTrack(event, widget_id, params, extData)
  },
  getParamDate(data) {
    return {
      object_type: 'appliance',
      object_id: data.applianceCode,
      object_name: data.type,
    }
  },
  getTrackExtDate(data = {}, res = {}, status) {
    let p1 = new Object()
    let p2 = new Object()
    if (!isEmptyObject(data)) {
      p1 = this.getP1(data)
    }
    if (!isEmptyObject(res)) {
      p2 = this.getP2(res, status)
    }
    return {
      ...p1,
      ...p2,
    }
  },
  getP1(data) {
    return {
      product_name: data.name,
      product_model: data.product_model,
      sn8: data.sn8,
    }
  },
  getP2(res, status) {
    if (status === 'success') {
      return {
        result: 'success',
        code: '',
        msg: res.data.errMsg,
      }
    }
    if (status === 'fail') {
      return {
        result: 'fail',
        code: '',
        msg: res.errMsg,
      }
    }
    if (!hasKey(res, 'data')) {
      return {
        result: 'fail',
        msg: res,
        code: '',
      }
    }
    const data = res.data
    return {
      result: hasKey(data, 'code') ? this.getResult(data) : 'fail',
      code: hasKey(data, 'code') ? res.data.code : '',
      msg: this.getMsg(data),
    }
  },
  getMsg(data) {
    if (hasKey(data, 'errMsg')) {
      return data.errMsg
    }
    if (hasKey(data, 'msg')) {
      return data.msg
    }
    return ''
  },
  getResult(data) {
    return data.code === 0 ? 'success' : 'fail'
  },
}
export default wxList
