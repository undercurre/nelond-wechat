/**
 * 获取当前位置省市区以及地域编码
 * */
let QQMapWX = require('./qqmap-wx-jssdk.min.js')
import { requestService } from './requestService'

//腾讯地址服务SDK
function getLocationKey() {
  return 'B35BZ-KNTKU-FAWV3-4V5KK-NHZV6-ZSBWH'
}

//获取当前位置 例如深圳市南山
function getLocation(callback) {
  let qqmapsdk = new QQMapWX({
    key: getLocationKey(),
  })
  //微信获得经纬度
  let getToLocation = () => {
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        let { latitude, longitude } = res
        getLocal(latitude, longitude)
      },
      fail: function (res) {
        //系统定位没开
        console.log('获得经纬度失败，手机位置没开启或没授予微信或小程序位置权限: ' + JSON.stringify(res))
        callback({ error: '获得经纬度失败，手机位置没开启或没授予微信或小程序位置权限' })
      },
    })
  }
  //根据经纬度获取省市区
  let getLocal = (latitude, longitude) => {
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude,
      },
      success: function (res) {
        let { province, city, district } = res.result.ad_info
        getAreaProvince(province, city, district)
          .then((obj) => {
            callback(obj)
          })
          .catch((error) => {
            callback(error)
          })
      },
      fail: function (res) {
        console.log('根据经纬度获取省市区失败：' + res)
        callback({ error: '根据经纬度获取省市区失败：' })
      },
    })
  }
  let getAreaDetail = (params) => {
    let reqData = {
      restParams: {
        parentCode: params.regionCode,
        sourceSys: 'APP',
      },
      headParams: {},
    }
    return new Promise((resolve, reject) => {
      requestService.request('getAreaList', reqData, 'POST').then(
        (resp) => {
          if (resp?.data) {
            resolve(resp.data)
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  }
  //根据省市区获取后端里保存的省份区code编码
  let getAreaProvince = (province, city, county) => {
    let provinceObj = null
    let cityObj = null
    let countyObj = null
    return new Promise(async (resolve, reject) => {
      //获取省
      let getProvincve = await getAreaDetail({ regionCode: '100000' })
      if (getProvincve?.data?.length) {
        let temp = getProvincve.data.filter((provinceItem) => {
          return province == provinceItem.ebplNameCn
        })
        if (temp && temp.length > 0) {
          provinceObj = temp[0]
        }
        if (!provinceObj) {
          reject({ error: '接口数据里没有定位的省份' })
          return
        }
        //获取市
        let getCity = await getAreaDetail({ regionCode: provinceObj.ebplCode })
        if (getCity?.data?.length) {
          let cTemp = getCity.data.filter((cityItem) => {
            return city == cityItem.ebplNameCn
          })
          if (cTemp && cTemp.length > 0) {
            cityObj = cTemp[0]
          }
          if (!cityObj) {
            reject({ error: '接口数据里没有定位的市' })
            return
          }
          //获取区
          let getCounty = await getAreaDetail({ regionCode: cityObj.ebplCode })
          if (getCounty?.data?.length) {
            let dTemp = getCounty.data.filter((countyItem) => {
              return county == countyItem.ebplNameCn
            })
            if (dTemp && dTemp.length > 0) {
              countyObj = dTemp[0]
            }
            if (!countyObj) {
              reject({ error: '接口数据里没有定位的区' })
              return
            }
            resolve({
              provinceCode: provinceObj.ebplCode,
              province: provinceObj.ebplNameCn,
              cityCode: cityObj.ebplCode,
              city: cityObj.ebplNameCn,
              countyCode: countyObj.ebplCode,
              county: countyObj.ebplNameCn,
            })
          } else {
            reject({ error: '调用接口获取区失败' })
          }
        } else {
          reject({ error: '调用接口获取市失败' })
        }
      } else {
        reject({ error: '调用接口获取省份失败' })
      }
    })
  }
  getToLocation()
}

module.exports = { getLocation }
