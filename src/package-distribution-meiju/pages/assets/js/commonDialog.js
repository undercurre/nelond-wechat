import Dialog from '@vant/weapp/dialog/dialog'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paths = require('../../../utils/paths')
const commonDialog = {
  /**
   * 查看指引通用方法
   * @param {*} obj
   * obj: {
   *  title: '',
   *  message: '',
   *  type: 'location',
   *  permissionTypeList: ''
   * }
   */
  showCommonDialog(obj) {
    Dialog.confirm({
      title: obj.title || '',
      message: obj.message,
      confirmButtonText: obj.confirmButtonText,
      confirmButtonColor: obj.confirmButtonColor,
      showCancelButton: true,
      // cancelButtonColor: obj.cancelButtonColor,
      messageAlign: 'left',
    })
      .then(() => {
        if (obj.type === 'location') {
          wx.navigateTo({
            url: paths.locationGuide + `?permissionTypeList=${JSON.stringify(obj.permissionTypeList)}`,
          })
        }
        if (obj.type === 'blue') {
          wx.navigateTo({
            url: paths.blueGuide + `?permissionTypeList=${JSON.stringify(obj.permissionTypeList)}`,
          })
        }
      })
      .catch(() => {})
  },
}

module.exports = {
  commonDialog,
}
