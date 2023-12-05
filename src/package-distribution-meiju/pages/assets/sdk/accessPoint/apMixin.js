/**
 * AP配网，tcp相关的服务接口,发送路由信息到设备等逻辑
 */

import app from '../../../../common/app'
import { hexStringToArrayBuffer } from 'm-utilsdk/index'
import { apService } from './apService'
// eslint-disable-next-line no-undef
module.exports = Behavior({
  data: {
    isLinkTcpSuccess: false, //tcp连接是否成功
    aplinkOrder: '', //ap配网完整指令
    checkExists: false, //是否已经调用过查云函数
    tcpRetryNum: 7, //tcp重试次数
    apIsSendWifiInfo: false, //ap 配网是否发送了wifi消息
  },
  methods: {
    async apSendWifiInfo(tcp, address, port) {
      console.log('createTCPSocket', tcp)

      tcp.onConnect(() => {
        console.log('tcp connect 成功')

        this.data.isLinkTcpSuccess = true
        if (!this.data.aplinkOrder) {
          let bindWifiInfo = app.addDeviceInfo.curWifiInfo
          this.data.aplinkOrder = apService.constrLinknetorder(bindWifiInfo)
        }
        if (tcp) {
          tcp.write(hexStringToArrayBuffer(this.data.aplinkOrder))
          this.data.apIsSendWifiInfo = true
        }
        //发送完wifi信息就开始查云
        if (!this.data.checkExists) {
          this.data.checkExists = true
          // todo: 调用查询云端设备是否连上网的接口逻辑
          this.sendApWifiAfter()
        }
      })

      tcp.onMessage((res) => {
        // todo: 发送消息到设备后，设备返回信息监听
        this.tcpOnMessage(res)
      })

      tcp.onError(async (error) => {
        //监听tcp错误
        console.log('link tcp error', error)
        app.addDeviceInfo.errorCode = this.creatErrorCode({
          errorCode: 4038,
          isCustom: true,
        })

        /**
         * 3 - 绑定 wifi 网络失败，BSSID 不合法
         * 4 - 绑定 wifi 网络失败，系统错误
         * 5 - 不支持 bindWifi
         * 6 - 低版本基础库不支持
         */
        let tcpBindWifiErrCodes = [3, 4, 5, 6]
        if (tcpBindWifiErrCodes.includes(error.errCode)) {
          console.log('[tcp bind wifi error]')
          tcp.connect({
            address: address,
            port: port,
            timeout: 5, //wx 8.0.22 add
          })
          return
        }

        // if (!this.data.deviceRecWifiInfo && this.data.tcpRetryNum > 0 && !this.data.isEndTcpRetry) {
        if (this.data.tcpRetryNum > 0) {
          // todo 判断条件待确定
          setTimeout(() => {
            this.apSendWifiInfo(tcp, address, port)
            this.data.tcpRetryNum = this.data.tcpRetryNum - 1
          }, 3000)
        }
      })
      if (app.globalData.systemInfo.system.includes('Android') && typeof tcp.bindWifi === 'function') {
        //安卓支持tcp.bindWifi 则先bindWifi
        console.log('[support tcp bind wifi]')
        tcp.onBindWifi(async () => {
          console.log('[tcp bind wifi success]')
          tcp.connect({
            address: address,
            port: port,
            timeout: 5, //wx 8.0.22 add
          })
        })
        tcp.bindWifi({
          BSSID: app.addDeviceInfo.BSSID,
        })
      } else {
        console.log('[unsupport tcp bind wifi]')
        wx.getNetworkType({
          success(res) {
            const networkType = res.networkType
            if (networkType == 'wifi') {
              //如果当前已经连接wifi,则直接连接
              tcp.connect({
                address: address,
                port: port,
                timeout: 5, //wx 8.0.22 add
              })
            } else {
              //如果当前还没有连接wifi，通过监听wifi状态变化，转为wifi后再连接
              wx.onNetworkStatusChange(function (res) {
                console.log(res.isConnected)
                console.log(res.networkType)
                if (res.isConnected && res.networkType == 'wifi') {
                  tcp.connect({
                    address: address,
                    port: port,
                    timeout: 5, //wx 8.0.22 add
                  })
                }
                wx.offNetworkStatusChange(function (res) {
                  console.log('offNetworkStatusChange', res)
                })
              })
            }
          },
        })
      }
    },
  },
})
