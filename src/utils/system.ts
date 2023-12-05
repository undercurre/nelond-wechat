import { envMap, setEnv } from '../config/index'
import { storage } from './storage'
import { Logger } from './log'
// import QQMapWX from '../lib/qqmap-wx-jssdk'
// import { QQMapConfig } from '../config/index'

const deviceInfo = wx.getDeviceInfo()
Logger.debug('deviceInfo', deviceInfo)

const accountInfo = wx.getAccountInfoSync()
Logger.debug('accountInfo', accountInfo)

/**
 * 返回小程序首页
 * FIXME wx.switchTab 在IOS下会出现中间页面
 */
export function goHome() {
  const defaultPage = (storage.get<string>('defaultPage') ?? '') as string
  wx.switchTab({ url: `/pages/${defaultPage}/index` })
}

export function setNavigationBarAndBottomBarHeight() {
  const { statusBarHeight, platform, windowWidth, windowHeight, safeArea, system } = wx.getSystemInfoSync()
  const { top, height } = wx.getMenuButtonBoundingClientRect()

  // 手机系统
  storage.set('system', system, null)
  // 屏幕高度
  storage.set('windowHeight', windowHeight, null)
  // 状态栏高度
  storage.set('statusBarHeight', statusBarHeight, null)
  // 胶囊按钮高度 一般是32 如果获取不到就使用32
  storage.set('menuButtonHeight', height ? height : 32, null)
  // px和rpx比例 px转rpx: px / divideRpxByPx,rpx转px：divideRpxByPx * rpx
  storage.set('divideRpxByPx', windowWidth / 750, null)
  // 底部安全区高度
  storage.set('bottomBarHeight', windowHeight - safeArea.bottom, null)

  // 判断胶囊按钮信息是否成功获取
  if (top && top !== 0 && height && height !== 0) {
    const navigationBarHeight = (top - statusBarHeight) * 2 + height
    // 导航栏高度
    storage.set('navigationBarHeight', navigationBarHeight, null)
  } else {
    storage.set('navigationBarHeight', platform === 'android' ? 48 : 40, null)
  }
}

/**
 * 获取当前页面url
 */
export function getCurrentPageUrl() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  return currentPage.route
}

/**
 * 获取当前页面参数
 */
export function getCurrentPageParams() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  return currentPage.options as IAnyObject
}

// export function getPosition() {
//   return new Promise<{ lat: number; lng: number; address: string }>((resolve) => {
//     const myQQMapWX = new QQMapWX({
//       key: QQMapConfig.key,
//     })

//     wx.getFuzzyLocation({
//       type: 'wgs84',
//       success(res) {
//         console.log('getFuzzyLocation', res)
//         const latitude = res.latitude
//         const longitude = res.longitude
//         myQQMapWX.reverseGeocoder({
//           sig: QQMapConfig.sig,
//           location: {
//             latitude: latitude,
//             longitude: longitude,
//           },
//           success(geoCoderRes: IAnyObject) {
//             console.log('reverseGeocoder', geoCoderRes)
//             const addr = geoCoderRes.result.address_component
//             const result = addr.province + addr.city + addr.district
//             storage.set('position_location', result)

//             resolve({
//               lat: res.latitude,
//               lng: res.longitude,
//               address: result,
//             })
//           },
//           fail: function () {
//             console.log('reverseGeocoder:获取地理位置失败')
//           },
//         })
//       },
//       fail() {
//         console.log('getFuzzyLocation::微信定位失败')
//       },
//     })
//   })
// }

let loadingNum = 0 // 正在等待loading的个数
/**
 * 显示loading
 */
export function showLoading(title = '加载中...') {
  loadingNum++

  if (loadingNum > 1) {
    return
  }
  wx.showLoading({
    title,
    mask: true,
  })
}

/**
 * 隐藏loading
 */
export function hideLoading() {
  loadingNum > 0 && loadingNum-- // 防止胡乱调用loadingNum，导致loadingNum为负数

  loadingNum === 0 && wx.hideLoading()
}

export function isRelease() {
  return accountInfo.miniProgram.envVersion === 'release'
}

/**
 * 根据小程序当前运行环境设置不同的env配置
 * 开发版、体验版使用dev配置
 * 正式版使用prod配置
 */
export function setCurrentEnv(env?: ENV_TYPE) {
  const info = wx.getAccountInfoSync()
  const { envVersion } = info.miniProgram
  const storageKey = `${envVersion}_env`
  let envStr = env ?? (storage.get(storageKey) as ENV_TYPE)

  if (!envStr) {
    envStr = envMap[envVersion]
  }

  storage.set(storageKey, envStr)
  console.log('当前环境：', envStr)
  setEnv(envStr)
}

export function isAndroid() {
  return deviceInfo.platform === 'android'
}

export function isAndroid10Plus() {
  const systemVersion = parseInt(deviceInfo.system.toLowerCase().replace(deviceInfo.platform, ''))
  const isAndroid10Plus = isAndroid() && systemVersion >= 10 // 判断是否Android10+或者是鸿蒙

  return isAndroid10Plus
}

export function checkWifiSwitch() {
  // 安卓端需要检测wifi开关，否则无法调用wifi接口
  if (isAndroid()) {
    const systemSetting = wx.getSystemSetting()

    if (!systemSetting.wifiEnabled) {
      wx.showToast({
        title: '请打开手机Wi-Fi',
        icon: 'none',
      })
    }

    return systemSetting.wifiEnabled
  }

  return true
}

export function isLogon() {
  return Boolean(storage.get<string>('token'))
}

// 是否处于开发工具调试模式（PC端）
export function isDevMode() {
  const { platform } = wx.getSystemInfoSync()
  return platform === 'devtools'
}

export function shouNoNetTips() {
  wx.showToast({
    title: '当前无法连接网络\n请检查网络设置',
    icon: 'none',
    duration: 2500,
  })
}
