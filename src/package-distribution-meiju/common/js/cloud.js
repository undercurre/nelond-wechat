/*
 * @desc: 多云协议
 * @author: zhucc22
 * @Date: 2023-04-03 13:56:53
 */
import { requestService } from '../../utils/requestService'
import { md5 } from 'm-utilsdk/index'
const cloudMethods = {
  // 就近接入区域代码获取
  getGlobalRegion() {
    return new Promise((resolve, reject) => {
      requestService
        .request('getGlobalRegion', {}, 'GET')
        .then((res) => {
          if (res.data.code == 0) {
            resolve(res)
          }
        })
        .catch((error) => {
          console.log(error)
          reject()
        })
    })
  },
  // 获取多云路由映射表
  getGlobalModule(version) {
    let header = {},
      globalSigh
    if (version) {
      header['routeVersion'] = version
    }
    if (this.globalData && this.globalData.userData) {
      let accessToken = this.globalData.userData.mdata.accessToken
      let region = this.globalData?.region
      let paramStr = accessToken + region
      globalSigh = md5(paramStr)
    } else {
      globalSigh = ''
    }
    if (globalSigh) {
      header['regionSign'] = globalSigh
    }
    return new Promise((resolve, reject) => {
      requestService
        .request('getGlobalModule', {}, 'GET', header)
        .then((res) => {
          if (res.data.code == 0) {
            resolve(res)
          }
        })
        .catch((error) => {
          console.log(error)
          reject()
        })
    })
  },
  //多云规则匹配，sseRegions相关小程序没有接入，暂时不做处理
  cloudRule(apiUrl) {
    let masUrl,
      cloudUrl,
      cloudGlobalModule = wx.getStorageSync('cloudGlobalModule'),
      apiArray = apiUrl.split('='),
      cloudRegion = wx.getStorageSync('userRegion')
        ? wx.getStorageSync('userRegion')
        : wx.getStorageSync('cloudRegion')
        ? wx.getStorageSync('cloudRegion')
        : 0
    let masConfigUrL = apiArray[1]
    if (cloudGlobalModule && cloudRegion) {
      cloudGlobalModule = JSON.parse(cloudGlobalModule)
      //使用for匹配
      for (let fixedRegionItem of cloudGlobalModule.fixedRegion) {
        for (let modulesItem of fixedRegionItem.modules) {
          if (RegExp(modulesItem).test(masConfigUrL)) {
            let fixedRegion = fixedRegionItem.region
            for (let regionItem of cloudGlobalModule.regions) {
              if (regionItem.id == fixedRegion) {
                masUrl = regionItem.host
                break
              }
            }
            break
          } else {
            for (let userRegionItem of cloudGlobalModule.userRegions) {
              if (RegExp(userRegionItem).test(masConfigUrL)) {
                for (let regionItem of cloudGlobalModule.regions) {
                  if (regionItem.id == cloudRegion) {
                    masUrl = regionItem.host
                    break
                  }
                }
                break
              } else {
                for (let regionItem of cloudGlobalModule.regions) {
                  if (regionItem.id == 0) {
                    masUrl = regionItem.host
                  }
                }
              }
            }
          }
        }
      }
      if (masUrl) {
        cloudUrl = apiUrl.replace(/^https:\/\/[^/]+\//, 'https://' + masUrl + '/')
      } else {
        cloudUrl = apiUrl
      }
    } else {
      cloudUrl = apiUrl
    }
    return cloudUrl
  },
}
export default cloudMethods
