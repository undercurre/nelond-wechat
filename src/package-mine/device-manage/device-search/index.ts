import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceStore, spaceStore } from '../../../store/index'
import { storage, strUtil, unique } from '../../../utils/index'
import { PRO_TYPE, SCREEN_PID, MAX_HISTORY, defaultImgDir } from '../../../config/index'
import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  behaviors: [pageBehavior],
  data: {
    defaultImgDir: defaultImgDir(),
    keyword: '', // 已输入的关键字
    historyList: [] as string[], // 关键字搜索历史
    recList: ['网关', '筒灯', '射灯', '工矿灯', '线条灯', '开关', '传感器', '窗帘'],
    deviceList: [] as Device.DeviceItem[],
    isLoaded: false,
  },
  computed: {
    showKeywords(data) {
      return !data.keyword || !data.deviceList?.length
    },
  },
  methods: {
    onLoad() {
      this.setData({
        historyList: (storage.get('SEARCH_HISTORY') as string[]) || [],
      })
    },
    handleTagTap(e: WechatMiniprogram.CustomEvent<never, never, { value: string }>) {
      this.setData({
        keyword: e.currentTarget.dataset.value,
      })
      this.searchConfirm()
    },
    /**
     * 执行前端搜索逻辑
     * @param toSave 是否保存到搜索历史
     */
    searchConfirm(toSave = true) {
      const { historyList, keyword } = this.data

      if (toSave) {
        historyList.unshift(keyword)
        storage.set('SEARCH_HISTORY', unique(historyList).slice(0, MAX_HISTORY))
      }

      // 筛选操作
      const list = deviceStore.allDeviceList?.length ? [...deviceStore.allDeviceList] : []
      const rst = list
        .sort((a, b) => a.orderNum - b.orderNum)

        .filter(
          (d) =>
            // 匹配设备名或mac地址
            (d.deviceName.indexOf(keyword) > -1 || (d.mac ?? '').indexOf(keyword) > -1) &&
            // 过滤智慧屏按键
            ((d.proType === PRO_TYPE.switch && !SCREEN_PID.includes(d.productId)) || d.proType !== PRO_TYPE.switch),
        )
        .map((d) => ({
          ...d,
          spaceClearName: spaceStore.getSpaceClearNameById(d.spaceId),
        }))
      this.setData({
        isLoaded: true,
        deviceList: rst,
      })
    },
    handleChange() {
      if (this.data.keyword) {
        this.searchConfirm(false)
      } else {
        this.setData({
          deviceList: [],
          isLoaded: false,
        })
      }
    },
    handleCardClick(e: { currentTarget: { dataset: { deviceId: string; deviceType: number } } }) {
      const { deviceId, deviceType } = e.currentTarget.dataset
      console.log('handleCardClick', deviceId, deviceType)
      const pageName = deviceType === 4 ? 'group-detail' : 'device-detail'

      wx.navigateTo({
        url: strUtil.getUrlWithParams(`/package-mine/device-manage/${pageName}/index`, {
          deviceId,
        }),
      })
    },
  },
})
