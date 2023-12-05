import pageBehaviors from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { CMD, FACTORY_ADDR, FREQUENCY_TIME, MAX_TEMPERATURE, MIN_TEMPERATURE } from '../../config/remoter'
import { Logger, initBleCapacity, storage, isDevMode } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import {
  createBleServer,
  bleAdvertising,
  bleAdvertisingEnd,
  stopAdvertising,
  BleService,
} from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

// 可以开灯的指令，若上次为为这些指令，则关灯
const ON_KEYS = ['LIGHT_LAMP_ON', 'LIGHT_NIGHT_LAMP', 'LIGHT_SCENE_DAILY', 'LIGHT_SCENE_RELAX', 'LIGHT_SCENE_SLEEP']

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isDebugMode: false,
    isFactoryMode: false, // 工厂调试模式，按特定的地址发送指令
    toolbarMarginTop:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    setTemperture: 30,
    _envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    // 记录上一次点击‘照明’时的指令键，用于反转处理；默认为关，即首次会广播开的指令
    _lastPowerKey: 'LIGHT_LAMP_OFF',
    _keyQueue: ['', '', '', '', '', '', '', ''], // 记录圆盘按键序列
    _send_key: '', // 本次广播的非长按指令，松手时清除
    _longpress_key: '', // 正在广播的长按指令，松手时清除
    _timer: 0, // 记录上次指令时间
  },

  computed: {
    connectIcon() {
      return remoterStore.curRemoter?.connected
        ? '/assets/img/base/scene-switch-btn.png'
        : '/assets/img/base/offline.png'
    },
    curAddrText(data) {
      if (!data.isDebugMode) {
        // 没什么意义，但触发主动刷新
        return ''
      }
      const addr = (data.isFactoryMode ? FACTORY_ADDR : remoterStore.curRemoter.addr) ?? ''
      return String.prototype.match.call(addr, /.{1,2}/g)?.join(':')
    },
  },

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      const { addr } = query
      // this.setData({ deviceType, deviceModel, addr })
      remoterStore.setAddr(addr)

      const bleInited = await initBleCapacity()

      if (!bleInited) {
        return
      }

      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()

      // 根据通知,更新设备列表，设备控制页暂时不需要本通知
      // emitter.on('remoterChanged', () => {
      // console.log('remoterChanged on Pannel')

      // })

      // TODO 监听蓝牙连接状态变化

      // 版本获取
      const info = wx.getAccountInfoSync()
      this.data._envVersion = info.miniProgram.envVersion
    },
    onUnload() {
      // emitter.off('remoterChanged')

      // 关闭蓝牙连接
      if (remoterStore.curRemoter.connected) {
        this.data._bleService?.close()
      }
    },

    /**
     * @description 触摸开始时触发的操作，如果实际上不存在长按指令，直接执行 toSendCmd
     */
    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      const { longpress } = e.target.dataset
      if (!longpress) {
        this.toSendCmd(e)
      }
    },

    /**
     * @name 广播控制指令
     * @description 若有长按操作，则触摸结束时触发；不可能有长按操作的按钮，直接由bind:touchstart触发
     */
    async toSendCmd(e: WechatMiniprogram.TouchEvent) {
      console.log('toSendCmd triggered', e, {
        _lastPowerKey: this.data._lastPowerKey,
        _longpress_key: this.data._longpress_key,
        _send_key: this.data._send_key,
      })
      // 如果已执行了长按操作，则不广播短按指令
      if (this.data._longpress_key) {
        return
      }

      if (!this.data._bleServer && !isDevMode) {
        this.data._bleServer = await createBleServer()
      }
      let { key } = e.target.dataset
      // DEBUG 产测指令，仅调试模式可用
      if (key === 'FACTORY' && !this.data.isFactoryMode) {
        return
      }
      // HACK 根据模糊指令匹配为照明按钮，将上次指令作反转处理，转为真实的指令
      if (key === 'LIGHT_LAMP') {
        key = ON_KEYS.includes(this.data._lastPowerKey) ? `LIGHT_LAMP_OFF` : `LIGHT_LAMP_ON`
      }
      // 如果是照明操作相关的按钮，则记录到本页变量中（离开页面不保存）
      if ([...ON_KEYS, 'LIGHT_LAMP_OFF', 'LIGHT_LAMP_ON'].includes(key)) {
        this.data._lastPowerKey = key
      }
      // 如果当前是被 tap 触发，但同时已被 touchStart 触发，则不再执行，并清空触发记录
      if (e.type === 'tap' && this.data._send_key) {
        this.data._send_key = ''
        return
      }
      // 如果当前是被 touchStart 触发，可直接执行广播，同时记录下指令
      else if (e.type === 'touchstart') {
        this.data._send_key = key
      }
      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr

      // 温度特别设值 TODO 重构为更通用方法
      const isTempSetting = ['TEMPERATURE_SETTING_ADD', 'TEMPERATURE_SETTING_SUB'].includes(key)
      if (isTempSetting) {
        let setTemperture =
          key === 'TEMPERATURE_SETTING_ADD' ? this.data.setTemperture + 1 : this.data.setTemperture - 1
        setTemperture = Math.min(Math.max(setTemperture, MIN_TEMPERATURE), MAX_TEMPERATURE)
        this.setData({ setTemperture })
      }
      const payload = isTempSetting
        ? remoterProtocol.generalSettingString([0xff, 0xff, this.data.setTemperture])
        : remoterProtocol.generalCmdString(CMD[key])

      const { dir } = e.target.dataset
      Logger.log('toSendCmd', key, dir, { payload, addr, isFactory: this.data.isFactoryMode })

      const now = new Date().getTime()
      console.log('now - this.data._timer', now - this.data._timer)
      if (now - this.data._timer < FREQUENCY_TIME) {
        Toast('操作太频繁啦~')
      }
      this.data._timer = now

      // DEBUG 蓝牙连接模式
      if (remoterStore.curRemoter.connected) {
        await this.data._bleService?.sendCmd(payload)
      }
      // 广播控制指令
      else {
        bleAdvertising(this.data._bleServer, {
          addr,
          payload,
          isFactory: this.data.isFactoryMode,
        })
      }

      // 记录点击按键序列，作为进入调试模式的前置操作
      this.data._keyQueue.shift()
      this.data._keyQueue.push(dir)
    },
    async handleLongPress(e: WechatMiniprogram.TouchEvent) {
      const { longpress } = e.target.dataset
      if (!longpress) {
        return
      }

      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      const payload = remoterProtocol.generalCmdString(CMD[longpress])
      console.log('handleLongPress', longpress, payload)

      // DEBUG 蓝牙连接模式 TODO 定时连续发指令
      if (remoterStore.curRemoter.connected) {
        await this.data._bleService?.sendCmd(payload)
        await this.data._bleService?.sendCmd(payload)
        await this.data._bleService?.sendCmd(payload)
        await this.data._bleService?.sendCmd(payload)
      }
      // 广播控制指令
      else {
        bleAdvertising(this.data._bleServer, {
          addr,
          payload,
          autoEnd: false, // 松手才发终止指令
          isFactory: this.data.isFactoryMode,
        })
      }

      this.data._longpress_key = e.target.dataset.dir
    },
    // !! 和长按操作必须同时出现
    async handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      // 若已建立连接，则不再广播结束指令
      if (remoterStore.curRemoter.connected) {
        return
      }

      // 如果当前不是执行长按操作，不需要主动广播结束指令
      const { dir } = e.target.dataset
      if (!dir || dir !== this.data._longpress_key) {
        return
      }
      this.data._longpress_key = ''

      // 主动广播结束指令
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      await stopAdvertising(this.data._bleServer)

      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      bleAdvertisingEnd(this.data._bleServer, { addr, isFactory: this.data.isFactoryMode })
    },

    toSetting() {
      wx.navigateTo({
        url: `/package-remoter/setting/index?addr=${remoterStore.curAddr}`,
      })
    },

    // 建立蓝牙连接（调试用）
    async toggleBleMode() {
      // if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
      // const { addr, connected } = remoterStore.curRemoter
      // const { deviceId } = this.data._localList[addr]
      // if (!this.data._bleService) {
      //   this.data._bleService = new BleService({ addr, deviceId })
      // }
      // if (!connected) {
      //   await this.data._bleService.connect()
      //   await this.data._bleService.init()
      // } else {
      //   await this.data._bleService.close()
      // }
      // TODO 更新连接状态
      // const diffData = {} as IAnyObject
      // diffData['device.connected'] = !connected
      // this.setData(diffData)
    },

    toggleDebug() {
      // 只用于开发环境、体验环境
      if (this.data._envVersion === 'release') {
        return
      }

      // 进入调试模式，按键序列满足上上下下左左右右
      const q = this.data._keyQueue.join('')
      this.data._keyQueue = ['', '', '', '', '', '', '', ''] // 清空
      console.log('toggleDebug', q)
      if (!this.data.isDebugMode && q !== 'UUDDLLRR') {
        return
      }

      // 切换调试模式，同时默认禁用工厂模式
      this.setData({ isDebugMode: !this.data.isDebugMode, isFactoryMode: false })
    },

    toggleAddr() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })

      this.setData({ isFactoryMode: !this.data.isFactoryMode })
    },
  },
})
