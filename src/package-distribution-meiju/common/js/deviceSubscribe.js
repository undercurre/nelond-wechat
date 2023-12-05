//设备订阅公共方法

import app from '../app'

import { requestService } from '../../utils/requestService'

import { getStamp, getReqId, wxCardAesEncrypt } from 'm-utilsdk/index'

import { templateIds } from './templateIds'

import { getDeviceSn } from '../../common/js/device.js'

//根据长期模板id获取长期模板名字
function getTemplateName(templateId) {
  let target = Object.keys(templateIds).filter((item) => {
    return templateIds[item][0] == templateId
  })
  return templateIds[target][1]
}

//根据长期模板名字获取长期模板id
export function getTemplateId(template) {
  let target = Object.keys(templateIds).filter((item) => {
    return templateIds[item][1] == template
  })
  if (target.length != 0) {
    return templateIds[target][0]
  } else {
    return ''
  }
}

//获取设备sn_ticket
export function getSnTicket(modelId, sn) {
  return new Promise((resolve, reject) => {
    let reqData = {
      modelId: modelId,
      sn: sn,
      wxAccessToken: app.globalData.wxAccessToken,
      reqId: getReqId(),
      stamp: getStamp(),
    }
    requestService.request('getSnTicket', reqData).then(
      (res) => {
        if (res.data.code == 0) {
          resolve(res.data.data.data)
        } else {
          console.log('查询设备sn_ticket接口失败')
          reject(res)
        }
      },
      (error) => {
        reject(error)
      },
    )
  })
}

