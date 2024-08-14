import Toast from '@vant/weapp/toast/toast'
import { storage, showRemoteDoc } from '../../../../utils/index'
import { DOC_List } from '../../../../config/index'

Component({
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    isShowPotocolModal: false, // 是否展示协议同意弹窗
    isAgree: false, // 是否同意协议
    docList: DOC_List.filter((item) => item.isShowLogin).map((item) => ({ ...item, hasRead: false })), // 需要在登录时同意的协议列表
    checkImg: '/assets/img/base/check.png',
    uncheckImg: '/assets/img/base/uncheck.png',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onAgreeClick(event: { detail: boolean }) {
      const hasAgree = storage.get('hasAgree')

      console.log('hasAgree', hasAgree)
      // 若从未阅读过协议，则弹出强制阅读提醒弹窗
      if (!hasAgree) {
        this.setData({ isShowPotocolModal: true })
        return
      }
      const isAgree = event.detail
      this.setData({ isAgree })
      this.triggerEvent('change', event.detail)
    },

    async showDoc(e: WechatMiniprogram.TouchEvent) {
      const { url } = e.currentTarget.dataset

      console.debug('showDoc', e)
      const hasRead = await showRemoteDoc(url)

      if (hasRead) {
        const docItem = this.data.docList.find((item) => item.url === url)

        docItem!.hasRead = true
      }
    },

    handleConfirm() {
      // 查询是否已下载过对应协议文件来判断是否已阅读
      const index = this.data.docList.findIndex((item) => !item.hasRead)

      if (index >= 0) {
        Toast('请先阅读完所有协议')
        return
      }

      storage.set('hasAgree', true)
      this.triggerEvent('change', true)
      this.setData({ isShowPotocolModal: false, isAgree: true })
    },

    handleCancel() {
      this.setData({ isShowPotocolModal: false })
    },
  },
})
