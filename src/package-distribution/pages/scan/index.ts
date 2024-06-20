import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import dayjs from 'dayjs'
import { deviceBinding, spaceStore } from '../../../store/index'
import { bleDevicesBinding, bleDevicesStore } from '../../store/bleDeviceStore'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import {
  checkWifiSwitch,
  delay,
  hideLoading,
  isAndroid,
  isConnect,
  Logger,
  shouNoNetTips,
  showLoading,
  strUtil,
} from '../../../utils/index'
import { checkDevice, getGwNetworkInfo, getUploadFileForOssInfo, queryWxImgQrCode } from '../../../apis/index'
import { isLan } from '../../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding, bleDevicesBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {
    // 进入扫码页的入口
    scanType: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _isFromWxScan: false, // 是否通过微信扫码直接进入
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
    _needCheckCamera: true, // 是否需要重新检查摄像头权限
    _isBlePermit: false, // 微信是否已经授权蓝牙
    isShowPage: false,
    isShowGatewayList: false, // 是否展示选择网关列表弹窗
    isShowNoGatewayTips: false, // 是否展示添加网关提示弹窗
    isScan: false, // 是否正在解析扫码结果
    isFlash: false,
    selectGateway: {
      deviceId: '',
      sn: '',
    },
    deviceInfo: {
      icon: '/package-distribution/assets/scan/light.png',
    } as IAnyObject,
  },

  computed: {
    gatewayList(data) {
      const allDeviceList: Device.DeviceItem[] = (data as IAnyObject).allDeviceList || []

      return allDeviceList.filter((item) => item.deviceType === 1)
    },
    isShowTips(data) {
      return (data.scanType === 'subdevice' && data._isBlePermit) || data.scanType === 'gateway'
    },
    tipsText(data: IAnyObject) {
      if (data.scanType === 'gateway') {
        return '找不到二维码，尝试手动添加'
      }

      if (!data.available) {
        return '打开手机蓝牙发现附近子设备'
      }

      return data.bleDeviceList?.length ? `搜索到${data.bleDeviceList.length}个附近的子设备` : '正在搜索附近子设备'
    },
  },

  lifetimes: {
    async ready() {
      Logger.debug('currentSpace', spaceStore.currentSpace, spaceStore.currentSpaceNameFull)

      bleDevicesBinding.store.reset()

      const params = wx.getEnterOptionsSync()
      Logger.log('scanPage', params)

      // 判断通过微信扫码直接进入该界面时,初始化scanType
      if (getCurrentPages().length === 1 && params.scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        Logger.log('scanUrl', scanUrl)

        if (!this.isValidLink(scanUrl)) {
          Toast('无效二维码')
          return
        }

        const pageParams = strUtil.getUrlParams(scanUrl)

        Logger.log('scanParams', pageParams)
        const modeMap = {
          '01': 'subdevice',
          '02': 'gateway',
          '10': 'screen',
        }

        this.setData({
          _isFromWxScan: true,
          scanType: modeMap[pageParams.mode as '01' | '02' | '10'],
        })
      }
    },
    detached() {
      bleDevicesStore.stopBLeDiscovery()
      wx.closeBluetoothAdapter()
      clearInterval(this.data._listenLocationTimeId)
    },
  },

  pageLifetimes: {
    show() {
      this.setData({
        isShowPage: true,
      })

      this.checkNet()

      // 子设备配网页，蓝牙权限及开关已开情况下
      this.data.scanType === 'subdevice' &&
        this.data._isBlePermit &&
        bleDevicesStore.available &&
        bleDevicesStore.startBleDiscovery()
    },
    hide() {
      // 由于非授权情况下进入页面，摄像头组件已经渲染，即使重新授权页无法正常使用，需要通过wx：if重新触发渲染组件
      this.setData({
        isShowPage: false,
      })

      bleDevicesStore.discovering && bleDevicesStore.stopBLeDiscovery()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    checkNet() {
      const isValidNet = isConnect()

      if (!isValidNet) {
        shouNoNetTips()
      }

      return isValidNet
    },

    /**
     * 手动添加网关
     */
    addGatewayManually() {
      this.bindGateway({ addType: 'manual' })
    },
    // 检查是否通过微信扫码直接进入该界面时判断场景值
    checkWxScanEnter() {
      const params = wx.getEnterOptionsSync()

      // 判断通过微信扫码直接进入该界面时判断场景值
      if (getCurrentPages().length === 1 && params.scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        Logger.log('scanUrl', scanUrl)

        this.handleScanUrl(scanUrl)

        return
      }
    },

    async selectGateway(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.gatewayList[index]

      if (item.onLineStatus === 0) {
        return
      }

      this.setData({
        selectGateway: {
          deviceId: item.deviceId,
          sn: item.sn,
        },
      })
    },

    confirmGateway() {
      if (this.data.deviceInfo.type === 'single') {
        this.addSingleSubdevice()
      } else {
        this.addNearSubdevice()
      }

      this.setData({
        isShowGatewayList: false,
      })
    },

    /**
     * 点击提示
     */
    clickTips() {
      // 没有打开系统蓝牙开关异常处理
      if (this.data.scanType === 'subdevice') {
        this.checkBlePermission()
      }
    },

    /**
     * 检查蓝牙使用权限
     */
    async checkBlePermission() {
      Logger.log('checkBlePermission', bleDevicesStore.available)
      // 没有打开系统蓝牙开关异常处理
      if (!bleDevicesStore.available) {
        Dialog.alert({
          message: '请打开手机蓝牙，用于发现附近的子设备',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })

        return false
      }

      const setting = await wx.getSetting()

      Logger.log('appAuthorizeSetting', setting)

      const isAuth = setting.authSetting['scope.bluetooth']

      if (!isAuth) {
        Dialog.alert({
          message: '请授权使用蓝牙，否则无法正常扫码配网',
          showCancelButton: true,
          cancelButtonText: '返回',
          confirmButtonText: '去设置',
          confirmButtonOpenType: 'openSetting',
        }).catch(() => {
          this.goBack() // 拒绝授权摄像头，则退出当前页面
        })
      }

      return isAuth
    },

    async initBle() {
      // 若已经进入搜索蓝牙状态或者非添加子设备模式，无需重复初始化
      if (this.data.scanType !== 'subdevice' || bleDevicesStore.discovering) {
        return
      }

      // 初始化蓝牙模块
      const openBleRes = (await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((err: WechatMiniprogram.BluetoothError) => err)) as IAnyObject

      Logger.log('scan-openBleRes', openBleRes)

      // 优先判断微信授权设置
      // 判断是否授权蓝牙 安卓、IOS返回错误格式不一致
      if (openBleRes.errno === 103 || openBleRes.errMsg.includes('auth deny')) {
        // 没有打开微信蓝牙授权异常处理
        this.setData({
          _needCheckCamera: true,
        })

        Dialog.alert({
          message: '请授权使用蓝牙，否则无法正常扫码配网',
          showCancelButton: true,
          cancelButtonText: '返回',
          confirmButtonText: '去设置',
          confirmButtonOpenType: 'openSetting',
        }).catch(() => {
          this.goBack() // 拒绝授权摄像头，则退出当前页面
        })
        return
      } else if (openBleRes.errCode === 10001) {
        // 系统没有打开蓝牙
        Dialog.alert({
          message: '请打开手机蓝牙，用于发现附近的子设备',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })

        const listen = (res: WechatMiniprogram.OnBluetoothAdapterStateChangeCallbackResult) => {
          if (res.available) {
            bleDevicesStore.startBleDiscovery()

            bleDevicesStore.offBluetoothAdapterStateChange()
          }
        }
        bleDevicesStore.onBluetoothAdapterStateChange(listen)
      } else {
        bleDevicesStore.startBleDiscovery()
      }

      this.setData({
        _isBlePermit: true,
      })
    },

    onCloseGwList() {
      this.setData({
        isShowGatewayList: false,
        selectGateway: {
          deviceId: '',
          sn: '',
        },
      })
    },

    // 检查摄像头权限
    async checkCameraPerssion() {
      // 局域网情况，没有网络，无法检查权限
      if (isLan()) {
        return true
      }

      showLoading()
      const settingRes = await wx.getSetting().catch((err) => {
        return {
          isFail: true,
          ...err,
        }
      })

      Logger.log('检查摄像头权限', settingRes)

      if (settingRes.isFail) {
        hideLoading()

        Dialog.alert({
          message: '请检查网络是否正常',
          showCancelButton: false,
          confirmButtonText: '确定',
        })
        return false
      }

      if (!settingRes.authSetting['scope.camera']) {
        // 跳转过权限设置页均需要重置needCheckCamera状态，回来后需要重新检查摄像头权限
        this.setData({
          _needCheckCamera: true,
        })

        Dialog.alert({
          message: '请授权使用摄像头，用于扫码配网',
          showCancelButton: true,
          cancelButtonText: '返回',
          confirmButtonText: '去设置',
          confirmButtonOpenType: 'openSetting',
        }).catch(() => {
          // on cancel
          // @ts-ignore
          this.goBack() // 拒绝授权摄像头，则退出当前页面
        })
      } else {
        this.setData({
          _needCheckCamera: false,
        })
      }

      hideLoading()

      return settingRes.authSetting['scope.camera']
    },
    /**
     * 扫码解析
     */
    async getQrCodeInfo(e: WechatMiniprogram.CustomEvent) {
      let isReady = true // 标志扫码环境条件是否准备好

      if (!isLan() && (this.data.scanType === 'gateway' || this.data.scanType === 'subdevice') && isAndroid()) {
        const systemSetting = wx.getSystemSetting() // 局域网（无网环境）该接口无法调用

        isReady = systemSetting.locationEnabled
      }

      // 必须等待初始化好或者非处于扫码状态后才能扫码
      if (!isReady || this.data.isScan) {
        return
      }

      const scanUrl = e.detail.result

      this.handleScanUrl(scanUrl)
    },

    getCameraError(event: WechatMiniprogram.CustomEvent) {
      Logger.error('getCameraError', event)

      // 该错误回调可能需要比较久才触发，需要判断是否还在当前页面
      if (this.data.isShowPage && isLan()) {
        Dialog.alert({
          message: '局域网模式下授权异常，请在外网重新打开局域网模式',
          showCancelButton: false,
          confirmButtonText: '确定',
        })
      }

      this.checkCameraPerssion()
    },

    async initCameraDone() {
      Logger.log('initCameraDone', this.data.scanType)
      if (this.data._needCheckCamera) {
        const flag = await this.checkCameraPerssion()

        if (!flag) {
          return
        }
      }

      // 网关配网以及蓝牙子设备配网需要用到位置权限功能
      // 安卓 6.0 及以上版本，在没有打开定位开关的时候会，导致设备不能正常获取周边的 Wi-Fi 信息。无法进行蓝牙设备搜索
      if (
        (this.data.scanType === 'gateway' || this.data.scanType === 'subdevice') &&
        isAndroid() &&
        !this.data._listenLocationTimeId
      ) {
        const systemSetting = wx.getSystemSetting()

        console.debug('getSystemSetting', systemSetting)

        if (!systemSetting.locationEnabled) {
          wx.showModal({
            content: '请打开手机系统的位置信息开关',
            showCancel: false,
            confirmText: '我知道了',
            confirmColor: '#7cd06a',
          })

          this.data._listenLocationTimeId = setInterval(() => {
            const systemSetting = wx.getSystemSetting()

            if (systemSetting.locationEnabled) {
              clearInterval(this.data._listenLocationTimeId)
              this.data._listenLocationTimeId = 0
              this.initBle()
            }
          }, 3000)

          return
        }
      }

      this.initBle()
    },

    toggleFlash() {
      this.setData({
        isFlash: !this.data.isFlash,
      })
    },

    chooseAlbum() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: async (res) => {
          this.setData({
            isScan: true,
          })
          showLoading()

          const file = res.tempFiles[0]

          const fs = wx.getFileSystemManager()

          // 微信解析二维码图片大小限制 2M，前端暂时限制1.5M
          if (file.size > 1500 * 1024) {
            const compressRes = await wx.compressImage({
              src: file.tempFilePath,
              quality: 70,
            })

            Logger.log('compressRes', compressRes)

            const stat = fs.statSync(compressRes.tempFilePath, false) as WechatMiniprogram.Stats
            file.tempFilePath = compressRes.tempFilePath
            file.size = stat.size
          }

          const result = fs.readFileSync(file.tempFilePath)

          Logger.log('readFile', result)

          const uploadRes = await this.uploadFile({ fileUrl: file.tempFilePath, fileSize: file.size, binary: result })

          if (!uploadRes.success) {
            Logger.error('上传二维码失败', uploadRes)
            hideLoading()
            Toast('上传二维码失败')
            return
          }

          await delay(3000) // 由于有可能图片还没上传完毕，需要延迟调用解析图片接口

          const query = await queryWxImgQrCode(uploadRes.result.downloadUrl)

          hideLoading()
          if (query.success) {
            this.handleScanUrl(query.result.qrCodeUrl)
          } else {
            Logger.error('uploadFile-err', res)
            Toast('无效二维码')
            this.setData({
              isScan: false,
            })
          }
        },
      })
    },

    async uploadFile(params: { fileUrl: string; fileSize: number; binary: string | ArrayBuffer }) {
      const { fileUrl, fileSize, binary } = params

      const nameArr = fileUrl.split('/')

      // 获取集团oss上传服务相关信息
      const { result } = await getUploadFileForOssInfo(nameArr[nameArr.length - 1])

      Logger.log('getUploadFileForOssInfo', result)

      return new Promise<{ success: boolean; result: { uploadUrl: string; downloadUrl: string } }>((resolve) => {
        // 上传图片到集团OSS服务
        wx.request({
          url: result.uploadUrl,
          method: 'PUT',
          data: binary,
          header: {
            'content-type': 'binary',
            Certification: result.certification,
            'X-amz-date': dayjs().subtract(8, 'hour').format('ddd,D MMM YYYY HH:mm:ss [GMT]'), // gmt时间慢8小时
            'Content-Length': fileSize,
            'X-amz-acl': 'public-read',
          },
          success: (res) => {
            Logger.log('uploadFile-success', res)
            resolve({
              success: true,
              result: {
                uploadUrl: result.uploadUrl,
                downloadUrl: result.downloadUrl,
              },
            })
          },
          fail: (err) => {
            Logger.error('uploadFile-fail', err)
            resolve({
              success: false,
              result: {
                uploadUrl: '',
                downloadUrl: '',
              },
            })
          },
        })
      })
    },

    /**
     * 检查是否有效的二维码链接
     * @param url
     */
    isValidLink(url: string) {
      const pageParams = strUtil.getUrlParams(url) as IAnyObject

      return url.includes('meizgd.com/homlux/qrCode.html') && ['01', '02', '10'].includes(pageParams.mode)
    },

    async handleScanUrl(url: string) {
      try {
        this.setData({
          isScan: true,
        })

        if (!this.isValidLink(url)) {
          throw '无效二维码'
        }

        const pageParams = strUtil.getUrlParams(url)

        Logger.log('scanParams', pageParams)

        // mode 配网方式 （00代表AP配网，01代表蓝牙配网， 02代表AP+有线）
        // 带蓝牙子设备
        if (pageParams.mode === '01') {
          await this.bindSubDevice(pageParams)
        }
        // 网关绑定逻辑
        else if (pageParams.mode === '02') {
          await this.bindGateway({
            pid: pageParams.pid,
            ssid: pageParams.ssid,
            addType: 'qrcode',
          })
        }
        // 智慧屏扫码绑定
        else if (pageParams.mode === '10') {
          wx.redirectTo({
            url: strUtil.getUrlWithParams('/package-distribution/pages/auth-screen/index', {
              code: pageParams.code,
              pid: pageParams.pid,
              sn: pageParams.sn,
            }),
          })
        } else {
          throw '无效二维码'
        }
      } catch (err) {
        Toast(err as string)
      }

      // 延迟复位扫码状态，防止安卓端短时间重复执行扫码逻辑
      setTimeout(() => {
        this.setData({
          isScan: false,
        })
      }, 2000)
    },

    async bindGateway(params: { pid?: string; ssid?: string; addType: 'qrcode' | 'manual' }) {
      let proType = '0x16'
      let productName = '网关'
      const { pid, ssid, addType } = params

      // 保证网络正常才能进入下一步
      if (!this.checkNet()) {
        return
      }

      if (addType === 'qrcode') {
        const res = await checkDevice(
          {
            productId: pid,
          },
          { loading: true },
        )

        Logger.log('checkDevice', res)
        if (!res.success) {
          Toast(res.code === -1 ? '当前无法连接网络，请检查网络设置' : '二维码校验失败，请检查二维码是否正确')

          return
        }

        proType = res.result.proType
        productName = res.result.productName
      }

      // 预校验wifi开关是否打开
      if (!checkWifiSwitch()) {
        return
      }

      wx.reportEvent('add_device', {
        pro_type: proType,
        model_id: pid,
        add_type: 'qrcode',
      })

      const jumpUrl = strUtil.getUrlWithParams('/package-distribution/pages/link-gateway/index', {
        apSSID: ssid || 'midea_16_',
        deviceName: productName,
        type: 'query',
        addType,
      })

      // 从微信扫码进入的，跳转不保存当前页面历史记录，否则会无法正常返回
      if (this.data._isFromWxScan) {
        wx.redirectTo({
          url: jumpUrl,
        })
      } else {
        wx.navigateTo({
          url: jumpUrl,
        })
      }
    },

    async bindSubDevice(params: IAnyObject) {
      const isValid = await this.checkBlePermission()

      if (!isValid) {
        return
      }

      const checkData = {} as IAnyObject
      const { sn, mac } = params

      if (sn) {
        checkData.dsn = sn
      } else if (mac) {
        checkData.mac = mac
      }

      showLoading()

      const res = await checkDevice(checkData, { loading: false })

      if (!res.success) {
        Toast('验证产品信息失败')

        return
      }

      // 子设备根据扫码得到的sn在云端查mac地址
      this.setData({
        deviceInfo: {
          type: 'single',
          mac: res.result.mac, // zigbee 的mac
        },
      })

      const flag = await this.checkGateWayInfo()

      if (flag) {
        this.addSingleSubdevice()
      }

      hideLoading()
    },

    /**
     * 添加子设备时，检测是否已选择网关信息
     */
    async checkGateWayInfo() {
      const gatewayId = this.data.selectGateway.deviceId

      if (gatewayId) {
        return true
      }

      if (this.data.gatewayList.length === 0) {
        this.setData({
          isShowNoGatewayTips: true,
        })

        Dialog.alert({
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })

        return false
      }

      if (this.data.gatewayList.length === 1 && this.data.gatewayList[0].onLineStatus === 1) {
        const gateway = this.data.gatewayList[0]

        this.data.selectGateway = {
          deviceId: gateway.deviceId,
          sn: gateway.sn,
        }
      } else {
        this.setData({
          isShowGatewayList: true,
        })

        return false
      }

      return true
    },
    /**
     * 添加附近搜索的子设备
     */
    async addNearSubdevice() {
      this.data.deviceInfo.type = 'near'
      this.data.deviceInfo.deviceName = '子设备'

      const isValid = await this.checkGateWayInfo()

      if (!isValid) {
        return
      }

      const { deviceId, sn } = this.data.selectGateway

      const queryInfo = await getGwNetworkInfo({ deviceId }, { loading: true })

      let networkInfo = {
        channel: 0,
        panId: 0,
        extPanId: '',
      }

      if (queryInfo.success) {
        networkInfo = {
          channel: queryInfo.result.channel,
          panId: queryInfo.result.panId,
          extPanId: queryInfo.result.extPanId,
        }
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/pages/search-subdevice/index', {
          gatewayId: deviceId,
          gatewaySn: sn,
          channel: networkInfo.channel || 0,
          panId: networkInfo.panId || 0,
          extPanId: networkInfo.extPanId || '',
        }),
      })
    },

    // 添加单个子设备
    async addSingleSubdevice() {
      const { deviceId, sn } = this.data.selectGateway

      const queryInfo = await getGwNetworkInfo({ deviceId }, { loading: true })

      let networkInfo = {
        channel: 0,
        panId: 0,
        extPanId: '',
      }

      if (queryInfo.success) {
        networkInfo = {
          channel: queryInfo.result.channel,
          panId: queryInfo.result.panId,
          extPanId: queryInfo.result.extPanId,
        }
      }

      const jumpUrl = strUtil.getUrlWithParams('/package-distribution/pages/add-subdevice/index', {
        mac: this.data.deviceInfo.mac,
        gatewayId: deviceId,
        gatewaySn: sn,
        channel: networkInfo.channel || 0,
        panId: networkInfo.panId || 0,
        extPanId: networkInfo.extPanId || '',
      })

      // 从微信扫码进入的，跳转不保存当前页面历史记录，否则会无法正常返回
      if (this.data._isFromWxScan) {
        wx.redirectTo({
          url: jumpUrl,
        })
      } else {
        wx.navigateTo({
          url: jumpUrl,
        })
      }
    },
  },
})
