import { baseImgApi } from '../../../../common/js/api'
import pageBehaviors from '../../../../../behaviors/pageBehaviors'

import app from '../../../../common/app'
const loactionImgUrl = baseImgApi.url
Page({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    loactionImgUrl: loactionImgUrl,
    loactionImgList: {
      searchIconImg: '',
    },
    system: '',
    permissionTypeList: {},
    tipTextList: {
      iOS: {
        locationEnabled: {
          title: '打开手机定位服务',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/loaction/iOS_dingwei_01_1.png',
              text: '点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_01_2.png',
              text: '找到并点选【隐私】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_01_3.png',
              text: '点击【定位服务】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_01_4.png',
              text: '打开【定位服务】',
            },
          ],
        },
        locationAuthorized: {
          title: '允许微信使用定位',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_1.png',
              text: '点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_2.png',
              text: '找到并点选【微信】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_3.png',
              text: '点选【位置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_4.png',
              text: '选择【使用App期间】',
            },
          ],
        },
        locationReducedAccuracy: {
          title: '允许微信使用定位',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_1.png',
              text: '点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_2.png',
              text: '找到并点选【微信】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_3.png',
              text: '点选【位置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_02_4.png',
              text: '选择【使用App期间】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_jingqueweizhi_02_5.png',
              text: '打开【精确位置】开关',
            },
          ],
        },
        scopeUserLocation: {
          title: '允许小程序使用位置信息',
          stepes: [
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_03_1.png',
              text: '点击右上角【…】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_03_2.png',
              text: '点击【设置】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_03_3.png',
              text: '点击【位置信息】',
            },
            {
              img: loactionImgUrl + '/permission/iOS/loaction/ios_dingwei_03_4.png',
              text: '设为【仅在使用小程序期间】',
            },
          ],
        },
        localNet: {
          title: '打开本地网络',
          stepes: [
            {
              img: './assets/imges/ios_dingwei_02_1.png',
              text: '点击手机【设置】',
            },
            {
              img: './assets/imges/ios_dingwei_02_2.png',
              text: '找到并点选【微信】',
            },
            {
              img: './assets/imges/ios_bendiwangluo_3.png',
              text: '打开【本地网络】开关',
            },
          ],
        },
      },
      Android: {
        locationEnabled: {
          title: '打开手机定位服务',
          stepes: [
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_01_1.png',
              text: '点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_01_2.png',
              text: '找到并点选【隐私】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_01_3.png',
              text: '点击【定位服务】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_01_4.png',
              text: '打开【定位服务】',
            },
          ],
        },
        locationAuthorized: {
          title: '允许微信使用定位',
          stepes: [
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_02_1.png',
              text: '点击手机【设置】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_02_2.png',
              text: '找到并点选【隐私】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_02_3.png',
              text: '点击【权限管理】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_02_4.png',
              text: '点击【位置信息】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_02_5.png',
              text: '找到并点选【微信】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_02_6.png',
              text: '选中【仅使用期间允许】',
            },
          ],
        },
        scopeUserLocation: {
          title: '允许小程序使用位置信息',
          stepes: [
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_03_1.png',
              text: '点击右上角【…】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_03_2.png',
              text: '点击【设置】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_03_3.png',
              text: '点击【位置信息】',
            },
            {
              img: loactionImgUrl + '/permission/Android/loaction/Android_dingwei_03_4.png',
              text: '设为【仅在使用小程序期间】',
            },
          ],
        },
      },
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('options', options)
    this.setData({
      system: app.globalData.systemInfo.system.includes('Android') ? 'Android' : 'iOS',
    })
    let loactionTextList = []
    if (options.permissionTypeList) {
      // console.log('[permision Type List]', JSON.parse(options.permissionTypeList))
      let permissionTypeList = JSON.parse(options.permissionTypeList || null)
      console.log('[permision Type List]', permissionTypeList)
      let { system, tipTextList } = this.data
      if (system === 'iOS') {
        if (!permissionTypeList.localNet) {
          //本地网络未开
          loactionTextList.push(tipTextList.iOS.localNet)
        }
      }
    }
    this.setData({
      loactionTextList: loactionTextList,
    })
  },
})
