import pageBehavior from '../../behaviors/pageBehaviors'
// import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
import { queryAutoSceneLogByHouseId } from '../../apis/scene'
import { sceneImgDir, defaultImgDir } from '../../config/index'
import { homeStore } from '../../store/home'
import dayjs from 'dayjs'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    sceneImgDir,
    defaultImgDir,
    contentHeight: 0,
    isRefreshing: false,
    isAllLogs: false,
    _tempLog: [] as AutoScene.AutoSceneLog[],
  },

  computed: {
    autoSceneLog(data) {
      const logsMap = {} as Record<string, AutoScene.AutoSceneLog[]>
      data._tempLog.forEach((item) => {
        const date = dayjs(item.reportAt).format('M月D日')
        if (logsMap[date]) {
          logsMap[date].push({ ...item, actionTime: dayjs(item.reportAt).format('HH:mm') })
        } else {
          logsMap[date] = [{ ...item, actionTime: dayjs(item.reportAt).format('HH:mm') }]
        }
      })
      console.log('logsMap', logsMap)

      return logsMap
    },
    autoSceneLogLength(data) {
      return Object.keys(data.autoSceneLog).length
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad() {
      const logRes = await queryAutoSceneLogByHouseId({ houseId: homeStore.currentHomeId })
      if (logRes.success) {
        this.setData({
          _tempLog: logRes.result,
          isAllLogs: logRes.result.length < 50,
        })
      }
      console.log('日志', logRes)

      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },

    async onRefresh() {
      this.setData({
        isRefreshing: true,
      })

      const logRes = await queryAutoSceneLogByHouseId({ houseId: homeStore.currentHomeId })
      if (logRes.success) {
        this.setData({
          _tempLog: logRes.result,
          isAllLogs: logRes.result.length < 50,
        })
      }
      this.setData({
        isRefreshing: false,
      })
    },

    async onLoadmore() {
      const logRes = await queryAutoSceneLogByHouseId({
        houseId: homeStore.currentHomeId,
        reportTs: this.data._tempLog[this.data._tempLog.length - 1].reportTs,
      })
      if (logRes.success) {
        this.setData({
          _tempLog: this.data._tempLog.concat(logRes.result),
          isAllLogs: logRes.result.length < 50,
        })
      }
    },
  },
})
