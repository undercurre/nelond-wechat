import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { execOtaUpdate, setOtaSchedule } from '../../../apis/ota'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { projectBinding, projectStore, userBinding, otaStore } from '../../../store/index'
import { getCurrentPageParams } from '../../../utils/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, userBinding] }), pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    pageTitle: '',
    otaType: 2,
    isLoading: false,
    contentHeight: 0,
    otaData: [{}],
    isRequestingOta: false, // 是否正在请求下发ota
    _pollingTimer: 0,
    jobStatus: 0, // 定时任务状态 0：未启动 1：启动
    otaProductList: [] as Ota.OtaProduct[], // 可更新的固件版本列表
    otaUpdateList: [] as Ota.OtaUpdate[], // 更新固件的设备列表
  },

  computed: {
    remainOtaDevice(data) {
      let count = 0
      data.otaUpdateList?.forEach((device: Ota.OtaUpdate) => {
        if ([0, 1].includes(device.otaUpdateStatus)) {
          count++
        }
      })
      return count
    },
    canOTA(data) {
      return data.isManager
    },
    // 网关升级按钮
    gatewayBtnText(data) {
      const { isUpdating } = data
      return isUpdating ? '升级中...' : '升级'
    },
    // 批量升级按钮
    btnText(data) {
      const { isUpdating, remainOtaDevice } = data
      if (isUpdating) {
        return `剩余${remainOtaDevice}个设备...`
      }
      return remainOtaDevice.length > 1 ? '批量升级' : '立即升级'
    },

    /** 是否存在固件更新 */
    hasUpdate(data) {
      return data.otaProductList.length > 0
    },

    /** 是否正在进行固件更新 */
    isUpdating(data) {
      return data.otaProductList.some((product) => product.updateStatus === 1)
    },
  },

  lifetimes: {
    ready() {
      const pageParams = getCurrentPageParams()

      console.log('pageParams', pageParams)

      this.setData({
        pageTitle: pageParams.title,
        otaType: parseInt(pageParams.otaType, 10),
      })

      this.queryOtaInfo()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onUnload() {
      this.stopPolling()
    },
    async queryOtaInfo() {
      const res = await otaStore.updateList()

      if (!res.success) {
        Toast('查询OTA信息失败')
        return
      }
      if (res.success) {
        let otaUpdateList = [] as Ota.OtaUpdate[]

        otaUpdateList = res.result.otaUpdateList.filter((item) => item.otaType === this.data.otaType)

        // 兼容私有化部署，兼容旧版云端接口，接口没有返回otaType  TODO: 私有化（微清、邯郸工厂）云端版本更新后可去除【!item.otaType】空判断
        const otaProductList = res.result.otaProductList.filter(
          (item) => !item.otaType || item.otaType === this.data.otaType,
        )
        // .map((item) => ({ ...item, versionDesc: item.versionDesc.replace(/ /gi, '\n') }))

        this.setData({
          jobStatus: res.result.jobStatus,
          otaProductList,
          otaUpdateList,
        })
      }
    },
    async onAutoUpdateChange() {
      if (this.data.isLoading) {
        return
      }
      this.setData({
        isLoading: true,
      })
      const jobStatus = this.data.jobStatus === 1 ? 0 : 1

      const res = await setOtaSchedule({
        projectId: projectStore.currentProjectId,
        jobStatus,
      })
      if (res.success) {
        this.setData({
          jobStatus,
          isLoading: !this.data.isLoading,
        })
      } else {
        this.setData({
          isLoading: !this.data.isLoading,
        })
      }
    },
    async handleUpdate(e: { target: { dataset: { deviceId?: string } } }) {
      // 没有更新或者正在发起更新请求时，终止
      if (!this.data.hasUpdate || this.data.isRequestingOta) {
        return
      }

      const { deviceId } = e.target.dataset
      console.log('下发OTA', deviceId, typeof deviceId === 'string')
      this.setData({
        isRequestingOta: true,
      })

      let deviceOtaList = this.data.otaUpdateList

      if (typeof deviceId === 'string') {
        deviceOtaList = deviceOtaList.filter((d) => d.deviceId === deviceId)
      }

      const res = await execOtaUpdate(
        {
          deviceOtaList,
        },
        { loading: !this.data.isUpdating },
      )

      if (res.success) {
        // 下发升级指令成功，轮询直到完成更新
        this.startPollingQuery()
      } else {
        Toast(res.msg)
      }

      this.setData({
        isRequestingOta: false,
      })
    },
    /**
     * 轮询当前ota进程是否完成更新
     */
    async startPollingQuery() {
      await this.queryOtaInfo()

      if (!this.data.isUpdating) {
        this.data._pollingTimer = setTimeout(() => {
          this.startPollingQuery()
        }, 30000)
      }
    },
    stopPolling() {
      if (this.data._pollingTimer) {
        clearTimeout(this.data._pollingTimer)
        this.data._pollingTimer = 0
      }
    },
  },
})
