import { envMap, setEnv, mzaioDomain, isNative } from '../config/index'
import { storage } from './storage'
import { Logger } from './log'

const deviceInfo = wx.getDeviceInfo()
Logger.debug('deviceInfo', deviceInfo)

const accountInfo = wx.getAccountInfoSync()
Logger.debug('accountInfo', accountInfo)

/**
 * 返回小程序首页
 * FIXME wx.switchTab 在IOS下会出现中间页面
 */
export function goHome() {
  wx.switchTab({ url: `/pages/index/index` })
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

/**
 * 找到到指定页面路径的最早栈历史位置，并返回,若找不到直接返回首页
 * @param page 页面路径
 */
export function goBackPage(page: string) {
  const pageList = getCurrentPages()
  const index = pageList.findIndex((item) => page.includes(item.route))

  console.debug('---rebackPage---', pageList, page, index)

  // 寻找配网入口页面的栈历史位置，并返回
  wx.navigateBack({
    delta: pageList.length - index - 1,
  })
}

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

/**
 * 是否正式版，app模式为release
 */
export function isRelease() {
  return getEnvVersion() === 'release'
}

/**
 * 获取小程序环境版本  develop：开发版    trial：体验版   release：正式版
 */
export function getEnvVersion() {
  return accountInfo.miniProgram.envVersion
}

/**
 * 线上小程序版本号
 */
export function getVersion() {
  let version = accountInfo.miniProgram.version
  if (isNative()) {
    const appInfo = wx.getAppBaseInfo()

    // @ts-ignore
    version = appInfo.host.appVersion
  }

  return version
}

/**
 * 重置当前小程序的运行环境设置
 */
export function resetCurrentEnv() {
  const envStr = envMap[getEnvVersion()]

  setCurrentEnv(envStr)
}

/**
 * 根据小程序当前运行环境设置不同的env配置
 * 开发版、体验版使用dev配置
 * 正式版使用prod配置
 */
export function setCurrentEnv(env?: ENV_TYPE) {
  const envVersion = getEnvVersion()
  const storageKey = `${envVersion}_env`
  let envStr = env ?? (storage.get(storageKey) as ENV_TYPE)

  if (!envStr) {
    envStr = envMap[envVersion]
  }

  // 设置局域网云服务地址
  if (envStr === 'Lan') {
    mzaioDomain.Lan = storage.get('mzaioDomainLan') as string
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

// 是否已登录（token是否存在且未过期）
export function isLogined() {
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

/**
 * 判断文件/目录是否存在
 * @param path
 */
function isFileExit(path: string) {
  const fileManager = wx.getFileSystemManager()

  return new Promise((resolve) => {
    fileManager.access({
      path,
      success(res) {
        console.log('isFileExit', res)
        resolve(true)
      },
      fail(err) {
        Logger.error('isFileExit', err)
        resolve(false)
      },
    })
  })
}

/**
 * 封装wx.downloadFile,支持promise
 * @param fileUrl
 */
function downloadFile(fileUrl: string) {
  const fileArr = fileUrl.split('/')

  return new Promise<{ success: boolean; filePath: string; msg: string }>((resolve) => {
    wx.downloadFile({
      url: fileUrl,
      filePath: `${wx.env.USER_DATA_PATH}/${fileArr[fileArr.length - 1]}`, // 指定下载的文件路径名称，防止产生随机数名称的文件显示
      success(res) {
        console.debug('downloadFile', res)

        if (res.statusCode === 200) {
          resolve({
            success: true,
            filePath: res.filePath,
            msg: '下载文件成功',
          })
        } else {
          Logger.error('downloadFile-success', res)
          resolve({
            success: false,
            filePath: '',
            msg: '下载文件失败',
          })
        }
      },
      fail(error) {
        Logger.error('downloadFile-fail', error)
        resolve({
          success: false,
          filePath: '',
          msg: '下载文件失败',
        })
      },
    })
  })
}
/**
 * 展示远程文档
 * @param fileUrl 文件远程地址
 */
export async function showRemoteDoc(fileUrl: string) {
  let isSuccess = false

  try {
    showLoading()
    let fileLocalPath = (storage.get(fileUrl) as string) || '' // 文件下载后的本地路径，检查是否已经下载过这个文件

    console.debug('showRemoteDoc,fileUrl', fileUrl, 'fileLocalPath', fileLocalPath)

    // 如已经下载过该文件，检查文件是否存在
    if (fileLocalPath) {
      const isExit = await isFileExit(fileLocalPath)

      // 若缓存的文件不存在，清除storage标志
      if (!isExit) {
        fileLocalPath = ''
        storage.remove(fileUrl)
      }
    }

    // 下载远程文件
    if (!fileLocalPath) {
      const downloadRes = await downloadFile(fileUrl)

      if (downloadRes.success) {
        fileLocalPath = downloadRes.filePath
        storage.set(fileUrl, fileLocalPath, 3 * 24 * 60 * 60) // 缓存1个月
      } else {
        throw downloadRes.msg
      }
    }

    const openRes = await wx
      .openDocument({
        filePath: fileLocalPath,
      })
      .catch((err) => err)

    if (openRes.errMsg.includes('ok')) {
      console.log('打开文档成功', openRes)
      isSuccess = true
    } else {
      Logger.error('openDocument-fail', openRes)
      throw '打开文档失败'
    }
  } catch (err) {
    wx.showToast({
      title: err as string,
      icon: 'error',
    })
    Logger.error('showRemoteDoc', err)
  }

  hideLoading()

  return isSuccess
}
