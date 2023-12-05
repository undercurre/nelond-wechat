import promisify from './weixin.promisify.js'
import { stringify } from '../qs'
// import httpImpl from '../../utils/http/http.impl'
/**
 * 微信开放api
 * url: https://developers.weixin.qq.com/miniprogram/dev/api/
 */
export default {
  /**
   * 微信 api Promisify 通用方法, 仅支持异步方法执行调用
   * @param apiName
   * @returns {Promise<any>}
   */
  wxApiExec(apiName, baseCfg = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof wx[apiName] === 'undefined') {
          console.error('https://developers.weixin.qq.com/miniprogram/dev/api/')
          throw Error('apiName is not exists.')
        }
        wx[apiName]({
          ...baseCfg,
          success(res) {
            resolve(res)
          },
          fail(e) {
            reject(e)
          },
        })
      } catch (e) {
        reject(e)
      }
    })
  },
  /**
   * 微信扫码二维码
   */
  wxScanCode(option = {}) {
    Object.assign(
      {
        onlyFromCamera: true, // true:摄像头扫二维码. false:识别相册中的照片二维码
      },
      option,
    )
    const api = promisify(wx.scanCode)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 微信获取图片
   * option {Object}
   *       count: 1,// 默认9
   *		 sizeType: ['original', 'compressed'],// 可以指定是原图还是压缩图，默认二者都有
   * 		 sourceType: ['album', 'camera'],// 可以指定来源是相册还是相机，默认二者都有
   */
  wxChooseImage(option = {}) {
    const api = promisify(wx.chooseImage)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /**
   * 将 拍照 的图片转为 对应的编码集(Base64) 字符串
   * @param filePaths 图片路径数组
   * @param needPrefix 返回的结果是否带上base64前缀
   * @returns {Promise<T | never>}
   */
  wxGetImgData(filePaths, needPrefix = true) {
    return new Promise((resolve, reject) => {
      // ios端某些情况不支持“img src=wxLocalResource://xxxxxxx”的方式，需将图片转换成base64格式
      let base64Array = []
      filePaths.forEach((path) => {
        let encodingStr = wx.getFileSystemManager().readFileSync(path, 'base64')
        if (!(encodingStr.indexOf('fail no such file') > -1 || encodingStr.indexOf('fail permission denied') > -1)) {
          // 不报错才存储
          if (encodingStr.indexOf('data:image') !== 0) {
            // 判断是否有这样的头部
            encodingStr = `${needPrefix ? 'data:image/jpeg;base64,' : ''}${encodingStr}`
          }
          base64Array.push(encodingStr)
        }
      })
      resolve(base64Array)
    })
  },
  /**
   * 微信预览图片
   */
  wxPreviewImage(current, urls = []) {
    const api = promisify(wx.previewImage)
    return api({
      current,
      urls,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 压缩图片接口，可选压缩质量
   */
  wxCompressImage(option = {}) {
    const api = promisify(wx.compressImage)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 拍摄视频或从手机相册中选视频。
   * option {Object}
   * 		sourceType, Array<string>, 视频来源选择
   * 		compressed, boolean, 是否压缩所选择的视频文件
   * 		maxDuration, number, 拍摄视频最长拍摄时间，单位秒
   * 		camera, string, 默认拉起的是前置或者后置摄像头。部分 Android 手机下由于系统 ROM 不支持无法生效
   */
  wxChooseVideo(
    option = {
      sourceType: ['album', 'camera'],
      compressed: true,
      maxDuration: 60,
      camera: 'back',
    },
  ) {
    const api = promisify(wx.chooseVideo)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 拍摄或从手机相册中选择图片或视频。此方法专用获取视频，图片移步wxChooseImage方法
   * option {Object}
   * 		sourceType, Array<string>, 视频来源选择
   * 		compressed, boolean, 是否压缩所选择的视频文件
   * 		maxDuration, number, 拍摄视频最长拍摄时间，单位秒
   * 		camera, string, 默认拉起的是前置或者后置摄像头。部分 Android 手机下由于系统 ROM 不支持无法生效
   */
  wxChooseMedia(
    option = {
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
    },
  ) {
    const api = promisify(wx.chooseMedia)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 将本地资源上传到服务器。客户端发起一个 HTTPS POST 请求，其中 content-type 为 multipart/form-data。
   * 微信上传图片
   * option {Object}
   * 		url,String,开发者服务器地址
   * 		filePath,String,要上传文件资源的本地路径(通过chooseImage获取)
   * 		name,String,文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容
   */
  wxUploadFile(option = {}) {
    const api = promisify(wx.uploadFile)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 使用微信内置地图查看位置
   */
  wxOpenLocation(option = {}) {
    const api = promisify(wx.openLocation)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 获取当前的地理位置、速度。当用户离开小程序后，此接口无法调用
   */
  wxGetLocation(option = {}) {
    const api = promisify(wx.getLocation)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /**
   * 打开地图选择位置
   */
  // wxChooseLocation(option = {}) {
  // 	const api = promisify(wx.chooseLocation);
  // 	return api(option).then(res => {
  // 		return Promise.resolve(res);
  // 	}).catch(e => {
  // 		return Promise.reject(e);
  // 	})
  // },

  wxGetSetting(option = {}) {
    const api = promisify(wx.getSetting)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 发起微信支付
   */
  wxRequestPayment(option = {}) {
    const api = promisify(wx.requestPayment)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 提前向用户发起授权请求。调用后会立刻弹窗询问用户是否同意授权小程序使用某项功能或获取用户的某些数据，但不会实际调用对应接口。如果用户之前已经同意授权，则不会出现弹窗，直接返回成功。
   */
  wxAuthorize(option = {}) {
    const api = promisify(wx.authorize)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 批量添加卡券。只有通过 认证 的小程序或文化互动类目的小游戏才能使用。
   */
  wxAddCard(option = {}) {
    const api = promisify(wx.addCard)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 查看微信卡包中的卡券。只有通过 认证 的小程序或文化互动类目的小游戏才能使用。
   * option {Object}
   */
  wxOpenCard(option = {}) {
    const api = promisify(wx.openCard)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 获取全局唯一的文件管理器，可用于本地图片转base64
   * @param option
   * @return {Promise<T | never>}
   */
  wxGetFileSystemManager(option = {}) {
    const api = promisify(wx.getFileSystemManager)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 更新转发属性
   * @param option
   * @return {Promise<T | never>}
   */
  wxUpdateShareMenu(option = {}) {
    const api = promisify(wx.getFileSystemManager)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 显示当前页面的转发按钮
   * @param option
   * @return {Promise<T | never>}
   */
  wxShowShareMenu(option = {}) {
    const api = promisify(wx.showShareMenu)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 隐藏转发按钮
   * @param option
   * @return {Promise<T | never>}
   */
  wxHideShareMenu() {
    wx.hideShareMenu()
    return Promise.resolve(true)
  },

  /**
   * 获取转发详细信息
   * @param option
   * @return {Promise<T | never>}
   */
  wxGetShareInfo(option = {}) {
    const api = promisify(wx.getShareInfo)
    return api(option)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面
   * @param option
   * @return {Promise<T | never>}
   */
  wxSwitchTab(pathName, paramObject = {}) {
    /**
     * 大多数的跳转场景只是简单的传一个路径url的字符串,为简化调用方式
     */
    let pathNameAndQs = Object.keys(paramObject).length ? `${pathName}?${stringify(paramObject)}` : pathName
    const api = promisify(wx.switchTab)
    return api({
      url: pathNameAndQs.toString(),
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 关闭所有页面，打开到应用内的某个页面
   * @param option
   * @return {Promise<T | never>}
   */
  wxReLaunch(pathName, paramObject = {}) {
    /**
     * 大多数的跳转场景只是简单的传一个路径url的字符串,为简化调用方式
     */
    let pathNameAndQs = Object.keys(paramObject).length ? `${pathName}?${stringify(paramObject)}` : pathName
    const api = promisify(wx.reLaunch)
    return api({
      url: pathNameAndQs.toString(),
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 关闭当前页面，跳转到应用内的某个页面。但是不允许跳转到 tabbar 页面。
   * @param option
   * @return {Promise<T | never>}
   */
  wxRedirectTo(pathName, paramObject = {}) {
    /**
     * 大多数的跳转场景只是简单的传一个路径url的字符串,为简化调用方式
     */
    let pathNameAndQs = Object.keys(paramObject).length ? `${pathName}?${stringify(paramObject)}` : pathName
    const api = promisify(wx.redirectTo)
    return api({
      url: pathNameAndQs.toString(),
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 	保留当前页面，跳转到应用内的某个页面。但是不能跳到 tabbar 页面。
   * @param pathName {String}, paramObject {Ojbect}
   * @return {Promise<T | never>}
   */
  wxNavigateTo(pathName, paramObject = {}) {
    /**
     * 大多数的跳转场景只是简单的传一个路径url的字符串,为简化调用方式
     */
    let pathNameAndQs = Object.keys(paramObject).length ? `${pathName}?${stringify(paramObject)}` : pathName
    const api = promisify(wx.navigateTo)
    return api({
      url: pathNameAndQs.toString(),
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 关闭当前页面，返回上一页面或多级页面
   * @param delta {Number}
   * @return {Promise<T | never>}
   */
  wxNavigateBack(delta = 1) {
    const api = promisify(wx.navigateBack)
    return api({
      delta: delta,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 跳转到指定微信小程序
   * @param options {Object}
   * @return {Promise<T | never>}
   */
  wxNavigateToMiniProgram(options = {}) {
    const api = promisify(wx.navigateToMiniProgram)
    return api(options)
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 动态设置当前页面的标题
   * @param title
   * @return {Promise<T | never>}
   */
  wxSetNavigationBarTitle(title = '') {
    const api = promisify(wx.setNavigationBarTitle)
    return api({
      title,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 拨打电话
   * @param title
   * @return {Promise<T | never>}
   */
  wxMakePhoneCall(phoneNumber = '') {
    const api = promisify(wx.makePhoneCall)
    return api({
      phoneNumber,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 下载文件
   * @param url {String}
   * @param headerConf {Object}
   * @param filePath {String}
   * @returns {Promise<T | never>}
   */
  wxDownloadFile(url, headerConf, filePath) {
    const api = promisify(wx.downloadFile)
    return api({
      url,
      header: headerConf,
      filePath,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 打开本地文档
   * @param filePath {String}
   * @returns {Promise<T | never>}
   */
  wxOpenDocument(filePath) {
    const api = promisify(wx.openDocument)
    return api({
      filePath,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /* ================================================================================================================================================================ */
  /* ================================================================【以下6个方法的命名前面不包含[wx]开头】============================================================== */
  /* ================================================================================================================================================================ */

  /**
   * 显示loading
   * @param title
   * @param mask
   * @return {Promise<T | never>}
   */
  showLoading(title = '', mask = true) {
    const api = promisify(wx.showLoading)
    return api({
      title,
      mask,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 关闭loading
   * @return {Promise<T | never>}
   */
  closeLoading() {
    const api = promisify(wx.hideLoading)
    return api()
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /**
   * 用封装好的showLoading
   * @param title
   * @param icon
   * @param duration
   * @return {Promise<T | never>}
   */
  showToast(title = '', icon = 'none', image, duration = 1500) {
    this.closeLoading()
    const api = promisify(wx.showToast)
    return api({
      title: title,
      icon: icon,
      image: image,
      duration: duration,
      mask: true,
    })
      .then((res) => {
        setTimeout(() => {
          return Promise.resolve(res)
        }, duration)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 小程序自带的ActionSheet, 最多支持list的length为6
   * @param list
   * @param key
   * @param btnColor
   * @return {Promise<T | never>}
   */
  showActionSheet(list, key = 'name', btnColor = '#333333') {
    let stringList = []

    if (list.length > 6) return Promise.reject(false)
    for (let item of list) {
      stringList.push(item[key])
    }
    const api = promisify(wx.showActionSheet)
    return api({
      itemList: stringList,
      itemColor: btnColor,
    })
      .then((res) => {
        return Promise.resolve(list[res.tapIndex])
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 显示弹框
   * @param content
   * @param title
   * @param cancelText
   * @param cancelColor
   * @param confirmText
   * @param confirmColor
   * @return {Promise<T | never>}
   */
  showModal(
    content = '',
    title = '',
    cancelText = '取消',
    confirmText = '确定',
    showCancel = true,
    cancelColor = '#999999',
    confirmColor = '#B35336',
  ) {
    this.closeLoading()
    const api = promisify(wx.showModal)
    return api({
      title,
      content,
      cancelText,
      cancelColor,
      confirmText,
      confirmColor,
      showCancel,
    })
      .then((res) => {
        return Promise.resolve(res.confirm)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },

  /**
   * 显示弹框，基于小程序showModal屏蔽取消按钮的实现
   * @param content
   * @param title
   * @param cancelText
   * @param cancelColor
   * @param confirmText
   * @param confirmColor
   * @param showCancel
   * @return {Promise<T | never>}
   */
  showAlert(content = '', title = '', confirmText = '确定', confirmColor = '#B35336') {
    this.closeLoading()
    const api = promisify(wx.showModal)
    return api({
      title,
      content,
      confirmText,
      confirmColor,
      showCancel: false,
    })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /**
   * 设置微信支付参数
   * @param params 设置所需参数
   * @param payParams 支付所需参数
   * @returns {Promise}
   */
  // wxSetPayConfig(params, payParams) {
  // 	return new Promise((resolve, reject) => {
  // 		if (payParams
  // 			&& payParams.hasOwnProperty('paySign')
  // 			&& payParams.paySign) {
  // 			this.invoke(payParams).then(re => {
  // 				resolve(re);
  // 			});
  // 		}
  // 		// payType: true 工单支付 false: 订单支付 (洗悦家)
  // 		let payType = params.hasOwnProperty('payType') && params.payType === 'progressPay';
  // 		if (payType) {
  // 			delete params.payType;
  // 		}

  // 		let urlStr = payType
  // 			? this.conf.baseUrl + this.conf.progressPay
  // 			: this.conf.xyjBaseUrl + 'order/applyAppletPrePay';
  // 		if (payType) {
  // 			httpImpl.postRawJson(urlStr, params).then(data => {
  // 				// TODO: 未使用到未调试
  // 				let payParams = {};

  // 				if (data.code && parseInt(data.code) === 0) {
  // 					payParams = data.data;
  // 					this.invoke(payParams).then(re => {
  // 						resolve(re);
  // 					});
  // 				} else {
  // 					reject({name: 'failed', message: data.msg});
  // 				}
  // 			}).catch((e) => {
  // 				reject(e);
  // 			})
  // 		} else {
  // 			httpImpl.get(urlStr, params).then(res => {
  // 				if (res.status && !res.error) {
  // 					// 成功
  // 					let payParams = {},
  // 						{code, data, msg} = res.content;
  // 					if (Number(code) === 0 && data && data.hasOwnProperty('orderId')) {
  // 						payParams = data;
  // 						this.invoke(payParams).then(re => {
  // 							resolve(re);
  // 						});
  // 					} else {
  // 						reject({name: '操作失败', message: msg || '出现意料之外的错误'});
  // 					}
  // 				} else {
  // 					// 失败
  // 					reject({name: '操作失败', message: res.error.detailMsg || '出现意料之外的错误'});
  // 				}
  // 			});
  // 		}
  // 	});
  // },
  invoke(params) {
    // const appId = params.appId || params.appid;
    return new Promise((resolve) => {
      wx.requestPayment({
        timeStamp: String(params.timeStamp), // 时间戳，自1970年以来的秒数
        nonceStr: params.nonceStr, // 随机串
        package: params.packageData || params.package,
        signType: params.signType, // 签名类型，默认为MD5，支持HMAC-SHA256和MD5。注意此处需与统一下单的签名类型一致
        paySign: params.paySign, // 微信签名
        success: function (res) {
          resolve(true)
        },
        fail: function (res) {
          resolve(false)
        },
      })
    })
  },

  /**
   * 小程序版本强制更新
   */
  forceUpdateApp() {
    const updateManager = wx.getUpdateManager()
    //检测版本更新
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          // 更新新版本
          this.showLoading('应用更新中...')
          updateManager.applyUpdate()
        })
        updateManager.onUpdateFailed(() => {
          // 新版本下载失败
          this.showAlert('请您删除当前小程序，到微信 “发现-小程序” 页，重新搜索打开呦~', '已经有新版本咯~')
        })
      }
    })
  },
  /* 
	小程序设置缓存
	*/
  wxSetStorage(key, data) {
    const api = promisify(wx.setStorage)
    return api({ key, data })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /* 
	小程序获取缓存
	*/
  wxGetStorage(key) {
    const api = promisify(wx.getStorage)
    return api({ key })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
  /* 
	小程序清楚缓存
	*/
  wxRemoveStorage(key) {
    const api = promisify(wx.removeStorage)
    return api({ key })
      .then((res) => {
        return Promise.resolve(res)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
  },
}