//保存订阅状态
function saveDeviceSubscribe(sn, subscribeTemplateId, type, applianceCode, subscribed) {
  return new Promise((resolve, reject) => {
    let reqData = {
      deviceId: sn,
      openId: wx.getStorageSync('openId') || '',
      unionId: '',
      templateSubStatus: [],
    }
    subscribeTemplateId.forEach((item) => {
      reqData.templateSubStatus.push({
        templateId: item,
        templateType: type, //1 为永久 0 为一次性
        status: 1, //1 为订阅， 0 为未订阅
      })
    })
    requestService.request('saveDeviceSubscribe', reqData).then(
      (res) => {
        if (res.data.code == 0) {
          console.log('设备订阅成功', subscribeTemplateId)
          wx.setStorage({
            key: applianceCode + '_subscribed',
            data: Array.from(new Set([...subscribed, ...subscribeTemplateId])),
          })
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      (error) => {
        reject(error)
      },
    )
  })
}

//打开设备订阅授权弹窗
function openModal(sn, snTicket, template_ids, sn8, pluginType, modelId, applianceCode, subscribed) {
  let saveSubscribeSetting = (ids) => {
    app.globalData.subscriptionsSetting = Array.from(new Set([...app.globalData.subscriptionsSetting, ...ids])) //保存授权过的信息设置
  }
  let isShowModal = template_ids.filter((item) => {
    return !app.globalData.subscriptionsSetting.includes(item)
  })
  if (isShowModal.length != 0) {
    let msg_list = isShowModal.reduce((prev, currentValue) => {
      prev.push(getTemplateName(currentValue))
      return prev
    }, [])
    //曝光埋点
  }
  //打开订阅授权弹窗
  wx.requestSubscribeDeviceMessage({
    tmplIds: template_ids,
    sn: sn,
    snTicket: snTicket,
    modelId: modelId,
    success(res) {
      console.log('设备订阅授权成功', res)
      let subscribeTemplateId = template_ids.filter((item) => {
        return res[item] == 'accept'
      })
      let unSubscribeTemplateId = template_ids.filter((item) => {
        return res[item] == 'reject'
      })
      if (isShowModal.length != 0) {
        let msg_list = []
        subscribeTemplateId.forEach((item) => {
          msg_list.push({ msg_type: getTemplateName(item), status: 1 })
        })
        unSubscribeTemplateId.forEach((item) => {
          msg_list.push({ msg_type: getTemplateName(item), status: 0 })
        })
      }
      console.log('允许订阅的模板id', subscribeTemplateId)
      saveSubscribeSetting(subscribeTemplateId)
      saveDeviceSubscribe(sn, subscribeTemplateId, 1, applianceCode, subscribed)
    },
    fail(res) {
      console.log('设备订阅弹窗失败', res)
      if (isShowModal.length == 0) {
        return
      }
      let msg_list = isShowModal.reduce((prev, currentValue) => {
        prev.push(getTemplateName(currentValue))
        return prev
      }, [])
      if (res.errMsg.includes('reject operation')) {
        saveSubscribeSetting(template_ids)
        let msgList = msg_list.reduce((prev, currentValue) => {
          prev.push({ msg_type: currentValue, status: 0 })
          return prev
        }, [])
      }
    },
  })
}

//检查android手机里的微信版本是否低于8.0.9  wx.requestSubscribeDeviceMessage 不支持android 微信8.0.9版本以下
function checkAndroidWxVersion_809(systemInfo) {
  const version = systemInfo.version
  const arr = version.split('.')
  if (parseInt(arr[0]) < 8) return false
  if (parseInt(arr[0]) >= 8 && parseInt(arr[1]) === 0 && parseInt(arr[2]) < 9) return false
  return true
}

//检查ios手机里的微信版本是否低于8.0.10  wx.requestSubscribeDeviceMessage 不支持ios 微信8.0.10版本以下
function checkAndroidWxVersion_8010(systemInfo) {
  const version = systemInfo.version
  const arr = version.split('.')
  if (parseInt(arr[0]) < 8) return false
  if (parseInt(arr[0]) >= 8 && parseInt(arr[1]) === 0 && parseInt(arr[2]) < 10) return false
  return true
}

//检查小程序版本库是否低于2.19.5  wx.requestSubscribeDeviceMessage 不支持基础版本库2.19.5版本以下
function checkSDKVersion_2195(systemInfo) {
  const version = systemInfo.SDKVersion
  const arr = version.split('.')
  if (parseInt(arr[0]) < 2) return false
  if (parseInt(arr[0]) >= 2 && parseInt(arr[1]) === 19 && parseInt(arr[2]) < 5) return false
  return true
}

//判断手机微信版本以及小程序基础库是否支持wx.requestSubscribeDeviceMessage方法
function checkVersion() {
  let isSupport = true
  let systemInfo = wx.getSystemInfoSync()
  if (!checkSDKVersion_2195(systemInfo)) {
    console.log('wx.requestSubscribeDeviceMessage 不支持基础版本库2.19.5版本以下')
    isSupport = false
  }
  if (systemInfo['system'].includes('Android') && !checkAndroidWxVersion_809(systemInfo)) {
    console.log('wx.requestSubscribeDeviceMessage 不支持android 微信8.0.9版本以下')
    isSupport = false
  }
  if (systemInfo['system'].includes('iOS') && !checkAndroidWxVersion_8010(systemInfo)) {
    console.log('wx.requestSubscribeDeviceMessage 不支持ios 微信8.0.10版本以下')
    isSupport = false
  }
  return isSupport
}

//modelid或templateID错误提示
function errorNotice(notice) {
  wx.showModal({
    title: '提示',
    content: notice,
    showCancel: false,
    success(res) {
      if (res.confirm) {
        console.log('用户点击确定')
      } else if (res.cancel) {
        console.log('用户点击取消')
      }
    },
  })
}

//打开设备长期信息订阅授权弹窗的公共方法
/**
 * @param {Number} modelId 产品类别id
 * @param {String} name 设备名称
 * @param {String} sn  设备sn
 * @param {Number} template_ids  信息模板id数组
 * @param {String} sn8  设备sn8码
 * @param {String} pluginType  设备品类
 * @param {String} applianceCode  设备applianceCode
 */
export async function openSubscribeModal(modelId, name, sn, template_ids, sn8, pluginType, applianceCode) {
  console.log('设备名称', name)
  let isSupport = checkVersion()
  if (!isSupport) {
    return
  }
  if (!modelId) {
    errorNotice('modelId不得为空')
    return
  }
  if (template_ids.length == 0 || template_ids.length >= 4) {
    errorNotice('模板不得为空或不得超过3个')
    return
  }
  let subscribed = wx.getStorageSync(applianceCode + '_subscribed') || []
  console.log('已订阅的模板id', subscribed)
  let unSubscribe = template_ids.filter((item) => {
    return !subscribed.includes(item)
  })
  if (unSubscribe.length == 0) {
    return
  }
  //sn = getDeviceSn(sn) //获得解密sn
  sn = wxCardAesEncrypt(applianceCode, getApp().globalData.aesKey, getApp().globalData.aesIv) //安全考虑不传解密sn，使用applianceCode加密传递
  let sn_ticket = await getSnTicket(modelId, sn)
  //调用订阅消息
  openModal(sn, sn_ticket, template_ids, sn8, pluginType, modelId, applianceCode, subscribed)
}

//打开设备一次性信息订阅授权弹窗的公共方法(已废弃)
/**
 * @param {String} name 设备名称
 * @param {String} sn  设备sn
 * @param {Number} template_ids  信息模板id数组
 * @param {String} sn8  设备sn8码
 * @param {String} pluginType  设备品类
 * @param {String} applianceCode  设备applianceCode
 */
export async function openDisposableSubscribeModal(name, sn, template_ids, sn8, pluginType, applianceCode) {
  console.log(name, sn, template_ids, sn8, pluginType, applianceCode)
  let subscribed = wx.getStorageSync(applianceCode + '_subscribed') || []
  console.log('已订阅的模板id', subscribed)
  if (template_ids.length == 0 || template_ids.length >= 4) {
    errorNotice('模板不得为空或不得超过3个')
    return
  }
  sn = getDeviceSn(sn) //获得解密sn
  wx.requestSubscribeMessage({
    tmplIds: [...template_ids],
    success(res) {
      console.log('一次性订阅授权成功', res)
      let subscribeTemplateId = template_ids.filter((item) => {
        return res[item] == 'accept'
      })
      console.log('一次性订阅的模板id', subscribeTemplateId)
      if (subscribeTemplateId.length == 0) {
        return
      }
      let unSubscribe = template_ids.filter((item) => {
        return !subscribed.includes(item)
      })
      if (unSubscribe.length == 0) {
        return
      }
      saveDeviceSubscribe(sn, subscribeTemplateId, 0, applianceCode, subscribed)
    },
  })
}
