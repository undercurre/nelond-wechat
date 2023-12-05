/* eslint-disable no-undef,@typescript-eslint/no-this-alias */
import {
  getReqId,
  getStamp,
  ab2hex,
  hexStringToArrayBuffer,
  formatStr,
  hexString2Uint8Array,
  requestWithTry,
} from 'm-utilsdk/index'
import { requestService } from '../requestService'

import app from '../../common/app'

let packageSize = 200
module.exports = Behavior({
  behaviors: [],
  properties: {},
  data: {
    deviceId: '',
    moduleType: '', //模组类型 1代表ble, 2代表 bleWifi
    currentOrder: '',
    progress: 0,
    isEndon: false, //是否还响应处理
    sn: '', //云返回sn
    linkBleSuccess: () => {},
    bleDataChanged: () => {},
    BLEConnectionStateChange: () => {},
    bleNegSuccess: () => {},
    bleNegFail: () => {},
    bleBindSucess: () => {},
    bleBindFail: () => {},
    deviceInfo: {
      deviceId: '',
      serviceId: '',
      characteristicId: '',
    },
    connected: false,
    tryConnectNum: 3,
    groudOrder: null,
    orderLen: 0,
    wifi_version: '', //蓝牙配网模组版本，用于配网数据上报
  },
  created: function () {
    // console.log('[my-component] created')
  },
  methods: {
    /*
     *deviceId 蓝牙设备id 安卓为mac：84:7C:9B:F3:C6:A5 ios为UUID:945049A7-3759-C9C0-B293-7273B4FBC952
     *moduleType 模组类型   0：ble 1:ble+wifi
     *isDirectCon 是否是蓝牙直连 boolean
     *negType    确权类型  1:确权后绑定  2：强制下发绑定码 3：校验绑定码
     * */
    async bleNegotiation(deviceId, isDirectCon, moduleType, negType) {
      console.debug('----bleNegotiation-----')
      let initOrder = await requestWithTry(this.acquirePublicKey, 4)
      this.data.currentOrder = initOrder
      this.data.isDirectCon = isDirectCon
      this.data.moduleType = moduleType ? moduleType : 'bleWifi'
      this.data.negType = negType
      console.log('初始指令：', this.data.currentOrder)
      console.log('连接设备id', deviceId, isDirectCon)
      await this.openAdapter()
      this.createBLEConnection(deviceId)
    },
    openAdapter() {
      return new Promise((resolve, rejcet) => {
        wx.openBluetoothAdapter({
          success(res) {
            resolve(res)
          },
          fail(error) {
            console.error('[open blue Adapter error]', error)
            rejcet(error)
          },
        })
      })
    },
    createBLEConnection(deviceId) {
      this.data.deviceId = deviceId
      wx.createBLEConnection({
        deviceId,
        success: (res) => {
          this.setData({
            connected: true,
          })
          this.data.linkBleSuccess(res)

          console.log('蓝牙连接成功', res)
          wx.getSystemInfo({
            success: (res) => {
              if (res.system.indexOf('Android') != -1) {
                wx.setBLEMTU({
                  deviceId,
                  mtu: 250,
                  success: () => {
                    console.log('设置MTU成功+++++++++++++++++++++++++')
                  },
                  fail: (error) => {
                    console.error('设置MTU失败+++++++++++++++++++++++++', error)
                  },
                })
              }
            },
          })
          this.getBLEDeviceServices(deviceId, 'FF80')

          wx.onBLEConnectionStateChange((res) => {
            // 该方法回调中可以用于处理连接意外断开等异常情况
            console.log(`device ${res.deviceId} state has changed,蓝牙连接状态: ${res.connected}`)
            this.data.BLEConnectionStateChange(res)
            if (!res.connected) {
              //蓝牙断开
              this.data.connected = false
              this.data.progress = 0
            }
          })
        },
        fail: (error) => {
          console.error('链接失败', JSON.stringify(error))
          // log.info('wx.wx.createBLEConnection失败',`error=${JSON.stringify(error)}`)

          if (!this.data.connected && this.data.time > 20) {
            // 重连
            wx.closeBLEConnection({
              deviceId: this.data.deviceId,
            })
            setTimeout(() => {
              this.createBLEConnection(this.data.deviceId)
            }, 300)
          } else {
            this.data.bleNegFail(error)
            this.data.bleBindFail(error)
          }
        },
      })
    },
    getBLEDeviceServices(deviceId, serviceType) {
      wx.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          console.log('连接后获取到的蓝牙服务', res)
          for (let i = 0; i < res.services.length; i++) {
            if (res.services[i].isPrimary && res.services[i].uuid.includes(serviceType)) {
              //isPrimary是否为主服务
              this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
              return
            }
          }
        },
        fail: (error) => {
          console.error('获取蓝牙设备服务失败', error)
        },
      })
    },
    getBLEDeviceCharacteristics(deviceId, serviceId) {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          console.log('getBLEDeviceCharacteristics success', res.characteristics)
          for (let i = 0; i < res.characteristics.length; i++) {
            let item = res.characteristics[i]
            // if (item.properties.read) {//写入的时候不能读取 会出现写入失败
            //   wx.readBLECharacteristicValue({
            //     deviceId,
            //     serviceId,
            //     characteristicId: item.uuid,
            //   })
            // }
            if (item.properties.write) {
              this.setData({
                canWrite: true,
              })
              this._deviceId = deviceId
              this._serviceId = serviceId
              if (item.uuid.includes('FF81') || item.uuid.includes('FF91')) {
                //FF81 配置 下发特性  FF91：直连下发特性
                this._characteristicId = item.uuid
                this.writeData(this.data.currentOrder)
              }
              // this.writeBLECharacteristicValue(this.data.currentOrder)
            }
            if (
              (item.properties.notify || item.properties.indicate) &&
              (item.uuid.includes('FF82') || item.uuid.includes('FF92'))
            ) {
              //FF92：直连上行特性
              this.setData({
                deviceInfo: {
                  deviceId: deviceId,
                  serviceId: serviceId,
                  characteristicId: item.uuid,
                },
              })
              wx.notifyBLECharacteristicValueChange({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
                state: true,
                success(res) {
                  console.log('notifyBLECharacteristicValueChange success', res)
                },
              })
            }
          }
        },
        fail(error) {
          console.error('getBLEDeviceCharacteristics', error)
        },
      })
      // 操作之前先监听，保证第一时间获取数据
      wx.onBLECharacteristicValueChange((characteristic) => {
        console.log('收到设备消息---', ab2hex(characteristic.value))
        let value = this.isGroup(ab2hex(characteristic.value))
        if (!value) {
          console.log('[未完成组包]')
          return
        }
        this.onBLECharacteristicValueChangeIOS(value, characteristic)
        this.data.bleDataChanged(value, characteristic)
      })
    },
    //注册连接蓝牙成功事件监听
    resisterOnLinkBleSuccess(callback) {
      this.setData({
        linkBleSuccess: callback || (() => {}),
      })
    },
    resisterBleDataChanged(callback) {
      // this.data.bleDataChanged = callback;
      this.setData({
        bleDataChanged: callback || (() => {}),
      })
    },
    registerBLEConnectionStateChange(callback) {
      // onBLEConnectionStateChange
      this.setData({
        BLEConnectionStateChange: callback || (() => {}),
      })
    },

    resisterOnBleNegSuccess(callback) {
      this.setData({
        bleNegSuccess: callback || (() => {}),
      })
    },
    resisterOnBleNegFail(callback) {
      this.setData({
        bleNegFail: callback || (() => {}),
      })
    },
    resisterOnBlebindSuccess(callback) {
      this.setData({
        bleBindSucess: callback || (() => {}),
      })
    },
    resisterOnBlebindFail(callback) {
      this.setData({
        bleBindFail: callback || (() => {}),
      })
    },
    //获取设备信息指令
    getBluetoothApplianceInfo() {
      let self = this
      let reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
      }
      requestService.request('getBluetoothApplianceInfo', reqData).then((resp) => {
        console.log('获取sn指令', resp.data.data.order63)
        self.data.currentOrder = resp.data.data.order63.replace(/,/g, '')
        // this.writeBLECharacteristicValue(self.data.currentOrder)
        this.writeData(self.data.currentOrder)
      })
    },
    //完整写入
    writeCharacteristicValueAll(msg) {
      let buffer = hexStringToArrayBuffer(msg)
      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: this._serviceId,
        characteristicId: this._characteristicId,
        value: buffer,
        success() {
          console.log('写入完整数据', ab2hex(buffer))
        },
      })
    },

    //ios响应模组包处理IOS
    onBLECharacteristicValueChangeIOS(value, characteristic) {
      if (this.data.isEndon) return
      if (!characteristic.serviceId.includes('FF80')) return
      let respTempData = value
      if (this.data.progress == 0) {
        console.log('上报云端返回公钥--------0', formatStr(respTempData))
        let publicKey = formatStr(respTempData)
        let reqData = {
          publicKey: publicKey,
          reqId: getReqId(),
          stamp: getStamp(),
        }
        console.log('[上报云端返回公钥 reqData]', reqData)
        requestService.request('generateSecretKey', reqData).then((resp) => {
          console.log('获得会话密钥为======0', resp.data)
          this.data.progress = 1
          this.data.currentOrder = resp.data.data.order02.replace(/,/g, '')
          // this.writeBLECharacteristicValue(resp.data.data.order02.replace(/,/g, ''))
          this.writeData(resp.data.data.order02.replace(/,/g, ''))
        })
      }
      if (this.data.progress == 1) {
        //获取设备信息指令
        console.log('发送密钥协商结果给云端-------------1')
        let reqData = {
          order: formatStr(respTempData),
          reqId: getReqId(),
          stamp: getStamp(),
        }
        requestService
          .request('verifySecretKey', reqData)
          .then((resp) => {
            console.log('密钥协商结果=============1', resp.data)
            if (resp.data.data.sessionSecret) {
              app.globalData.bleSessionSecret = resp.data.data.sessionSecret.replace(/,/g, '')
              console.log('设置会话秘钥成功', app.globalData.bleSessionSecret)
            }

            if (resp.data.data.result) {
              this.data.progress = 2
              this.getBluetoothApplianceInfo()
            }
          })
          .catch((error) => {
            this.data.bleNegFail(error)
            // wx.showToast({
            //   title: '密钥协商错误' + JSON.stringify(error),
            //   icon: 'none',
            //   duration: 2000
            // })
          })
      }
      if (this.data.progress == 2) {
        //获取绑定码指令
        console.log('模组返回设备信息指令----------2', respTempData)
        let modelType = this.data.moduleType === 'ble' ? 1 : 2
        let reqData = {
          sn: formatStr(respTempData),
          reqId: getReqId(),
          stamp: getStamp(),
          modelType: modelType, //1代表ble, 2代表 bleWifi
          actionType: this.data.negType, //1:确权后绑定  2：强制下发绑定码 3：校验绑定码
          // "homegroupId":'162449'
        }
        console.log(`${this.data.negType == 2 ? '下发绑定码请求参数' : '校验绑定码参数'}`, reqData)
        requestService
          .request('queryBindCode', reqData)
          .then((resp) => {
            console.log(`${this.data.negType == 2 ? '下发绑定码请求res' : '校验绑定码res'}`, resp.data)
            this.data.progress = 3
            let { sn, version } = resp.data.data
            this.data.sn = sn
            this.data.wifi_version = version //设置蓝牙配网模组版本，用于配网数据上报
            console.log('云端返回的sn===========', this.data.sn)
            this.data.currentOrder = resp.data.data.bindCode.replace(/,/g, '')
            if (!this.data.isDirectCon) {
              //非直连 不需要获取绑定码的操作了
              this.data.isEndon = true
              console.log('非直连结束监听')
              this.data.bleNegSuccess(resp.data.data)
              return
            }
            this.writeData(resp.data.data.bindCode.replace(/,/g, ''))
          })
          .catch((error) => {
            console.error(error)
            this.data.bleBindFail(error)
            // wx.showToast({
            //   title: '生成的绑定错误' + JSON.stringify(error),
            //   icon: 'none',
            //   duration: 2000
            // });
          })
      }
      if (this.data.progress == 3) {
        //绑定码校验结果
        // console.log("绑定码校验结果", respTempData)
        let reqData = {
          order: formatStr(respTempData.slice(0, 44)),
          reqId: getReqId(),
          stamp: getStamp(),
        }
        console.log('绑定码校验参数--------3', reqData)
        requestService
          .request('bindCodeResult', reqData)
          .then((resp) => {
            console.log('云端校验绑定码结果==========3', resp.data.data.result)
            if (!this.data.isDirectCon) {
              //非直连 不需要获取绑定码的操作了
              console.log('结束确权')
              return
            }
            if (resp.data.data.result) {
              this.data.isEndon = true
              this.data.bleBindSucess(resp.data.data)
            }
          })
          .catch((error) => {
            // wx.showToast({
            //   title: '云端校验绑定码结果错误' + JSON.stringify(error),
            //   duration: 2000,
            //   icon: 'none'
            // })
            this.data.bleBindFail(error)
          })
      }
    },

    //组包
    isGroup(value) {
      let { groudOrder } = this.data
      if (value.includes('aa55')) {
        this.data.orderLen = (parseInt(value.substr(4, 2), 16) + 2) * 2
      }
      console.log('[this.data.orderLen]', this.data.orderLen, value.length)
      if (value.includes('aa55') && value.length == this.data.orderLen) {
        //完整包
        return value
      }
      if (value.includes('aa55') && value.length > this.data.orderLen && value.split('aa55').length > 2) {
        //粘包处理
        let orderArr = value.split('aa55')
        console.log('[粘包]', orderArr)
        return 'aa55' + orderArr[orderArr.length - 2]
      }
      if (value.includes('aa55') && value.length < this.data.orderLen) {
        //需要组包
        this.data.groudOrder = value
        return false
      }
      if (groudOrder && !value.includes('aa55')) {
        //子包
        this.data.groudOrder += value
      }
      if (this.data.groudOrder.length == this.data.orderLen) {
        //组包完成
        let allOrder = this.data.groudOrder
        this.data.groudOrder = null
        return allOrder
      } else {
        return false
      }
    },

    writeData(data) {
      console.log('发送数据：', data)
      packageSize = 200
      let offset = 0
      data = hexString2Uint8Array(data) //uni8array
      this.writePackage(data, offset)

      // if (retry > 0) {
      //   this.retryTimeout = setTimeout(() => {
      //     console.log(`未收到消息回复，第${4 - retry}次尝试`)
      //     this.writeData(data, --retry)
      //   }, 3000);
      // }
    },
    //可分包写入
    writePackage(data, offset) {
      let that = this
      let length = data.length - offset >= packageSize ? packageSize : data.length - offset //本次分包长度
      let pack = data.slice(offset, offset + length)
      console.log('发送分包', offset, offset + pack.length, pack)
      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: this._serviceId,
        characteristicId: this._characteristicId,
        value: pack.buffer,
        success: (res) => {
          console.log('写数据返回结果：', res)
          offset += pack.length
          if (offset < data.length) {
            that.writePackage(data, offset)
          }
        },
        fail(error) {
          console.error('写数据失败!', error)
        },
      })
    },
    closeBLEConnection() {
      wx.closeBLEConnection({
        deviceId: this.data.deviceId,
      })
    },
    //获取0101指令
    acquirePublicKey() {
      console.debug('----ble-negotiation.js   acquirePublicKey-----')
      return new Promise((r, j) => {
        let reqData = {
          reqId: getReqId(),
          stamp: getStamp(),
        }
        requestService
          .request('acquirePublicKey', reqData, 'POST', '', 3000)
          .then((resp) => {
            // console.log('01指令', resp.data.data.order01)
            r(resp.data.data.order01.replace(/,/g, ''))
          })
          .catch((error) => {
            console.error('[acquire PublicKey error]', error)
            j(error)
          })
      })
    },
  },
})
