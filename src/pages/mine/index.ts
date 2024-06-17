import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { logout, storage, strUtil } from '../../utils/index'
import { userBinding, projectBinding, userStore, projectStore } from '../../store/index'
import { ossDomain } from '../../config/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import Toast from '@vant/weapp/toast/toast'

Component({
  behaviors: [BehaviorWithStore({ storeBindings: [userBinding, projectBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    ossDomain,
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
      deviceReplace: '/package-mine/device-replace/index',
      feedback: '/package-mine/feedback/index',
      help: '/package-mine/help/list/index',
      about: '/package-about/pages/index/index',
      deviceCategory: '/package-mine/device-category/index',
      ota: '/package-mine/pages/ota/index',
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
        // if (!this.data.isLogin || !this.data.isManager) {
        //   this.getTabBar().setData({
        //     selected: 1,
        //   })
        // } else {
        this.getTabBar().setData({
          selected: 2,
        })
        // }
      }
    },
  },
  methods: {
    toPage(e: { currentTarget: { dataset: { url: string; auth: string; param: string } } }) {
      console.log('e.currentTarget.dataset', e.currentTarget)
      const { url, auth, param } = e.currentTarget.dataset
      if (auth !== 'no' && !storage.get<string>('token')) {
        wx.navigateTo({
          url: '/pages/login/index',
        })
        return
      }
      // 拦截未有项目的情况
      if (auth !== 'no' && !projectStore.projectList?.length) {
        Toast('请先在管理端添加或关联项目')
        return
      }

      // 如果用户已经登录
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
      const url = userStore.isLogin ? '/package-mine/user-detail/index' : '/pages/login/index'
      wx.navigateTo({ url })
    },
  },
})
