import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import drawQrcode from 'weapp-qrcode-canvas-2d'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, userBinding } from '../../store/index'
import { ShareImgUrl } from '../../config/index'
import { getShareId } from '../../apis/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isTransferHome: false,
    _shareId: '',
    _timeId: 0,
  },

  computed: {},

  lifetimes: {
    ready: async function () {
      wx.updateShareMenu({
        withShareTicket: true, // 用于禁用分享选择界面的多选操作
      })

      const res = await getShareId({ houseId: homeBinding.store.currentHomeId })

      if (res.success) {
        this.data._shareId = res.result.shareId

        this.showQrCode()
      }
    },
    moved: function () {},
    detached: function () {
      clearInterval(this.data._timeId)
    },
  },

  methods: {
    /**
     * 获取分享链接参数
     * @param params expire 过期时间(秒)
     */
    getShareParams(params: { expire: number }) {
      const expireTime = new Date().valueOf() + params.expire * 1000 // 过期时间

      // todo: 暂时去掉&shareId=${this.data._shareId}
      return `type=transferHome&houseId=${homeBinding.store.currentHomeId}&expireTime=${expireTime}&shareId=${this.data._shareId}&userId=${userBinding.store.userInfo.userId}`
    },
    showQrCode() {
      const query = wx.createSelectorQuery()

      query
        .select('#myQrcode')
        .fields({
          node: true,
          size: true,
        })
        .exec((res) => {
          const canvas = res[0].node

          this.generateQrCode(canvas)

          // 5分钟刷新一次，原二维码失效
          this.data._timeId = setInterval(() => {
            this.generateQrCode(canvas)
          }, 300000)
        })
    },

    // 生成二维码
    generateQrCode(canvas: IAnyObject) {
      const url = 'https://web.meizgd.com/homlux/qrCode.html?' + this.getShareParams({ expire: 300 })

      console.debug('二维码链接：', url)
      const img = canvas.createImage()
      img.src = '../../assets/img/login/logo.png'

      // img.onload完成后才能调用 drawQrcode方法
      img.onload = function () {
        // 调用方法drawQrcode生成二维码
        drawQrcode({
          canvas: canvas,
          canvasId: 'myQrcode',
          width: 260,
          padding: 20,
          background: '#ffffff',
          foreground: '#000000',
          text: url,
          correctLevel: 1,
          image: {
            imageResource: img,
            width: 80, // 建议不要设置过大，以免影响扫码
            height: 80, // 建议不要设置过大，以免影响扫码
            round: false, // Logo图片是否为圆形
          },
        })
      }
    },
    toTransferHomeMember() {
      if (homeBinding.store.currentHomeDetail.userCount <= 1) {
        Toast('没有其他成员可供转让')

        return
      }

      this.setData({
        isTransferHome: true,
      })
    },

    // 链接有效时长24小时
    onShareAppMessage() {
      const title = '将我的家庭转让给你'

      return {
        title,
        path: '/pages/index/index?' + this.getShareParams({ expire: 86400 }),
        imageUrl: ShareImgUrl,
      }
    },

    closeTransferHome() {
      this.setData({
        isTransferHome: false,
      })
    },
  },
})
