import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, homeBinding, userBinding, deviceBinding, homeStore } from '../../store/index'
import {
  saveOrUpdateUserHouseInfo,
  delUserHouse,
  quitUserHouse,
  updateDefaultHouse,
  queryUserThirdPartyInfo,
  delDeviceSubscribe,
} from '../../apis/index'
import { strUtil, checkInputNameIllegal, emitter } from '../../utils/index'

ComponentWithComputed({
  options: {},
  behaviors: [
    BehaviorWithStore({ storeBindings: [roomBinding, homeBinding, userBinding, deviceBinding] }),
    pageBehaviors,
  ],

  /**
   * 页面的初始数据
   */
  data: {
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    // 正在编辑的家庭信息
    homeInfoEdited: {
      houseId: '',
      houseName: '',
    },
    isFocus: false,
    isEditName: false,
    isShowSetting: false,
  },

  computed: {
    settingActions(data) {
      const actions = []

      if (data.currentHomeDetail?.houseUserAuth === 1 || data.currentHomeDetail?.houseUserAuth === 2) {
        actions.push({
          name: '重命名',
        })
      }

      // 用户家庭权限 1：创建者 2：管理员 3：游客
      if (data.currentHomeDetail?.houseUserAuth === 1) {
        actions.push(
          {
            name: '转让家庭',
          },
          {
            name: '解散家庭',
          },
        )
      } else {
        actions.push({
          name: '退出家庭',
        })
      }

      return actions
    },
    namingPopupTitle(data) {
      return data.homeInfoEdited.houseId ? '重命名家庭' : '新建家庭'
    },
    houseName(data) {
      return data.currentHomeDetail?.houseName?.length > 6
        ? data.currentHomeDetail?.houseName.slice(0, 6) + '...'
        : data.currentHomeDetail?.houseName
    },
  },

  lifetimes: {
    ready: async function () {
      console.log('home manage ==== ready')
      homeStore.updateHomeInfo()
      homeBinding.store.updateHomeMemberList()

      emitter.on('homeInfoEdit', () => {
        homeStore.updateHomeInfo()
        homeBinding.store.updateHomeMemberList()
      })

      emitter.on('invite_user_house', () => {
        homeStore.updateHomeInfo()
      })
    },
    detached: function () {
      emitter.off('homeInfoEdit')
      emitter.off('invite_user_house')
    },
  },

  methods: {
    /**
     * 用户点击展示/隐藏家庭选择
     */
    async handleShowHomeSelectMenu() {
      const query = wx.createSelectorQuery()
      query.select('#homeName').boundingClientRect((res) => {
        this.setData({
          selectHomeMenu: {
            x: `${res.left + 10}px`,
            y: `${res.bottom + 10}px`,
            isShow: !this.data.selectHomeMenu.isShow,
          },
          'dropdownMenu.isShow': false,
        })
      })
      query.exec()
    },

    hideMenu() {
      this.setData({
        'selectHomeMenu.isShow': false,
      })
    },

    toSetting() {
      this.setData({
        isShowSetting: true,
      })
    },

    onCloseSetting() {
      this.setData({
        isShowSetting: false,
      })
    },
    onSelectSetting(e: WechatMiniprogram.CustomEvent) {
      const name = e.detail.name

      switch (name) {
        case '重命名':
          this.editName()
          break

        case '解散家庭':
          this.delHome()
          break

        case '转让家庭':
          this.toTransferHome()
          break

        case '退出家庭':
          this.quitHome()
          break
      }
    },

    async toTransferHome() {
      const list = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)

      if (list.length <= 1) {
        Toast({
          message: '请至少保留一个创建的家庭',
        })

        return
      }

      // 增加美居授权校验及提醒，并提供取消授权入口和二次确认
      const bindRes = await queryUserThirdPartyInfo(homeStore.currentHomeId, { loading: true })

      const isAuth = bindRes.success ? bindRes.result[0].authStatus === 1 : false

      if (!bindRes.success) {
        Toast('查询美居授权状态失败')
        return
      }

      if (isAuth) {
        const res = await Dialog.confirm({
          title: '当前家庭已绑定美居账号，转让家庭必须先解绑，确认是否解绑',
        }).catch(() => 'cancel')

        console.log('delHome', res)

        if (res === 'cancel') {
          return
        }

        const dialogRes = await Dialog.confirm({
          title: '取消授权后，美居家庭的设备将从HOMLUX家庭移除，请谨慎操作。',
        }).catch(() => 'cancel')

        if (dialogRes === 'cancel') return

        const deBindRes = await this.deBindMeiju()

        if (!deBindRes?.success) {
          return
        }
      }

      wx.navigateTo({
        url: '/package-mine/home-transfer/index',
      })
    },

    async deBindMeiju() {
      const dialogRes = await Dialog.confirm({
        title: '取消授权后，美居家庭的设备将从HOMLUX家庭移除，请谨慎操作。',
      }).catch(() => 'cancel')

      if (dialogRes === 'cancel') return

      const res = await delDeviceSubscribe(homeStore.currentHomeId)
      if (res.success) {
        Toast('已解除绑定')

        homeStore.updateRoomCardList()
      } else {
        Toast(res.msg)
      }

      return res
    },
    /**
     * 创建家庭
     */
    createHome() {
      // const ownerHomeList = homeStore.homeList.filter((home) => home.houseCreatorFlag)
      if (homeStore.homeList.length >= 20) {
        Toast('每个账号最多可以存在20个家庭')
        return
      }
      this.setData({
        isEditName: true,
        homeInfoEdited: {
          houseId: '',
          houseName: '',
        },
      })
    },

    editName() {
      this.setData({
        isEditName: true,
        homeInfoEdited: {
          houseId: homeBinding.store.currentHomeDetail.houseId,
          houseName: homeBinding.store.currentHomeDetail.houseName,
        },
      })

      setTimeout(() => {
        this.setData({
          isFocus: true,
        })
      }, 500)
    },
    onCloseEditName() {
      this.setData({
        isEditName: false,
      })
    },

    changeHouseName(e: WechatMiniprogram.CustomEvent) {
      console.log('changeHouseName', e)
      this.setData({
        'homeInfoEdited.houseName': e.detail,
      })
    },
    /**
     * 确认家庭信息
     */
    async confirmHomeInfo() {
      const { houseName } = this.data.homeInfoEdited

      if (checkInputNameIllegal(houseName)) {
        Toast('家庭名称不能用特殊符号或表情')
        return
      }

      if (houseName.length > 15) {
        Toast('家庭名称不能超过15个字符')

        return
      }

      this.setData({
        isEditName: false,
      })

      const res = await saveOrUpdateUserHouseInfo({
        ...this.data.homeInfoEdited,
        userLocationInfo: '',
      })

      if (!res.success) {
        Toast(this.data.homeInfoEdited.houseId ? '修改失败' : '新增失败')
        return
      }

      if (res.success) {
        Toast(this.data.homeInfoEdited.houseId ? '修改成功' : '新增成功')
      }

      if (!this.data.homeInfoEdited.houseId) {
        await updateDefaultHouse(res.result.houseId)
      }

      homeBinding.store.updateHomeInfo()
    },

    async delHome() {
      const allDeviceList = deviceBinding.store.allRoomDeviceList
      if (allDeviceList && allDeviceList.length > 0) {
        Toast('家庭存在设备，不允许解散')
        return
      }

      const homeList = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)
      if (homeList.length <= 1) {
        Toast('请至少保留一个创建的家庭')
        return
      }

      const res = await Dialog.confirm({
        title: '是否解散当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await delUserHouse(homeBinding.store.currentHomeDetail.houseId)

      Toast(delRes.success ? '解散成功' : '解散失败')

      homeBinding.store.updateHomeInfo()
    },

    async quitHome() {
      const res = await Dialog.confirm({
        title: '是否退出当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await quitUserHouse(homeBinding.store.currentHomeDetail.houseId)

      Toast(delRes.success ? '退出成功' : '退出失败')

      homeBinding.store.updateHomeInfo()
    },

    clickRoomItem(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.showRoomList[index]

      if (item.roomIcon === 'more') {
        wx.navigateTo({
          url: '/package-mine/room-manage/index',
        })
      } else {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-mine/room-detail/index', {
            roomId: item.roomId,
            roomName: item.roomName,
            roomIcon: item.roomIcon,
          }),
        })
      }
    },
  },
})
