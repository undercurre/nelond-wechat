import app from '../../common/app'
const Commands = Object.freeze({
  c1: 0x01, //协商
  c2: 0x02, //数传
  c3: 0x03, //鉴权
  c4: 0x04, //绑定状态与校验指令
})

let packageSize = 20
let startTime
let endTime

export default class BluetoothConn {
  /**
   * openId6  6位openId
   * deviceId 蓝牙模组deviceId
   * sessionKey 会话密钥
   * advertisData 蓝牙广播数据  category||sn8||mac
   */
  constructor(object) {
    this.device = object.device
    this.openId6 = Common.string2Uint8Array(object.openId6)
    console.log('openId:', this.openId6)
    this.deviceId = object.deviceId
    this.sessionKey = object.sessionKey
    this.advertisData = object.advertisData
    this.needCheckRssi = object.needCheckRssi
    this.success = object.success //对象下的 成功回调
    this.connSuccess = false //有未过期的会话密钥并且验证成功或者协商密钥成功后，标记为true;
    this.msgGroup = new MsgGroup() //接收到的消息，如果是分包消息 ，需要合包
    this.event = new Event()
    this.connction()
  }

  connction() {
    let that = this
    startTime = new Date().getTime()
    console.log('开始建立连接...')
    wx.createBLEConnection({
      deviceId: that.deviceId,
      timeout: 3000,
      success: () => {
        endTime = new Date().getTime()
        console.log('createBLEConnection耗时：' + (endTime - startTime) + 'ms')

        // wx.onBLEConnectionStateChange(function (res) {
        //   console.log("蓝牙状态连接状态改变:", res);
        //   // 该方法回调中可以用于处理连接意外断开等异常情况
        //   app.blueToothConnecting = res.connected;
        //   if (res.connected == false && that.connSuccess) {//主动断开连接时不触发该事件
        //     console.log('蓝牙链接意外断开')
        //     that.event.dispatch("disconnect")
        //   }
        // });

        that.connTimeout = setTimeout(() => {
          if (!that.connSuccess) {
            console.log('协商密钥超时')
            that.event.dispatch('fail', '协商密钥超时')
            that.closeBLEConnection()
          }
        }, 20 * 1000) //20秒未协商好主动断开连接

        if (app.platform == 'ios') {
          //errMsg:"setBLEMTU:fail can only be invoked on android"
          //获取蓝牙所有服务
          //iOS平台上后续对特征值的read、write、notify，由于系统需要获取特征值实例，传入的 serviceId 与 characteristicId 必须由 getBLEDeviceServices 与 getBLEDeviceCharacteristics 中获取到后才能使用。
          this.getBLEDeviceServices(this.deviceId)
        } else {
          //this.setBleMtu(183)
          //this.setBleMtu(23)
          if (!that.device.writeCharacteristic) {
            //获取蓝牙所有服务
            that.getBLEDeviceServices(that.deviceId)
          } else {
            that.notify()
          }
        }
      },
      fail: (res) => {
        console.log('createBLEConnection', res)
        that.event.dispatch('fail', 'createBLEConnection失败：' + JSON.stringify(res))
        // wx.closeBLEConnection({
        //   deviceId: that.deviceId,
        //   complete: (res) => {
        //     that.event.dispatch("fail", 'createBLEConnection失败：' + JSON.stringify(res))
        //   }
        // })
      },
    })
  }

  //经测试wx.setBLEMTU耗时为300ms，
  //所以mtu值设置成功后应该缓存下来
  //iot的同事说，断开接后需要重新设置mtu， 所以缓存下来也没用
  //考虑不设置mtu，直接按mtu=23来发，即消息体长度为20
  setBleMtu(mtu) {
    let that = this
    startTime = new Date().getTime()
    wx.setBLEMTU({
      deviceId: this.deviceId,
      mtu,
      success: (res) => {
        console.log('mtu success', res)
        packageSize = 200
      },
      fail: (res) => {
        console.error('mtu fail', res)
        // that.event.dispatch("errLog", 'setBleMtu失败' + JSON.stringify(res))
      },
      complete: () => {
        endTime = new Date().getTime()
        console.log('setBLEMTU耗时：' + (endTime - startTime) + 'ms')

        //getBLEDeviceServices不会阻塞
        that.startNegotiate()
      },
    })
  }

