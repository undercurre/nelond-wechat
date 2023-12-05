import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, deviceBinding } from '../../../../../store/index'

type DeviceCard = Device.DeviceItem & {
  select: boolean
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    list: {
      type: Array,
      observer(value) {
        this.setData({
          lightList: value.map((device) => ({
            ...device,
            select: false,
          })),
        })
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    lightList: [] as DeviceCard[],
    popupTitle: '选择智能灯',
  },

  computed: {
    checkedList(data) {
      return data.lightList.filter((device) => device.select)
    },
  },

  lifetimes: {
    async ready() {},
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(e: { currentTarget: { dataset: { index: number } } }) {
      const { index } = e.currentTarget.dataset
      const oldSelect = this.data.lightList[index].select
      this.setData({
        [`lightList[${index}].select`]: !oldSelect,
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },

    handleConfirm() {
      this.triggerEvent('confirm', this.data.checkedList)
    },
  },
})
