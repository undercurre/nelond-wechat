import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getCurrentPageParams, checkInputNameIllegal, Logger } from '../../utils/index'
import { queryDeviceInfoByDeviceId, editDeviceInfo, batchUpdate } from '../../apis/index'
import { projectBinding, projectStore, spaceBinding, deviceStore, spaceStore } from '../../store/index'
import { PRO_TYPE, defaultImgDir } from '../../config/index'
import cacheData from '../common/cacheData'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    defaultImgDir,
    deviceInfo: {
      deviceId: '',
      deviceName: '',
      spaceId: '',
      spaceName: '',
      proType: '',
      sn: '',
      switchList: [] as IAnyObject[],
    },
  },

  computed: {
    isSwitch(data) {
      return data.deviceInfo.proType === '0x21'
    },
  },

  lifetimes: {
    ready() {
      this.getDeviceInfo()
    },
    detached() {},
  },

  pageLifetimes: {
    show() {},
    hide() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async getDeviceInfo() {
      const pageParams = getCurrentPageParams()

      console.log('getCurrentPageParams', pageParams)

      const res = await queryDeviceInfoByDeviceId({ deviceId: pageParams.deviceId }, { loading: true })

      const spaceInfo = spaceStore.allSpaceList.find((item) => item.spaceId === res.result.spaceId) as Space.allSpace

      if (res.success) {
        this.setData({
          deviceInfo: {
            deviceId: pageParams.deviceId,
            deviceName: res.result.deviceName,
            sn: res.result.sn,
            spaceId: spaceInfo.spaceId,
            spaceName: spaceStore.getSpaceFullName(spaceInfo),
            proType: res.result.proType,
            switchList:
              res.result.proType === PRO_TYPE.switch && res.result.switchInfoDTOList
                ? res.result.switchInfoDTOList.map((item) => ({
                    switchId: item.switchId,
                    switchName: item.switchName,
                  }))
                : [],
          },
        })
      }
    },

    changeDeviceInfo(event: WechatMiniprogram.CustomEvent) {
      console.log('changeDeviceInfo', event)

      this.setData({
        'deviceInfo.spaceId': event.detail.spaceId,
        'deviceInfo.deviceName': event.detail.deviceName,
        'deviceInfo.switchList': event.detail.switchList,
      })
    },

    async finish() {
      const { deviceId, deviceName, spaceId } = this.data.deviceInfo

      if (!deviceName) {
        Toast('设备名称不能为空')
        return
      }

      // 校验名字合法性
      if (checkInputNameIllegal(deviceName)) {
        Toast('设备名称不能用特殊符号或表情')
        return
      }

      if (deviceName.length > 6) {
        Toast('设备名称不能超过6个字符')
        return
      }

      const res = await editDeviceInfo({
        deviceId,
        deviceName,
        spaceId,
        projectId: projectBinding.store.currentProjectId,
        type: '2',
      })

      if (this.data.deviceInfo.switchList.length > 1) {
        const deviceInfoUpdateVoList = this.data.deviceInfo.switchList.map((item) => {
          return {
            deviceId: deviceId,
            projectId: projectStore.currentProjectId,
            switchId: item.switchId,
            switchName: item.switchName,
            type: '3',
          }
        })

        await batchUpdate({ deviceInfoUpdateVoList })
      }

      if (res.success) {
        projectBinding.store.updateCurrentProjectDetail()

        await deviceStore.updateallDeviceList()

        // 关闭扫描页面可能开启的蓝牙资源
        wx.closeBluetoothAdapter()

        Logger.console('cacheData', cacheData)
        if (cacheData.pageEntry) {
          wx.reLaunch({
            url: cacheData.pageEntry,
          })
        } else {
          wx.navigateBack({
            delta: 3,
          })
        }
      } else {
        Toast('保存失败')
      }
    },
  },
})
