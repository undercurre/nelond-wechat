import { projectBinding, spaceBinding, spaceStore } from '../../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'

Component({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding, spaceBinding] })],
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
          console.log(
            '显示选择空间',
            spaceStore.spaceList.find((item) => item.spaceId === this.data.value),
          )
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
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleRoomSelect(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        roomSelect: e.currentTarget.dataset.id,
      })
    },
  },
})