  getBLEDeviceServices() {
    let that = this
    startTime = new Date().getTime()
    wx.getBLEDeviceServices({
      deviceId: that.deviceId,
      success: (res) => {
        console.log('获取蓝牙设备所有服务(service)', res)
        endTime = new Date().getTime()
        console.log('getBLEDeviceServices耗时：' + (endTime - startTime) + 'ms')
        for (let i = 0; i < res.services.length; i++) {
          let tmpUuid = res.services[i].uuid
          if (res.services[i].isPrimary && tmpUuid.substring(4, 8) == 'FFA0') {
            that.getBLEDeviceCharacteristics(res.services[i].uuid)
          }
        }
      },
      fail: (res) => {
        console.error('getBLEDeviceServices fail', res)
        that.event.dispatch('fail', 'getBLEDeviceServices失败' + JSON.stringify(res))
        that.closeBLEConnection()
      },
    })
  }
  getBLEDeviceCharacteristics(serviceId) {
    let that = this
    startTime = new Date().getTime()
    wx.getBLEDeviceCharacteristics({
      deviceId: that.deviceId,
      serviceId,
      success: (res) => {
        console.log('蓝牙设备特征值信息:', res)
        endTime = new Date().getTime()
        console.log('getBLEDeviceCharacteristics耗时：' + (endTime - startTime) + 'ms')
        let deviceData = {
          deviceId: that.deviceId,
          serviceId,
          sn8: that.device.sn8,
          sn3: that.device.sn3,
          mac: that.device.mac,
          category: that.device.category,
          name: that.device.name,
        } //过滤到广播中不需要的属性，保存到服务器
        that.device = deviceData
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          var itemUUID = item.uuid.toUpperCase() //转大写
          console.log('itemUUID:', itemUUID)
          if (itemUUID.indexOf('FFA1') != -1) {
            that.device.writeCharacteristic = item.uuid
          }
          if (itemUUID.indexOf('FFA2') != -1) {
            that.device.indicateCharacteristic = item.uuid
          }
        }

        that.notify()

        /*
          let arr = new Uint8Array(193);
          for(let i=0;i<193;i++){
            arr[i]=i;
          }
          startTime = new Date().getTime();
          console.log("开始测试数据..." + startTime)        
          this.writeData(arr)
          endTime = new Date().getTime();
          console.log("耗时..." + (endTime-startTime)+"ms")
          */
        //
      },
    })
  }
  /**
   * 开始协商密钥
   */

  startNegotiate() {
    console.log('开始协商会话密钥')
    this.createRootKey()
    //发送获取版本指令
    //this.getVersion(); //本版本可以不执行，目前不用判断版本
    this.step1()
  }
  closeBLEConnection() {
    console.log('小程序主动断开连接')
    this.connSuccess = false
    clearTimeout(this.retryTimeout)
    this.event.removeEvent()
    wx.closeBLEConnection({
      deviceId: this.deviceId,
      success: () => {
        console.log('主动断开连接成功')
      },
    })
  }

  //开始监听
  notify() {
    let that = this
    let device = this.device
    console.log('notifyBLECharacteristicValueChange', device.indicateCharacteristic)
    startTime = new Date().getTime()
    wx.notifyBLECharacteristicValueChange({
      deviceId: device.deviceId,
      serviceId: device.serviceId,
      characteristicId: device.indicateCharacteristic,
      state: true,
      success(res) {
        console.log('notifyBLECharacteristicValueChange成功', res)
        endTime = new Date().getTime()
        console.log('notifyBLECharacteristicValueChange成功耗时：' + (endTime - startTime) + 'ms')
        if (app.platform == 'ios') {
          //errMsg:"setBLEMTU:fail can only be invoked on android"
          //获取蓝牙所有服务
          //iOS平台上后续对特征值的read、write、notify，由于系统需要获取特征值实例，传入的 serviceId 与 characteristicId 必须由 getBLEDeviceServices 与 getBLEDeviceCharacteristics 中获取到后才能使用。
          that.startNegotiate()
        } else {
          that.setBleMtu(183)
        }
      },
      fail(res) {
        console.error('notifyBLECharacteristicValueChange失败', res)
        endTime = new Date().getTime()
        console.log('notifyBLECharacteristicValueChange失败耗时：' + (endTime - startTime) + 'ms')
        that.event.dispatch('fail', 'notifyBLECharacteristicValueChange失败' + JSON.stringify(res))
        clearTimeout(that.connTimeout)
        that.closeBLEConnection()
      },
    })
    /**
     * 监听低功耗蓝牙设备的特征值变化事件。必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification
     */
    wx.onBLECharacteristicValueChange(function (res) {
      //console.log('onBLECharacteristicValueChange, res：', res)
      console.log('接受到连接层消息：', Common.ab2hex(res.value))
      clearTimeout(that.retryTimeout)
      let msg = new Uint8Array(res.value)
      that.msgGroup.addPackage(msg)

      while (that.msgGroup.messageList.length > 0) {
        msg = that.msgGroup.messageList.shift()
        msg = ProtocolConn.decode(msg)
        console.log('接收到消息体：', Common.ab2hex(msg.body))

        switch (msg.type) {
          case ProtocolType.t1: //连接层
            //
            that.step1()
            break
          case ProtocolType.t2: //安全层
            that.handleSecurityLayerMsg(that.rootKey, msg.body)
            break
          case ProtocolType.t3: //业务层
            that.handleSecurityLayerMsg(that.sessionKey, msg.body)
            break
          default:
            break
        }
      }
    })
  }

  connectionSuccess() {
    clearTimeout(this.connTimeout)
    clearTimeout(this.retryTimeout)
    this.connSuccess = true
    this.success()
  }

  //获取连接协议版本
  getVersion() {
    let msg = ProtocolConn.encode(ProtocolType.t1, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    console.log('发送版本数据')
    this.writeData(msg)
  }

  createRootKey() {
    startTime = new Date().getTime()
    console.log('根密钥mk:', Common.ab2hex(this.advertisData))
    this.rootKey = crypto.hkdfKeyWithSalt(this.advertisData, 16, [], Common.string2Uint8Array('midea_bleapp'))
    console.log('生成根密钥:', Common.ab2hex(this.rootKey))
    endTime = new Date().getTime()
    console.log('生成根密钥耗时：' + (endTime - startTime) + 'ms')
  }

  step1() {
    let data = this.openId6
    if (this.sessionKey) {
      console.log('sessionKey', Common.ab2hex(this.sessionKey))
      data = Common.concatUint8Array([data, crypto.cipherMsg(this.sessionKey, this.advertisData)])
    }
    this.sendSecurityLayerMsg(Commands.c1, data)
  }

  /**
   * 发起密钥协商
   */
  step2() {
    this.sendSecurityLayerMsg(Commands.c2, [])
  }

  /**
   * 发送安全层消息
   */
  sendSecurityLayerMsg(command, data) {
    ProtocolSecurity.nexCount()
    let smsg = ProtocolSecurity.encode(command, data)
    console.log('发送安全层消息：', Common.ab2hex(smsg), '计数器：', smsg[1])
    //Common.concatUint8Array([new Int8Array([command, this.msgCount, data.length]), data]);
    let msg
    ProtocolConn.nexCount()
    let retry
    if (command == Commands.c4) {
      retry = 0
      msg = ProtocolConn.encode(ProtocolType.t3, crypto.cipherMsg(this.sessionKey, smsg))
    } else {
      retry = 2 //协商消息需要连接3次， 即再尝试2次
      msg = ProtocolConn.encode(ProtocolType.t2, crypto.cipherMsg(this.rootKey, smsg))
    }

    this.writeData(msg, retry)
  }

  /**
   * msg 用rootKey解密后的消息
   * 安全层消息计数器
   */
  checkMsgCount(msg) {
    let bluetoothMsgCount = msg[1]
    if (!this.bluetoothMsgCount) {
      this.bluetoothMsgCount = bluetoothMsgCount
      return true
    } else {
      if (this.bluetoothMsgCount == 255) {
        this.bluetoothMsgCount = 0
      }
      if (this.bluetoothMsgCount + 1 == bluetoothMsgCount) {
        //console.log(`消息计算器校验成功，预期${this.bluetoothMsgCount+1}，收到${bluetoothMsgCount}`)
        this.bluetoothMsgCount++
        return true
      }
      console.log(`消息计算器校验失败，预期${this.bluetoothMsgCount}，收到${bluetoothMsgCount}`)
      this.event.dispatch('fail', `消息计算器校验失败，预期${this.bluetoothMsgCount}，收到${bluetoothMsgCount}`)
      return false
    }
  }

  /**
   * 处理安全层消息
   */
  handleSecurityLayerMsg(key, msg) {
    if (msg.length < 16) {
      console.log('安全层错误消息：', Common.ab2hex(msg))
      this.event.dispatch('fail', '安全层错误消息：' + Common.ab2hex(msg))
      this.closeBLEConnection()
      return
    }
    msg = crypto.decipherMsg(key, msg)
    console.log('解密后的消息：', Common.ab2hex(msg))
    if (!msg) {
      this.event.dispatch('fail', '安全层消息解密失败：' + Common.ab2hex(msg))
      this.closeBLEConnection()
      return
    }
    if (!this.checkMsgCount(msg)) {
      return
    }
    switch (msg[0]) {
      case Commands.c1:
        this.handleSecurityLayerMsgC1(msg)
        break
      case Commands.c2:
        this.handleSecurityLayerMsgC2(msg)
        break
      case Commands.c3:
        this.handleSecurityLayerMsgC3(msg)
        break
      case Commands.c4:
        this.handleBizMsgC4(msg)
        break
      default:
        this.event.dispatch('errLog', '未知类型的安全层消息：' + Common.ab2hex(msg))
        break
    }
  }

  handleSecurityLayerMsgC1(msg) {
    let length = msg[2]
    if (length != 1) {
      console.error('handleSecurityLayerMsgC1出错，消息体长度不为1', msg)
      return
    }
    let result = msg[3]
    if (result == 0) {
      //需重新协商密钥
      this.step2()
    } else if (result == 1) {
      this.connectionSuccess()
    }
  }

  handleSecurityLayerMsgC2(msg) {
    let length = msg[2]
    if (msg.length != length + 3) {
      console.error('handleSecurityLayerMsgC2出错，消息体格式不正确', msg)
      return
    }
    this.bluetoothPubKey = msg.slice(3, msg.length)
    this.priKey = crypto.createPriKey()
    this.pubKey = crypto.createPubKey(this.priKey)
    this.sessionKey = crypto.createSecret(this.priKey, this.bluetoothPubKey)
    console.log('priKey', Common.ab2hex(this.priKey))
    console.log('pubKey', Common.ab2hex(this.pubKey))
    console.log('bluetoothPubKey', Common.ab2hex(this.bluetoothPubKey))
    console.log('sessionKey', Common.ab2hex(this.sessionKey))
    console.log('advertisData', Common.ab2hex(this.advertisData))
    console.log('密文', Common.ab2hex(crypto.cipherMsg(this.sessionKey, this.advertisData)))

    let data = Common.concatUint8Array([this.pubKey, crypto.cipherMsg(this.sessionKey, this.advertisData)])
    this.sendSecurityLayerMsg(Commands.c3, data)
  }

  handleSecurityLayerMsgC3(msg) {
    let length = msg[2]
    if (length != 1) {
      console.error('handleSecurityLayerMsgC3出错，消息体长度不为1', msg)
      return
    }
    let result = msg[3]
    if (result == 0) {
      //协商密钥失败
      this.event.dispatch('fail', '协商密钥失败：' + Common.ab2hex(msg))
      this.closeBLEConnection()
    } else if (result == 1) {
      //协商密钥成功
      this.device.sessionKey = Common.ab2hex(this.sessionKey)
      this.device.sessionKeyCreateTime = new Date().getTime()
      this.device.advertisData = Common.ab2hex(this.advertisData)
      //console.log('新会话密钥协调成功', this.device)
      this.event.dispatch('newSessionKey', this.device)
      this.connectionSuccess()
    }
  }

  handleBizMsgC4(msg) {
    let length = msg[2]
    let data = msg.slice(3, length + 3)
    this.event.dispatch('receiveMessage', ProtocolBiz.decode(data))
  }

  /**
   * 发送连接层协议， 即向蓝牙写入数据
   */
  writeData(data, retry) {
    console.log('发送连接层数据：', Common.ab2hex(data))
    packageSize = 200
    let offset = 0
    this.writePackage(data, offset)

    if (retry > 0) {
      this.retryTimeout = setTimeout(() => {
        console.log(`未收到消息回复，第${4 - retry}次尝试`)
        this.writeData(data, --retry)
      }, 3000)
    }
  }

  writePackage(data, offset) {
    let that = this
    let length = data.length - offset >= packageSize ? packageSize : data.length - offset //本次分包长度
    let pack = data.slice(offset, offset + length)
    console.log('发送分包', offset, offset + pack.length, pack)
    wx.writeBLECharacteristicValue({
      deviceId: this.device.deviceId,
      serviceId: this.device.serviceId,
      characteristicId: this.device.writeCharacteristic,
      value: pack.buffer,
      success: (res) => {
        console.log('写数据返回结果：', res, new Date())
        offset += pack.length
        if (offset < data.length) {
          that.writePackage(data, offset)
        }
      },
      fail(res) {
        console.log('写数据失败!', res)
      },
    })
  }

  sendBizMsg(object) {
    //let start = new Date().getTime();
    let data = ProtocolBiz.encode(object.type, object.body)
    console.log('发送业务层消息：', Common.ab2hex(data))
    this.sendSecurityLayerMsg(Commands.c4, data)
    //let end = new Date().getTime();
    //console.log("发送电控指令耗时：" + (end-start) + "ms")
    object.success && object.success()
  }
}

function writePackage(data, offset) {
  let that = this
  let length = data.length - offset >= packageSize ? packageSize : data.length - offset //本次分包长度
  let pack = data.slice(offset, offset + length)
  console.log('发送分包', offset, offset + pack.length, pack)
  wx.writeBLECharacteristicValue({
    deviceId: this.device.deviceId,
    serviceId: this.device.serviceId,
    characteristicId: this.device.writeCharacteristic,
    value: pack.buffer,
    success: (res) => {
      console.log('写数据返回结果：', res, new Date())
      offset += pack.length
      if (offset < data.length) {
        that.writePackage(data, offset)
      }
    },
    fail(res) {
      console.log('写数据失败!', res)
    },
  })
}

module.exports = {
  writePackage,
}
