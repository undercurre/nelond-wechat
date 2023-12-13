import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, projectBinding, userBinding, deviceBinding, projectStore } from '../../store/index'
import { saveOrUpdateUserHouseInfo, delUserHouse, quitUserHouse } from '../../apis/index'
import { strUtil, checkInputNameIllegal, emitter } from '../../utils/index'

ComponentWithComputed({
  options: {},
  behaviors: [
    BehaviorWithStore({ storeBindings: [roomBinding, projectBinding, userBinding, deviceBinding] }),
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
    // 正在编辑的项目信息
    homeInfoEdited: {
      projectId: '',
      projectName: '',
    },
    isFocus: false,
    isEditName: false,
    isShowSetting: false,
  },

  computed: {
    settingActions(data) {
      const actions = []

      if (data.currentProjectDetail?.houseUserAuth === 1 || data.currentProjectDetail?.houseUserAuth === 2) {
        actions.push({
          name: '重命名',
        })
      }

      // 用户项目权限 1：创建者 2：管理员 3：游客
      if (data.currentProjectDetail?.houseUserAuth === 1) {
        actions.push(
          {
            name: '转让项目',
          },
          {
            name: '解散项目',
          },
        )
      } else {
        actions.push({
          name: '退出项目',
        })
      }

      return actions
    },
    namingPopupTitle(data) {
      return data.homeInfoEdited.projectId ? '重命名项目' : '新建项目'
    },
    projectName(data) {
      return data.currentProjectDetail?.projectName?.length > 6
        ? data.currentProjectDetail?.projectName.slice(0, 6) + '...'
        : data.currentProjectDetail?.projectName
    },
  },

  lifetimes: {
    ready: async function () {
      console.log('project manage ==== ready')
      projectStore.updateProjectInfo()
      projectBinding.store.updateHomeMemberList()

      emitter.on('homeInfoEdit', () => {
        projectStore.updateProjectInfo()
        projectBinding.store.updateHomeMemberList()
      })

      emitter.on('invite_user_house', () => {
        projectStore.updateProjectInfo()
      })
    },
    detached: function () {
      emitter.off('homeInfoEdit')
      emitter.off('invite_user_house')
    },
  },

  methods: {
    /**
     * 用户点击展示/隐藏项目选择
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

        case '解散项目':
          this.delHome()
          break

        case '转让项目':
          this.toTransferHome()
          break

        case '退出项目':
          this.quitHome()
          break
      }
    },

    async toTransferHome() {
      const list = projectBinding.store.projectList.filter((item) => item.houseCreatorFlag)

      if (list.length <= 1) {
        Toast({
          message: '请至少保留一个创建的项目',
        })

        return
      }

      wx.navigateTo({
        url: '/package-mine/project-transfer/index',
      })
    },

    /**
     * 创建项目
     */
    createHome() {
      // const ownerHomeList = projectStore.projectList.filter((project) => project.houseCreatorFlag)
      if (projectStore.projectList.length >= 20) {
        Toast('每个账号最多可以存在20个项目')
        return
      }
      this.setData({
        isEditName: true,
        homeInfoEdited: {
          projectId: '',
          projectName: '',
        },
      })
    },

    editName() {
      this.setData({
        isEditName: true,
        homeInfoEdited: {
          projectId: projectBinding.store.currentProjectDetail.projectId,
          projectName: projectBinding.store.currentProjectDetail.projectName,
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
        'homeInfoEdited.projectName': e.detail,
      })
    },
    /**
     * 确认项目信息
     */
    async confirmHomeInfo() {
      const { projectName } = this.data.homeInfoEdited

      if (checkInputNameIllegal(projectName)) {
        Toast('项目名称不能用特殊符号或表情')
        return
      }

      if (projectName.length > 15) {
        Toast('项目名称不能超过15个字符')

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
        Toast(this.data.homeInfoEdited.projectId ? '修改失败' : '新增失败')
        return
      }

      if (res.success) {
        Toast(this.data.homeInfoEdited.projectId ? '修改成功' : '新增成功')
      }

      projectBinding.store.updateProjectInfo()
    },

    async delHome() {
      const allDeviceList = deviceBinding.store.allDeviceList
      if (allDeviceList && allDeviceList.length > 0) {
        Toast('项目存在设备，不允许解散')
        return
      }

      const projectList = projectBinding.store.projectList.filter((item) => item.houseCreatorFlag)
      if (projectList.length <= 1) {
        Toast('请至少保留一个创建的项目')
        return
      }

      const res = await Dialog.confirm({
        title: '是否解散当前项目',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await delUserHouse(projectBinding.store.currentProjectDetail.projectId)

      Toast(delRes.success ? '解散成功' : '解散失败')

      projectBinding.store.updateProjectInfo()
    },

    async quitHome() {
      const res = await Dialog.confirm({
        title: '是否退出当前项目',
      }).catch(() => 'cancel')

      console.log('delHome', res)

      if (res === 'cancel') return

      const delRes = await quitUserHouse(projectBinding.store.currentProjectDetail.projectId)

      Toast(delRes.success ? '退出成功' : '退出失败')

      projectBinding.store.updateProjectInfo()
    },

    clickRoomItem(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.showRoomList[index]

      if (item.roomIcon === 'more') {
        wx.navigateTo({
          url: '/package-mine/space-manage/index',
        })
      } else {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-mine/space-detail/index', {
            spaceId: item.spaceId,
            spaceName: item.spaceName,
            roomIcon: item.roomIcon,
          }),
        })
      }
    },
  },
})
