import { observable, runInAction } from 'mobx-miniprogram'
import {
  queryProjectList,
  queryProjectInfo,
  queryHouseUserList,
  saveOrUpdateUserHouseInfo,
  querySpaceList,
  queryAllDevice,
  // queryLocalKey,
} from '../apis/index'
import { asyncStorage, storage, IApiRequestOption } from '../utils/index'
import { deviceStore } from './device'
import { othersStore } from './others'
import { spaceStore } from './space'
import { userStore } from './user'

export const projectStore = observable({
  key: '', // 局域网本地场景key

  projectList: [] as Project.IProjectItem[],

  /** 当前项目详细信息 */
  currentProjectDetail: {} as Project.IProjectDetail,

  userList: {} as Project.UserItem[],

  shareId: '',

  currentProjectId: '',

  get currentProjectName() {
    if (this.currentProjectDetail?.projectName?.length > 6) {
      return this.currentProjectDetail.projectName.slice(0, 6) + '...'
    }
    return this.currentProjectDetail?.projectName ?? ''
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
  async spaceInit() {
    const success = this.loadSpaceDataFromStorage()
    if (success) {
      othersStore.setIsInit(true)
    } else {
      console.log('[KS]本地缓存不存在或过期, isInit:', othersStore.isInit)
    }
    const res = await this.updateProjectList()
    // 如果当前选中的项目ID未存在，则选择第一个 // TODO 即时项目ID已有值，也要与项目列表比较，是否真实存在
    if (res.success) {
      // 如果项目列表为空
      if (!res.result?.content?.length) {
        this.setProjectId('0')
        othersStore.setIsInit(true)
        console.log('[KS]项目列表为空')
        return
      }
      const pIndex = res.result.content.findIndex((p) => p.projectId === this.currentProjectId)

      // 如果未指定项目ID，或者项目ID已被删除
      if (!this.currentProjectId || pIndex < 0) {
        this.setProjectId(this.projectList[0].projectId)
      }

      queryProjectInfo({ projectId: this.currentProjectId }).then((res) => {
        if (res.success) {
          runInAction(() => {
            projectStore.currentProjectDetail = Object.assign({ projectId: this.currentProjectId }, res.result)
          })
        }
      })
      // 全屋空间、设备加载
      await Promise.all([this.updateSpaceCardList(), spaceStore.updateAllSpaceList()])
      othersStore.setIsInit(true)
      console.log('[KS]云端数据加载成功, isInit:', othersStore.isInit)
    }
  },

  /**
   * 更新项目列表同时更新当前信息
   */
  async updateProjectInfo(options?: IApiRequestOption) {
    const res = await this.updateProjectList(options)

    if (res.success) {
      return await this.updateCurrentProjectDetail(options)
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
        projectStore.projectList = res.result.content
      })
    }

    return res
  },

  /**
   * 更新当前项目详细信息
   */
  async updateCurrentProjectDetail(options?: IApiRequestOption) {
    const res = await queryProjectInfo(
      {
        projectId: this.currentProjectId,
      },
      options,
    )
    if (res.success) {
      runInAction(() => {
        projectStore.currentProjectDetail = Object.assign({ projectId: this.currentProjectId }, res.result)
      })
      // await deviceStore.updateallDeviceList(undefined, options) // 重复加载
      await spaceStore.updateSpaceList(options)
      this.saveProjectDate()
      return
    } else {
      console.error('获取项目信息失败', res)
      return Promise.reject('获取项目信息失败')
    }
  },

  /**
   * 更新当前项目空间卡片列表
   */
  async updateSpaceCardList(options?: { loading: boolean }) {
    const { currentProjectId } = projectStore
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
        spaceStore.spaceDeviceList = list
        deviceStore.allDeviceList = data[0].result
        // deviceStore.updateallDeviceListLanStatus(false)
      })
    }
    if (data[1].success) {
      runInAction(() => {
        spaceStore.spaceList = data[1].result.map((s) => ({
          ...s,
          pid: '0',
        }))
      })
    }
    this.saveProjectDate()
  },

  /**
   * 更新当前项目名字/位置
   */
  async updateHomeNameOrLocation(name?: string, location?: string) {
    const params = {
      projectId: this.currentProjectId,
      projectName: name ?? this.currentProjectDetail.projectName,
      userLocationInfo: location ?? this.currentProjectDetail.houseArea,
    }
    const res = await saveOrUpdateUserHouseInfo(params, { loading: true })
    if (res.success) {
      return await this.updateProjectInfo()
    } else {
      return Promise.reject('更新当前项目名字/位置失败')
    }
  },

  /**
   * 更新项目成员列表
   */
  async updateHomeMemberList() {
    const res = await queryHouseUserList({ projectId: this.currentProjectId })
    if (res.success) {
      runInAction(() => {
        projectStore.userList = res.result
      })
      return
    } else {
      return Promise.reject('获取成员信息失败')
    }
  },

  /**
   * 缓存主要的初始数据
   */
  async saveProjectDate() {
    if (!userStore.isLogin) {
      return
    }
    const token = await asyncStorage.get<string>('token')
    const data = {
      token,
      homeData: {
        projectList: this.projectList,
        currentProjectDetail: this.currentProjectDetail,
        spaceList: spaceStore.spaceList,
        allDeviceList: deviceStore.allDeviceList,
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
  loadSpaceDataFromStorage() {
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
      spaceStore.spaceList = data.homeData.spaceList
      deviceStore.allDeviceList = data.homeData.allDeviceList
    })
    return true
  },
})

export const projectBinding = {
  store: projectStore,
  fields: ['projectList', 'currentProjectId', 'currentProjectDetail', 'isManager', 'currentProjectName'],
  actions: [
    'updateProjectInfo',
    'updateProjectList',
    'updateCurrentProjectDetail',
    'updateHomeMemberList',
    'updateHomeNameOrLocation',
  ],
}
