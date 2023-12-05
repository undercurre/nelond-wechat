import { homeBinding, roomBinding } from '../../../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'

Component({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            roomSelect: this.data.value,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.roomSelect)
    },
    handleRoomSelect(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        roomSelect: e.currentTarget.dataset.id,
      })
    },
  },
})
