/**
 * 根据配网来源，获取对应配网指引相关底层方法
 */
import { requestService } from '../../../../utils/requestService'
import { getStamp, getReqId } from 'm-utilsdk/index'
import paths from '../../../../utils/paths'
const WX_LOG = require('../../../../utils/log')
var deviceGuide = {
  /*
   * 获取后确权指引信息
   * @param {*} type
   * @param {*} sn8
   * @param {*} A0
   * @param {*} enterprise
   */
  getGuideInfo(type, sn8, A0, enterprise = '0000') {
    type = type.includes('0x') ? type.substr(2, 2) : type
    let code = sn8
    console.log('type and sn8', type, sn8, A0)
    // 部分设备使用A0获取后确权指引
    const A0GuideList = [
      'DA', // 波轮洗衣机
      'DB', // 滚筒洗衣机
      'DC', // 干衣机
      'D9', // 复式洗衣机
      '46', // 衣物护理柜
      '47', // 鞋盒
    ]
    if (A0GuideList.includes(type) && A0) {
      // 使用A0获取确权指引
      code = A0
    }
    return new Promise((resolve, reject) => {
      let reqData = {
        category: type,
        code: code,
        enterprise: enterprise,
      }
      requestService
        .request('getIotConfirmInfoV2', reqData)
        .then((resp) => {
          WX_LOG.info('请求后确权指引成功', 'getIotConfirmInfoV2')
          resolve(resp)
        })
        .catch((error) => {
          WX_LOG.error('请求后确权指引失败', 'getIotConfirmInfoV2', error)
          reject(error)
        })
    })
  },
  //指引文案格式化显示
  guideDescFomat(guideDesc) {
    guideDesc = guideDesc.replace(/\n/g, '<br/>') //换行
    guideDesc = guideDesc.replace(/「(.+?)」/g, '<span class="orange-display-txt">$1</span>') //标澄
    guideDesc = guideDesc.replace(/#([a-zA-Z0-9]+?)#/g, '<span class="orange-display-txt digitalFont">$1</span>') //数码管字体
    return guideDesc
  },
}

module.exports = {
  deviceGuide,
}
