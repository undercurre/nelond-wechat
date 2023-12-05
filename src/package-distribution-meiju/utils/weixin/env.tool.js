const versionCodeForWX = __wxConfig && __wxConfig.envVersion

export default {
  /**
   * 判断小程序[体验、测试、正式]
   * @returns {string}, 返回一个【key】
   */
  getRunEnv() {
    const version = this.getVersionCodeForWX(),
      isProd = __wxConfig && __wxConfig.accountInfo.appId === 'wx0f400684c55f3cdf'
    if (isProd) {
      return 'PROD'
    }

    switch (version) {
      case 'TRIAL':
        // 体验 -> sit
        return 'SIT'
      case 'DEVELOP':
        // 开发 -> dev
        return 'SIT'
      case 'RELEASE':
        // 正式 -> uat
        return 'SIT'
      default:
        return 'SIT'
    }
  },

  /**
   * 获取基于微信定义的版本名称
   * @returns {*}
   */
  getVersionCodeForWX() {
    return versionCodeForWX.toUpperCase()
  },
}
