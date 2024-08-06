import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { bindDevice } from '../../../apis/index'
import { projectBinding, spaceBinding, userStore } from '../../../store/index'
import { getCurrentPageParams, goBackPage } from '../../../utils/index'
import cacheData from '../../common/cacheData'

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
    mobile: '',
  },

  lifetimes: {
    ready() {
      this.setData({
        mobile: userStore.userInfo.mobilePhone.substring(0, 3) + '****' + userStore.userInfo.mobilePhone.substr(7),
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async auth() {
      const pageParams = getCurrentPageParams()
      console.debug('pageParams', pageParams)
      const bindRes = await bindDevice(
        {
          projectId: projectBinding.store.currentProjectId,
          spaceId: spaceBinding.store.currentSpace.spaceId,
          sn: pageParams.sn,
          nonce: pageParams.code,
          deviceName: '边缘网关',
        },
        { loading: true },
      )

      if (bindRes.success) {
        Toast({
          message: '绑定成功',
          onClose: () => {
            goBackPage(cacheData.pageEntry)
          },
        })
      } else {
        Toast('绑定失败')
      }
    },
  },
})
