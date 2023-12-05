export const wxGetSystemInfo = () => {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success(res) {
        resolve(res)
      },
      fail(error) {},
    })
  })
}
export const wxGetOpenSetting = () => {
  return new Promise((resolve) => {
    wx.openSetting({
      success(res) {
        resolve(res)
      },
    })
  })
}
export const wxAuthorize = (attr) => {
  return new Promise((resolve) => {
    wx.authorize({
      scope: `scope.${attr}`,
      success(res) {
        resolve(res)
      },
    })
  })
}
