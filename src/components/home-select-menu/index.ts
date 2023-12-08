import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, homeStore } from '../../store/index'
import { updateDefaultHouse } from '../../apis/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    x: {
      type: String,
      value: '0',
    },
    y: {
      type: String,
      value: '0',
    },
    isShow: {
      type: Boolean,
      value: false,
      observer: function (newVal: boolean) {
        if (newVal) {
          this.setData({
            isRender: true,
          })
          this.showAnimate()
        } else {
          this.hideAnimate()
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isRender: false,
    reverseArrow: false,
  },

  computed: {
    sortedHomeList(data) {
      if (!data.homeList || !data.homeList.length) {
        return [
          {
            defaultHouseFlag: false,
            deviceNum: 7,
            houseCreatorFlag: false,
            houseId: '0dc04866f4284d2d83efd85fe222c7fb',
            houseName: '美创4栋',
            roomNum: 4,
            userNum: 6,
          },
          {
            defaultHouseFlag: false,
            deviceNum: 7,
            houseCreatorFlag: false,
            houseId: '0dc04866f4284d2d83efd85fe222c7fb',
            houseName: '美创6栋',
            roomNum: 4,
            userNum: 6,
          },
        ]
      }
      const list = (data.homeList as Home.IHomeItem[])
        .sort((_: Home.IHomeItem, b: Home.IHomeItem) => (b.defaultHouseFlag ? 1 : -1))
        .map((home) => ({
          ...home,
          houseName: home.houseName?.length > 6 ? home.houseName.slice(0, 6) + '...' : home.houseName,
        }))

      return list
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleHomeTap(e: { currentTarget: { dataset: { value: string } } }) {
      const houseId = e.currentTarget.dataset.value

      console.log('handleHomeTap', e)
      this.triggerEvent('select', { houseId })
      const res = await updateDefaultHouse(houseId)

      if (res.success) {
        await homeStore.homeInit()
      }
      this.triggerEvent('afterSelected', { houseId })
    },
    hideAnimate() {
      this.animate(
        '#menu',
        [
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
        () => {
          this.setData({
            isRender: false,
          })
        },
      )
    },
    showAnimate() {
      this.animate(
        '#menu',
        [
          {
            opacity: 0,
            scaleY: 0.8,
            scaleX: 0.8,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
          {
            opacity: 1,
            scaleY: 1,
            scaleX: 1,
            transformOrigin: '64rpx -16rpx 0',
            ease: 'ease',
          },
        ],
        100,
      )
    },
    scrollToLower() {
      this.setData({
        reverseArrow: true,
      })
    },
    scrollToUpper() {
      this.setData({
        reverseArrow: false,
      })
    },
    black() {},
  },
})
