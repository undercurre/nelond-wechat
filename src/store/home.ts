import { observable, runInAction } from 'mobx-miniprogram'
import {
  getHomeList,
  queryUserHouseInfo,
  queryHouseUserList,
  updateHouseUserAuth,
  deleteHouseUser,
  inviteHouseUser,
  saveOrUpdateUserHouseInfo,
  queryRoomList,
  updateDefaultHouse,
  getShareId,
  queryAllDevice,
  queryLocalKey,
} from '../apis/index'
import { PRO_TYPE } from '../config/index'
import { asyncStorage, storage, Logger, IApiRequestOption } from '../utils/index'
import { deviceStore } from './device'
import { othersStore } from './others'
import { roomStore } from './room'
import { userStore } from './user'
import { deviceCount } from '../utils/index'
import { userRole } from '../config/home'

export const homeStore = observable({
  key: '', // 局域网本地场景key

  homeList: [] as Home.IHomeItem[],

  /** 当前家庭详细信息 */
  currentHomeDetail: {} as Home.IHomeDetail,

  homeMemberInfo: {} as Home.HomeMemberInfo,

  shareId: '',

  get currentHomeId() {
    let houseId = this.homeList.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''

    if (!houseId && this.homeList.length) {
      houseId = this.homeList[0].houseId
    }

    return houseId
  },

  // 是否创建者
  get isCreator() {
    if (this.currentHomeDetail) {
      return this.currentHomeDetail.houseUserAuth === userRole.creator
    }
    return false
  },

  // 是否管理员权限+
  get isManager() {
    return this.currentHomeDetail.houseUserAuth === 1 || this.currentHomeDetail.houseUserAuth === 2
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
    const res = await this.updateHomeList()
    if (res.success) {
      queryUserHouseInfo({ houseId: this.currentHomeId }).then((res) => {
        if (res.success) {
          runInAction(() => {
            homeStore.currentHomeDetail = Object.assign({ houseId: this.currentHomeId }, res.result)
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
    const res = await this.updateHomeList(options)

    if (res.success) {
      return await this.updateCurrentHomeDetail(options)
    } else {
      console.log('this.currentHomeId', this.currentHomeId, 'this.homeList', this.homeList)
      return Promise.reject('获取列表家庭失败')
    }
  },

  /**
   * 更新家庭列表数据
   */
  async updateHomeList(options?: IApiRequestOption) {
    const res = await getHomeList(options)

    if (res.success) {
      runInAction(() => {
        homeStore.homeList = res.result

        const houseId = homeStore.homeList.find((item: Home.IHomeItem) => item.defaultHouseFlag)?.houseId || ''
        // 首次进入或删除了默认家庭时，默认选中第0个
        if (!houseId && homeStore.homeList.length) {
          Logger.error('默认家庭为空，设置默认家庭')
          updateDefaultHouse(homeStore.homeList[0].houseId)
          homeStore.homeList[0].defaultHouseFlag = true
        }
      })
    }

    return res
  },

  /**
   * 更新当前家庭详细信息
   */
  async updateCurrentHomeDetail(options?: IApiRequestOption) {
    const res = await queryUserHouseInfo(
      {
        houseId: this.currentHomeId,
      },
      options,
    )
    if (res.success) {
      runInAction(() => {
        homeStore.currentHomeDetail = Object.assign({ houseId: this.currentHomeId }, res.result)
      })
      // await deviceStore.updateAllRoomDeviceList(undefined, options) // 重复加载
      await roomStore.updateRoomList(options)
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
    const homeId = homeStore.currentHomeId
    const data = await Promise.all([queryAllDevice(homeId, options), queryRoomList(homeId, options)])
    if (data[0].success) {
      const list = {} as Record<string, Device.DeviceItem[]>
      data[0].result
        ?.sort((a, b) => a.deviceId.localeCompare(b.deviceId))
        .forEach((device) => {
          if (list[device.roomId]) {
            list[device.roomId].push(device)
          } else {
            list[device.roomId] = [device]
          }
        })
      runInAction(() => {
        roomStore.roomDeviceList = list
        deviceStore.allRoomDeviceList = data[0].result
        deviceStore.updateAllRoomDeviceListLanStatus(false)
      })
    }
    if (data[1].success) {
      data[1].result.roomInfoList.forEach((room) => {
        const roomDeviceList = roomStore.roomDeviceList[room.roomInfo.roomId]
        // 过滤一下默认场景，没灯过滤明亮柔和，没灯没开关全部过滤
        const hasSwitch = roomDeviceList?.some((device) => device.proType === PRO_TYPE.switch) ?? false
        const hasLight = roomDeviceList?.some((device) => device.proType === PRO_TYPE.light) ?? false
        if (!hasSwitch && !hasLight) {
          // 四个默认场景都去掉
          room.roomSceneList = room.roomSceneList.filter((scene) => scene.isDefault === '0')
        } else if (hasSwitch && !hasLight) {
          // 只有开关，去掉默认的明亮、柔和
          room.roomSceneList = room.roomSceneList.filter((scene) => !['2', '3'].includes(scene.defaultType))
        }

        const { lightOnCount, endCount, lightCount } = deviceCount(roomDeviceList)
        room.roomInfo.lightOnCount = lightOnCount
        room.roomInfo.endCount = endCount
        room.roomInfo.lightCount = lightCount
      })
      runInAction(() => {
        roomStore.roomList = data[1].result.roomInfoList.map((room) => ({
          roomId: room.roomInfo.roomId,
          groupId: room.roomInfo.groupId,
          roomIcon: room.roomInfo.roomIcon || 'drawing-room',
          roomName: room.roomInfo.roomName,
          lightOnCount: room.roomInfo.lightOnCount,
          sceneList: room.roomSceneList,
          deviceNum: room.roomInfo.deviceNum,
          endCount: room.roomInfo.endCount,
          lightCount: room.roomInfo.lightCount,
        }))
      })
    }
    this.saveHomeDate()
  },

  /**
   * 更新当前家庭名字/位置
   */
  async updateHomeNameOrLocation(name?: string, location?: string) {
    const params = {
      houseId: this.currentHomeId,
      houseName: name ?? this.currentHomeDetail.houseName,
      userLocationInfo: location ?? this.currentHomeDetail.houseArea,
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
    const res = await queryHouseUserList({ houseId: this.currentHomeId })
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
  async updateMemberAuth(userId: string, auth: Home.UserRole) {
    const res = await updateHouseUserAuth({ userId, auth, houseId: this.currentHomeId })
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
    const res = await deleteHouseUser({ houseId: this.currentHomeId, userId })
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
  async inviteMember(houseId: string, auth: number, shareId: string) {
    const res = await inviteHouseUser({ houseId, auth, shareId })
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
    const res = await getShareId({ houseId: this.currentHomeId })
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
        homeList: this.homeList,
        currentHomeDetail: this.currentHomeDetail,
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
      await this.updateLocalKey()
    }
  },

  async updateLocalKey() {
    const res = await queryLocalKey({ houseId: this.currentHomeId })

    if (res.success) {
      this.key = res.result
      // key的有效期是30天，设置缓存过期时间25天
      storage.set('localKey', this.key, Date.now() + 1000 * 60 * 60 * 24 * 25)
    }
  },

  /**
   * 从缓存加载数据，如果成功加载返回true，否则false
   */
  loadHomeDataFromStorage() {
    const token = storage.get<string>('token')
    if (!token) {
      return false
    }
    const data = storage.get('homeData') as IAnyObject
    if (!data) {
      return false
    } else if (data.token != token) {
      storage.remove('homeData')
      return false
    }
    runInAction(() => {
      this.homeList = data.homeData.homeList
      this.currentHomeDetail = data.homeData.currentHomeDetail
      roomStore.roomList = data.homeData.roomList
      deviceStore.allRoomDeviceList = data.homeData.allRoomDeviceList
    })
    return true
  },
})

export const homeBinding = {
  store: homeStore,
  fields: ['homeList', 'currentHomeId', 'currentHomeDetail', 'isManager'],
  actions: [
    'updateHomeInfo',
    'updateHomeList',
    'updateCurrentHomeDetail',
    'updateHomeMemberList',
    'updateMemberAuth',
    'deleteMember',
    'updateHomeNameOrLocation',
  ],
}
