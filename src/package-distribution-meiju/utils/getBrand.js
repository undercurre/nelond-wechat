export default function () {
  const appId = __wxConfig && __wxConfig.accountInfo.appId
  switch (appId) {
    case 'wx811d6ddf2721b8cf':
      // colmo正式环境
      return 'colmo'
    case 'wx8d4b381ead295b89':
      // colmo测试环境
      return 'colmo'
    case 'wxb12ff482a3185e46':
      // 美居lite
      return 'meiju'
    case 'wx48f0a776e60390cf':
      // 东芝 测试环境
      return 'toshiba'
    case 'wx91c730323cc13653':
      // 东芝 正式环境
      return 'toshiba'
    default:
      return 'meiju'
  }
}
