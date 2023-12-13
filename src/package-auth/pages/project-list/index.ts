import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { getMeijuHomeList, queryUserMideaAuthInfo } from '../../../apis/index'
import { delay } from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'

type HomeCard = Meiju.MeijuHome

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    projectList: [] as HomeCard[],
    listHeight: 0,
    loading: false,
    checkIndex: 0, // 选择的项目index
  },

  computed: {
    currentHome(data) {
      return data.projectList[data.checkIndex] || ({} as HomeCard)
    },
  },

  methods: {
    async onLoad(query: { code: string }) {
      console.log('onLoad of projectList, query.code ===', query.code)

      const res = await getMeijuHomeList(query.code)

      if (res.success) {
        const projectList = res.result.mideaHouseList

        this.setData({
          projectList,
        })
      } else {
        Toast(res.msg)
      }

      await delay(500)
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              listHeight: res[0].height - 20,
            })
          }
        })
    },

    onCheckHome(e: { target: { dataset: { index: number } } }) {
      const index = e.target.dataset.index

      if (this.data.checkIndex === index) {
        return
      }

      this.setData({
        checkIndex: index,
      })
    },

    async toConfirm() {
      if (this.data.loading) {
        return
      }
      this.setData({
        loading: true,
      })
      const authRes = await queryUserMideaAuthInfo(this.data.currentHome?.mideaHouseId)

      if (authRes.success && authRes.result.mideaAuthFlag) {
        const projectName = authRes.result.projectName
        await Dialog.confirm({
          title: `当前美居项目已绑定Homlux项目【${projectName}】，若绑定至新Homlux项目请先在原项目解绑`,
          showCancelButton: false,
        })
        this.setData({
          loading: false,
        })

        return
      }

      const url = `/package-auth/pages/device-list/index?homeId=${this.data.currentHome?.mideaHouseId}`
      wx.navigateTo({ url })
    },
  },
})
