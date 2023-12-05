/**
 * 设置
 * v 值value
 */
const setTokenStorage = (token) => {
  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000
  let timestamp = Date.parse(new Date())
  let appTokenExpiration = timestamp + 2 * hour // 2小时美居APP  token过期，重新获取
  let autoLoginExpiration = timestamp + 30 * day // 30天内自动登录
  // let expiration = timestamp + 10000
  const setStorageList = [
    {
      key: 'MPTOKEN',
      value: token,
    },
    {
      key: 'MPTOKEN_EXPIRATION',
      value: appTokenExpiration,
    },
    {
      key: 'MPTOKEN_AUTOLOGIN_EXPIRATION',
      value: autoLoginExpiration,
    },
  ]
  wx.nextTick(() => {
    for (let i = 0, len = setStorageList.length; i < len; i++) {
      wx.setStorage({
        key: setStorageList[i].key,
        data: setStorageList[i].value,
      })
    }
  })
}
//设置弹框显示的间隔时间
const setDialogIntervalTime = (v) => {
  return new Promise((resolve) => {
    let timestamp = Date.parse(new Date())
    let expiration = timestamp + 2 * 60 * 60 * 1000 //2小时重新显示弹框
    // let expiration = timestamp + 60*1000 //测试1分钟重新显示弹框
    wx.setStorageSync(v, expiration)
    resolve()
  })
}
//设置弹框显示的间隔时间
const setToastIntervalTime = (v, time) => {
  return new Promise((resolve) => {
    let timestamp = Date.parse(new Date())
    let expiration = timestamp + time * 60 * 60 * 1000 //24小时重新显示弹框
    wx.setStorageSync(v, expiration)
    resolve()
  })
}
//校验间隔时间是否超过两小时
const checkDialogIntervalTime = (v) => {
  let deadtime = parseInt(wx.getStorageSync(v))
  let timestamp = Date.parse(new Date())
  return deadtime > timestamp ? true : false
}

//校验弹框的间隔为一天一次
const checkDialogOneDayOneTime = (v) => {
  let deadtime = wx.getStorageSync(v)
  // let timestamp = Date.parse(new Date())
  let nowTime = new Date()
  let strTime = nowTime.toLocaleDateString()
  console.log('校验每天一次', strTime, deadtime)
  if (!deadtime) return true
  return deadtime === strTime ? false : true
}

//设置弹框每天显示一次
const setToastIntervalOneDayOneTime = (v) => {
  return new Promise((resolve) => {
    let nowTime = new Date()
    let strTime = nowTime.toLocaleDateString()
    console.log('设置每天一次', strTime)
    wx.setStorageSync(v, strTime)
    resolve()
  })
}
/**
 * 获取
 * k 键key
 */
const checkTokenExpir = (mptoken, MPTOKEN_EXPIRATION) => {
  // return new Promise((resolve,reject) => {
  // let mptoken = wx.getStorageSync('MPTOKEN')
  // let deadtime = parseInt(wx.getStorageSync('MPTOKEN_EXPIRATION'))

  let deadtime = parseInt(MPTOKEN_EXPIRATION)
  let timestamp = Date.parse(new Date())
  return mptoken && deadtime > timestamp ? true : false
  // })
}

/**
 * 删除
 */
const remove = (k1, k2) => {
  wx.removeStorageSync(k1)
  wx.removeStorageSync(k2)
}

/**
 * 清除所有key
 */
const clearStorageSync = () => {
  wx.clearStorageSync()
}
/**
 * 清除除多云外的别的参数
 */
const removeStorageSync = () => {
  let StorageInfoList = wx.getStorageInfoSync().keys
  let filterList = ['cloudRegion', 'cloudGlobalModule']
  let clearInfoList = StorageInfoList.filter((a, i) => {
    return filterList.every((f) => f != a)
  })
  clearInfoList.map((item) => {
    wx.removeStorageSync(item)
  })
}
const setIsAutoLogin = (isAutoLogin) => {
  wx.nextTick(() => {
    wx.setStorage({
      key: 'ISAUTOLOGIN',
      data: isAutoLogin,
    })
  })
}

/**
 * 校验自动登录过期时间
 *
 */
const isAutoLoginTokenValid = (MPTOKEN_AUTOLOGIN_EXPIRATION, MPTOKEN_EXPIRATION) => {
  // return new Promise((resolve,reject) => {
  // const autoLoginDeadTime = parseInt(wx.getStorageSync('MPTOKEN_AUTOLOGIN_EXPIRATION'))
  // let appTokenDeadTime = parseInt(wx.getStorageSync('MPTOKEN_EXPIRATION'))
  const autoLoginDeadTime = parseInt(MPTOKEN_AUTOLOGIN_EXPIRATION)
  let appTokenDeadTime = parseInt(MPTOKEN_EXPIRATION)
  const timestamp = Date.parse(new Date())
  if (!autoLoginDeadTime) {
    return appTokenDeadTime && appTokenDeadTime > timestamp ? true : false
  }
  return autoLoginDeadTime > timestamp ? true : false
  // })
}

module.exports = {
  setTokenStorage,
  checkTokenExpir,
  remove,
  clearStorageSync,
  setDialogIntervalTime,
  checkDialogIntervalTime,
  setToastIntervalTime,
  setToastIntervalOneDayOneTime,
  checkDialogOneDayOneTime,
  setIsAutoLogin,
  isAutoLoginTokenValid,
  removeStorageSync,
}
