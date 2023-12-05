import { wxGetOpenSetting } from '../js/commonWxApi.js'
module.exports = Behavior({
  behaviors: [],
  properties: {},
  data: {
    isSureDialog: false,
    isShowDialogMixinsBlueDesc: false,
    dialogMixinsTitle: '',
    dialogMixinsContent: '',
    dialogMixinsBtnText: '我知道了',
    dialogMixinsBtns: [],
    dialogMixinsContentLinks: [],
  },
  methods: {
    setDialogMixinsData(
      isSureDialog,
      dialogMixinsTitle,
      dialogMixinsContent,
      isShowDialogMixinsBlueDesc = false,
      btns,
      contentLinks,
    ) {
      this.setData({
        isSureDialog: isSureDialog,
        dialogMixinsTitle: dialogMixinsTitle,
        isShowDialogMixinsBlueDesc: isShowDialogMixinsBlueDesc,
        dialogMixinsContent: dialogMixinsContent,
        dialogMixinsBtns: btns,
        dialogMixinsContentLinks: contentLinks,
      })
    },
    makeSure(e) {
      const item = e.detail
      console.log('888888888', item)
      this.setData({
        isSureDialog: false,
      })
      if (item.flag == 'goSetting') {
        wxGetOpenSetting()
      }
    },
    clickLink(e) {
      const item = e.detail
      console.log('[click link item]', item)
      this.setData({
        isSureDialog: false,
      })
    },
  },
})
