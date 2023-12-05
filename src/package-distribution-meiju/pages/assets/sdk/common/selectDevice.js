/**
 * 设备选型相关接口
 */
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'
import brandStyle from '../../js/brand'
var selectDevice = {
  /**
   * 返回查询设备列表，大类，点击选型后显示的数据
   */
  getQueryBrandCategory() {
    return new Promise((resolve, reject) => {
      let param = {
        stamp: getStamp(),
        reqId: getReqId(),
      }
      requestService
        .request('getQueryBrandCategory', param)
        .then((res) => {
          let productList = res.data.data.list.filter((arr) => {
            return arr.list0.length
          })
          resolve(productList)
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  /**
   * 选择对应大类设备型号列表,在选型页面，点击某个大类，返回的设备型号列表
   * 测试用例：
   * params = {
        pageNum: 1,
        productList: {},
        subCode: 'D1X1'
      }
   * @param {*} str 
   * @param {*} params 
   */
  getQueryIotProductV2(str, params) {
    return new Promise((resolve, reject) => {
      let { pageNum, productList, subCode } = params
      let param = {
        subCode,
        pageSize: '20',
        page: pageNum,
        brand: brandStyle.brand === 'meiju' ? '' : brandStyle.brand,
        stamp: getStamp(),
        reqId: getReqId(),
      }
      requestService
        .request('getQueryIotProductV2', param)
        .then((res) => {
          let currList = res.data.data.list || []
          let hasNextPage = res.data.data.hasNextPage
          if (!currList.length) {
            reject()
          }
          let currProduct = str != 'next' ? currList : [...productList, ...currList]
          resolve({
            productList: currProduct,
            loadFlag: true,
            hasNext: hasNextPage,
          })
        })
        .catch((error) => {
          self.setData({
            hasNext: false,
            loadFlag: true,
          })
        })
    })
  },
}

module.exports = {
  selectDevice,
}
