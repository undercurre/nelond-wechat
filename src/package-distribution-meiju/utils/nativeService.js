import { getMarketSign } from './util'
import { getTimeStamp } from 'm-utilsdk/index'
import { requestService } from './requestService'
import { api } from '../common/js/api'

var nativeService = {
  /**
   * 获取电商商品详情
   */
  getMarketProdDetail: (obj) => {
    return new Promise((resolve, reject) => {
      let appid = api.marketAppId //"test_mj";
      let appkey = api.marketKey //"test_mj"
      let nonceid = getTimeStamp(new Date()) //"34Dd46sH2SdaASd";
      let bizargs = JSON.stringify(obj) //JSON.stringify({ "itemcodelist": ["15272306938692"] });
      let source = 'wechatMiniprogram'
      let version = '1.0'
      let params = {
        appid: appid,
        version: version,
        nonceid: nonceid,
        source: source,
        bizargs: bizargs,
        sign: getMarketSign(bizargs, appid, appkey, nonceid, version, source),
      }
      console.log(params)
      // 发起网络请求
      requestService
        .request('getdisskubyidsv2', params, 'get')
        .then((resp) => {
          console.log('==========电商商品详情===============')
          console.log(resp)
          if (resp.data.returncode == 0 && resp.data.resultcode == 0) {
            resolve(resp.data.data)
          } else {
            reject(resp)
          }
        })
        .catch((e) => {
          console.log('===========电商商品详情=======exception=========')
          console.log(e)
        })
    })
  },
}

module.exports = {
  nativeService,
}
