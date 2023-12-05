import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { bindMeiju, getMeijuHomeList, queryUserMideaAuthInfo } from '../../../apis/index'
import { delay, storage } from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { homeStore } from '../../../store/index'

type HomeCard = Meiju.MeijuHome

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    homeList: [] as HomeCard[],
    listHeight: 0,
    loading: false,
    checkIndex: 0, // 选择的家庭index
  },

  computed: {
    currentHome(data) {
      return data.homeList[data.checkIndex] || ({} as HomeCard)
    },
  },

  methods: {
    async onLoad(query: { code: string }) {
      console.log('onLoad of homeList, query.code ===', query.code)

      const res = await getMeijuHomeList(query.code)

      if (res.success) {
        const homeList = res.result.mideaHouseList

        this.setData({
          homeList,
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
        const houseName = authRes.result.houseName
        await Dialog.confirm({
          title: `当前美居家庭已绑定Homlux家庭【${houseName}】，若绑定至新Homlux家庭请先在原家庭解绑`,
          showCancelButton: false,
        })
        this.setData({
          loading: false,
        })

        return
      }

      const entry = storage.get('meiju_auth_entry')

      if (entry === 'distribution-meiju') {
        await this.bindMeijuHome()
        this.setData({
          loading: false,
        })
      } else {
        const url = `/package-auth/pages/device-list/index?homeId=${this.data.currentHome?.mideaHouseId}`
        wx.navigateTo({ url })
      }
    },

    async bindMeijuHome() {
      const res = await bindMeiju({
        mideaHouseId: this.data.currentHome?.mideaHouseId,
        houseId: homeStore.currentHomeId,
      })

      if (res.success) {
        storage.remove('meiju_auth_entry') // 清除缓存标志，以免影响其他逻辑

        wx.redirectTo({
          url: '/package-distribution-meiju/pages/check-auth/index',
        })
      } else {
        Toast(res.msg)
      }
    },
  },
})
