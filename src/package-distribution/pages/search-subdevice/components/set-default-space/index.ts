import { spaceStore } from '../../../../../store/index'

Component({
  behaviors: [],
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    spaceId: {
      type: String,
      value: '',
    },
    spaceName: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    showSpaceSelectPopup: false,
    selectSpace: {
      spaceId: '',
      spaceName: '',
    },
  },

  observers: {
    spaceId: function () {
      this.setData({
        'selectSpace.spaceId': this.data.spaceId,
        'selectSpace.spaceName': this.data.spaceName,
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close() {
      this.triggerEvent('close')
    },
    onSpaceSelect(e: { detail: Space.allSpace[] }) {
      const selectList = e.detail

      const spaceInfo = selectList[selectList.length - 1]

      this.setData({
        'selectSpace.spaceId': spaceInfo.spaceId,
        'selectSpace.spaceName': spaceStore.getSpaceClearName(spaceInfo),
      })
    },
    async handleConfirm() {
      this.triggerEvent('confirm', Object.assign({}, this.data.selectSpace))

      this.setData({
        showSpaceSelectPopup: false,
      })
    },

    toggleSpaceSelect() {
      this.setData({
        showSpaceSelectPopup: !this.data.showSpaceSelectPopup,
      })
    },
  },
})
