import { storage } from '../../utils/index'
import { userService, privacyPolicy } from './protocol-doc'
import pageBehavior from '../../behaviors/pageBehaviors'
Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    type: '',
    doc: '',
    title: '',
    url: '',
    width: '',
    height: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(e: { protocal: string }) {
      console.log(e)
      if (e.protocal === 'privacyPolicy') {
        this.setData({
          title: '美的商照隐私协议',
          type: 'doc',
          doc: privacyPolicy,
        })
      } else if (e.protocal === 'userService') {
        this.setData({
          title: '软件许可及用户服务协议',
          type: 'doc',
          doc: userService,
        })
      } else if (e.protocal === 'userInfoList') {
        this.setData({
          title: '已收集个人信息清单',
          type: 'img',
          url: '/package-protocol/assets/img/userInfoList.png',
          width: '750rpx',
          height: '1060rpx',
        })
      } else if (e.protocal === 'authList') {
        this.setData({
          title: '美的商照权限列表',
          type: 'img',
          url: '/package-protocol/assets/img/authList.png',
          width: '141vh',
          height: '100vh',
        })
      }
    },
    handleImgTap() {
      wx.previewMedia({
        sources: [
          {
            url: this.data.url,
            type: 'image',
          },
        ],
        showmenu: true,
      })
    },
  },
})
