import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { logout, storage, strUtil } from '../../utils/index'
import { userBinding, projectBinding, userStore } from '../../store/index'
import { defaultImgDir } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding, projectBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    managerList: [
      {
        icon: '/assets/img/mine/home.png',
        text: '项目管理',
        url: '/package-mine/project-manage/index',
      },
      {
        icon: '/assets/img/mine/device.png',
        text: '设备管理',
        url: '/package-mine/device-manage/index',
      },
      {
        icon: '/assets/img/mine/member.png',
        text: '成员管理',
        url: '/package-mine/member-manage/index',
      },
    ],
    urls: {
      homeControl: '/package-mine/project-manage/index',
      automation: '/package-automation/automation/index',
      voiceControl: '/package-mine/voice-control/index',
      auth: '/package-auth/pages/index/index',
      deviceReplace: '/package-mine/device-replace/index',
      feedback: '/package-mine/feedback/index',
      help: '/package-mine/help/list/index',
      about: '/package-protocol/protocol-list/index',
      deviceCategory: '/package-mine/device-category/index',
      setting: '/package-mine/setting/index',
    },
    scrollViewHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('navigationBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) +
      'px',
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        if (!this.data.isLogin || this.data.isVisitor) {
          this.getTabBar().setData({
            selected: 1,
          })
        } else {
          this.getTabBar().setData({
            selected: 2,
          })
        }
      }
    },
  },
  methods: {
    toPage(e: { currentTarget: { dataset: { url: string; auth: string; param: string } } }) {
      console.log('e.currentTarget.dataset', e.currentTarget)
      const { url, auth, param } = e.currentTarget.dataset
      // 如果用户已经登录，开始请求数据
      if (auth !== 'no' && !storage.get<string>('token')) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams(url, param === undefined ? {} : { param }),
      })
    },

    async loginOut() {
      const res = await wx.showModal({
        content: '确认退出登录？',
        confirmColor: '#27282A',
        cancelColor: '#27282A',
      })

      if (res.cancel) return

      logout()
    },

    /** 如果没登陆，点击头像去登录 */
    handleUserInfoTap() {
      if (!userStore.isLogin) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
      }
    },
  },
})
