import { observable, runInAction } from 'mobx-miniprogram'
import {
  queryProjectList,
  queryProjectInfo,
  queryHouseUserList,
  updateHouseUserAuth,
  deleteHouseUser,
  inviteHouseUser,
  saveOrUpdateUserHouseInfo,
  querySpaceList,
  getShareId,
  queryAllDevice,
  // queryLocalKey,
} from '../apis/index'
import { asyncStorage, storage, IApiRequestOption } from '../utils/index'
import { deviceStore } from './device'
import { othersStore } from './others'
import { roomStore } from './room'
import { userStore } from './user'
import { userRole } from '../config/home'

export const homeStore = observable({
  key: '', // 局域网本地场景key

  projectList: [] as Project.IProjectItem[],

  /** 当前家庭详细信息 */
  currentProjectDetail: {} as Project.IProjectDetail,

  homeMemberInfo: {} as Project.HomeMemberInfo,

  shareId: '',

  currentProjectId: '',

  get currentProjectName() {
    if (this.currentProjectDetail?.projectName?.length > 6) {
      return this.currentProjectDetail.projectName.slice(0, 6) + '...'
    }
    return this.currentProjectDetail?.projectName ?? ''
  },

  // 是否创建者
  get isCreator() {
    if (this.currentProjectDetail) {
      return this.currentProjectDetail.houseUserAuth === userRole.creator
    }
    return false
  },

  // 是否管理员权限+
  get isManager() {
    return this.currentProjectDetail.houseUserAuth === 1 || this.currentProjectDetail.houseUserAuth === 2
  },

  setProjectId(id: string) {
    runInAction(() => {
      this.currentProjectId = id
    })

    // 保存到前端缓存
    storage.set('currentProjectId', id, null)
  },

  // actions
  /**
   * 首页加载逻辑
   */
  async homeInit() {
    const success = this.loadHomeDataFromStorage()
    if (success) {
      othersStore.setIsInit(true)
    } else {
      console.log('[KS]本地缓存不存在或过期, isInit:', othersStore.isInit)
    }
    const res = await this.updateProjectList()
    // 如果当前选中的项目ID未存在，则选择第一个 // TODO 即时项目ID已有值，也要与项目列表比较，是否真实存在
    if (res.success) {
      if (!this.currentProjectId) {
        this.setProjectId(this.projectList[0].projectId)
      }

      queryProjectInfo({ projectId: this.currentProjectId }).then((res) => {
        if (res.success) {
          runInAction(() => {
            homeStore.currentProjectDetail = Object.assign({ projectId: this.currentProjectId }, res.result)
          })
        }
      })
      // 全屋房间、设备加载
      await this.updateRoomCardList()
      othersStore.setIsInit(true)
      console.log('[KS]云端数据加载成功, isInit:', othersStore.isInit)
    }
  },

  /**
   * 更新家庭列表同时更新当前信息
   */
  async updateHomeInfo(options?: IApiRequestOption) {
    const res = await this.updateProjectList(options)

    if (res.success) {
      return await this.updateCurrentHomeDetail(options)
    } else {
      console.log('this.currentProjectId', this.currentProjectId, 'this.projectList', this.projectList)
      return Promise.reject('获取项目列表失败')
    }
  },

  /**
   * 更新项目列表
   */
  async updateProjectList(options?: IApiRequestOption) {
    const res = await queryProjectList(options)

    if (res.success) {
      runInAction(() => {
        homeStore.projectList = res.result.content
      })
    }

    return res
  },

  /**
   * 更新当前家庭详细信息
   */
  async updateCurrentHomeDetail(options?: IApiRequestOption) {
    const res = await queryProjectInfo(
      {
        projectId: this.currentProjectId,
      },
      options,
    )
    if (res.success) {
      runInAction(() => {
        homeStore.currentProjectDetail = Object.assign({ projectId: this.currentProjectId }, res.result)
      })
      // await deviceStore.updateAllRoomDeviceList(undefined, options) // 重复加载
      await roomStore.updateSpaceList(options)
      this.saveHomeDate()
      return
    } else {
      console.error('获取家庭信息失败', res)
      return Promise.reject('获取家庭信息失败')
    }
  },

  /**
   * 更新当前家庭房间卡片列表
   */
  async updateRoomCardList(options?: { loading: boolean }) {
    const { currentProjectId } = homeStore
    const data = await Promise.all([
      queryAllDevice(currentProjectId, '0', options),
      querySpaceList(currentProjectId, '0', options),
    ])
    if (data[0].success) {
      const list = {} as Record<string, Device.DeviceItem[]>
      data[0].result
        ?.sort((a, b) => a.deviceId.localeCompare(b.deviceId))
        .forEach((device) => {
          if (list[device.spaceId]) {
            list[device.spaceId].push(device)
          } else {
            list[device.spaceId] = [device]
          }
        })
      runInAction(() => {
        roomStore.roomDeviceList = list
        deviceStore.allRoomDeviceList = data[0].result
        // deviceStore.updateAllRoomDeviceListLanStatus(false)
      })
    }
    if (data[1].success) {
      runInAction(() => {
        roomStore.roomList = data[1].result
      })
    }
    this.saveHomeDate()
  },

  /**
   * 更新当前家庭名字/位置
   */
  async updateHomeNameOrLocation(name?: string, location?: string) {
    const params = {
      projectId: this.currentProjectId,
      projectName: name ?? this.currentProjectDetail.projectName,
      userLocationInfo: location ?? this.currentProjectDetail.houseArea,
    }
    const res = await saveOrUpdateUserHouseInfo(params, { loading: true })
    if (res.success) {
      return await this.updateHomeInfo()
    } else {
      return Promise.reject('更新当前家庭名字/位置失败')
    }
  },

  /**
   * 更新家庭成员列表
   */
  async updateHomeMemberList() {
    const res = await queryHouseUserList({ projectId: this.currentProjectId })
    if (res.success) {
      runInAction(() => {
        homeStore.homeMemberInfo = res.result
      })
      return
    } else {
      return Promise.reject('获取成员信息失败')
    }
  },

  /**
   * 更改家庭成员权限
   * 家庭成员权限，创建者：1 管理员：2 游客：3
   */
  async updateMemberAuth(userId: string, auth: Project.UserRole) {
    const res = await updateHouseUserAuth({ userId, auth, projectId: this.currentProjectId })
    if (res.success) {
      runInAction(() => {
        for (let i = 0; i < homeStore.homeMemberInfo.houseUserList.length; i++) {
          if (userId === homeStore.homeMemberInfo.houseUserList[i].userId) {
            if (homeStore.homeMemberInfo.houseUserList[i].userHouseAuth === 1) continue
            const map = ['', '创建者', '管理员', '访客']
            homeStore.homeMemberInfo.houseUserList[i].userHouseAuth = auth
            homeStore.homeMemberInfo.houseUserList[i].userHouseAuthName = map[auth]
          }
        }
      })
      return
    } else {
      return Promise.reject('设置权限失败')
    }
  },

  /**
   * 删除家庭成员
   */
  async deleteMember(userId: string) {
    const res = await deleteHouseUser({ projectId: this.currentProjectId, userId })
    if (res.success) {
      runInAction(() => {
        for (let i = 0; i < homeStore.homeMemberInfo.houseUserList.length; i++) {
          if (userId === homeStore.homeMemberInfo.houseUserList[i].userId) {
            homeStore.homeMemberInfo.houseUserList.splice(i, 1)
            break
          }
        }
      })
      return
    } else {
      return Promise.reject('删除家庭成员失败')
    }
  },

  /**
   * 邀请家庭成员
   */
  async inviteMember(projectId: string, auth: number, shareId: string) {
    const res = await inviteHouseUser({ projectId, auth, shareId })
    if (res.success) {
      return
    } else {
      return Promise.reject(res)
    }
  },

  /**
   * 获取分享连接ID
   */
  async getInviteShareId() {
    const res = await getShareId({ projectId: this.currentProjectId })
    if (res.success) {
      runInAction(() => {
        homeBinding.store.shareId = res.result.shareId
      })
      return
    } else {
      return Promise.reject('获取分享链接失败')
    }
  },

  /**
   * 缓存主要的初始数据
   */
  async saveHomeDate() {
    if (!userStore.isLogin) {
      return
    }
    const token = await asyncStorage.get<string>('token')
    const data = {
      token,
      homeData: {
        projectList: this.projectList,
        currentProjectDetail: this.currentProjectDetail,
        roomList: roomStore.roomList,
        allRoomDeviceList: deviceStore.allRoomDeviceList,
      },
    }
    await asyncStorage.set('homeData', data, 60 * 60 * 24) // 缓存有效期一天
  },

  async initLocalKey() {
    const key = storage.get('localKey') as string

    console.debug('key', key)

    if (key) {
      this.key = key
    } else {
      // await this.updateLocalKey()
    }
  },

  // async updateLocalKey() {
  //   const res = await queryLocalKey({ projectId: this.currentProjectId })

  //   if (res.success) {
  //     this.key = res.result
  //     // key的有效期是30天，设置缓存过期时间25天
  //     storage.set('localKey', this.key, Date.now() + 1000 * 60 * 60 * 24 * 25)
  //   }
  // },

  /**
   * 从缓存加载数据，如果成功加载返回true，否则false
   */
  loadHomeDataFromStorage() {
    const token = storage.get<string>('token')
    const currentProjectId = storage.get('currentProjectId') as string
    if (!token) {
      return false
    }
    if (currentProjectId) {
      this.setProjectId(currentProjectId)
    }
    const data = storage.get('homeData') as IAnyObject
    if (!data) {
      return false
    } else if (data.token != token) {
      storage.remove('homeData')
      return false
    }
    runInAction(() => {
      this.projectList = data.homeData.projectList
      this.currentProjectDetail = data.homeData.currentProjectDetail
      roomStore.roomList = data.homeData.roomList
      deviceStore.allRoomDeviceList = data.homeData.allRoomDeviceList
    })
    return true
  },
})

export const homeBinding = {
  store: homeStore,
  fields: ['projectList', 'currentProjectId', 'currentProjectDetail', 'isManager', 'currentProjectName'],
  actions: [
    'updateHomeInfo',
    'updateProjectList',
    'updateCurrentHomeDetail',
    'updateHomeMemberList',
    'updateMemberAuth',
    'deleteMember',
    'updateHomeNameOrLocation',
  ],
}
