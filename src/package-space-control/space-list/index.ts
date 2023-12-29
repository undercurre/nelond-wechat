import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { othersBinding, spaceBinding, userBinding, spaceStore, projectStore, projectBinding } from '../../store/index'
import { storage, strUtil, throttle } from '../../utils/index'
import { ROOM_CARD_H, SpaceConfig, SpaceLevel, defaultImgDir } from '../../config/index'
import { updateRoomSort, querySpaceList } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'

type PosType = Record<'index' | 'y', number>

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [
    BehaviorWithStore({ storeBindings: [othersBinding, spaceBinding, userBinding, projectBinding] }),
    pageBehavior,
  ],
  data: {
    title: '',
    subTitle: '',
    subSpaceList: [] as Space.SpaceInfo[],
    pid: '0',
    plevel: SpaceLevel.undef, // 父层级
    pname: '',
    defaultImgDir,
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    // 状态栏高度
    statusBarHeight: storage.get<number>('statusBarHeight') + 'px',
    // 可滚动区域高度
    scrollViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      90 - // 开关、添加按钮
      (storage.get<number>('navigationBarHeight') as number),
    _system: storage.get('system') as string,
    loading: true,
    isMoving: false,
    cardPos: {} as Record<string, PosType>,
    accumulatedY: 0, // 可移动区域高度
    placeholder: {
      y: 0,
      index: -1,
    } as PosType,
    scrollTop: 0,
    _scrolledWhenMoving: false, // 拖拽时，被动发生了滚动
    _lastClientY: 0, // 上次触控采样时 的Y坐标
    _isFirstShow: true, // 是否首次加载
    _from: '', // 页面进入来源
  },
  computed: {
    movableHeight(data) {
      return data.subSpaceList.length * ROOM_CARD_H
    },
  },
  watch: {
    subSpaceList() {
      this.renewPos()
    },
  },
  methods: {
    // 生命周期或者其他钩子
    async onLoad(query: { pid: string; pname: string; plevel: Space.SpaceLevel }) {
      if (query.pname && query.plevel) {
        this.setData({
          title: query.pname,
          subTitle: SpaceConfig[query.plevel].name,
        })
        this.data.pid = query.pid
        this.data.plevel = query.plevel
        this.data.pname = query.pname
      }
      // 加载本空间列表。只要有兄弟节点就显示公共空间
      const res = await querySpaceList(projectStore.currentProjectId, query.pid)
      if (res.success) {
        const hasSibling = res.result?.length > 1
        this.setData({
          subSpaceList: res.result.filter((space) => space.publicSpaceFlag !== 1 || hasSibling),
        })
      }
    },

    goToSpaceManage() {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-mine/space-manage/index', {
          pid: this.data.pid,
          pname: this.data.pname,
          plevel: this.data.plevel,
        }),
      })
    },

    /**
     * 根据index计算坐标位置
     * @returns {x, y}
     */
    getPos(index: number): number {
      return index * ROOM_CARD_H
    },

    /**
     * 根据坐标位置计算index
     * @returns index
     */
    getIndex(y: number) {
      const maxIndex = this.data.subSpaceList.length - 1 // 防止越界
      return Math.max(0, Math.min(maxIndex, Math.floor((y + ROOM_CARD_H / 2) / ROOM_CARD_H)))
    },

    /**
     * @description 生成空间位置
     * @param isMoving 是否正在拖动
     */
    renewPos() {
      // const currentIndex = this.data.placeholder.index
      const cardPos = {} as Record<string, PosType>
      this.data.subSpaceList
        .sort((a, b) => this.data.cardPos[a.spaceId]?.index - this.data.cardPos[b.spaceId]?.index)
        .forEach((space, index) => {
          cardPos[space.spaceId] = {
            index,
            // 正在拖的卡片，不改变位置
            y: index * ROOM_CARD_H,
          }
        })

      this.setData({
        cardPos,
      })
    },

    // 开始拖拽
    movableLongpress(e: WechatMiniprogram.TouchEvent) {
      wx.vibrateShort({ type: 'heavy' })

      const rid = e.currentTarget.dataset.rid
      const index = this.data.cardPos[rid].index

      const diffData = {} as IAnyObject
      diffData.isMoving = true
      diffData.placeholder = {
        index,
        y: this.getPos(index),
      }

      console.log('[movableTouchStart] diffData: ', diffData)

      this.setData(diffData)

      // 执行一次，防止出现空白位置
      this.movableChangeThrottle(e)
    },

    /**
     * 拖拽时触发的卡片移动效果
     */
    movableChangeThrottle: throttle(function (this: IAnyObject, e: WechatMiniprogram.TouchEvent) {
      const TOP_HEIGHT = 170
      const posY = (e.detail.y || e.touches[0]?.clientY) - TOP_HEIGHT + this.data.scrollTop
      const targetOrder = this.getIndex(posY)
      if (this.data.placeholder.index === targetOrder) {
        return
      }

      const oldOrder = this.data.placeholder.index
      // 节流操作，可能导致movableTouchEnd后仍有movableChange需要执行，丢弃掉
      if (oldOrder < 0) {
        return
      }
      console.log('[movableChange] %d --> %d, posY: %s', oldOrder, targetOrder, posY, e)

      // 更新placeholder的位置
      const isForward = oldOrder < targetOrder
      const diffData = {} as IAnyObject
      diffData[`placeholder.index`] = targetOrder
      diffData[`placeholder.y`] = this.getPos(targetOrder)

      // 更新联动卡片的位置
      let moveCount = 0
      for (const space of this.data.subSpaceList) {
        const _orderNum = this.data.cardPos[space.spaceId].index
        if (
          (isForward && _orderNum > oldOrder && _orderNum <= targetOrder) ||
          (!isForward && _orderNum >= targetOrder && _orderNum < oldOrder)
        ) {
          ++moveCount
          const dOrderNum = isForward ? _orderNum - 1 : _orderNum + 1
          diffData[`cardPos.${space.spaceId}.y`] = this.getPos(dOrderNum)
          diffData[`cardPos.${space.spaceId}.index`] = dOrderNum

          // 减少遍历消耗
          if (moveCount >= Math.abs(targetOrder - oldOrder)) {
            break
          }
        }
      }

      // 直接更新被拖拽卡片位置
      if (this.data._scrolledWhenMoving || this.data._system.indexOf('iOS') > -1) {
        const rid = e.currentTarget.dataset.rid
        diffData[`cardPos.${rid}.y`] = this.getPos(targetOrder)
      }

      // 更新被拖拽卡片的排序num
      diffData[`cardPos.${e.currentTarget.dataset.rid}.index`] = targetOrder

      console.log('[movableChange] diffData:', diffData)
      this.setData(diffData)
    }, 50),

    movableTouchMove(e: WechatMiniprogram.TouchEvent) {
      this.movableChangeThrottle(e)
    },

    movableTouchEnd(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isMoving) {
        return
      }
      const dpos = this.data.placeholder.y

      const diffData = {} as IAnyObject
      diffData.isMoving = false

      // 修正卡片位置
      diffData[`cardPos.${e.currentTarget.dataset.rid}.y`] = dpos
      diffData[`placeholder.index`] = -1
      this.setData(diffData)
      console.log('movableTouchEnd:', diffData)

      this.data._scrolledWhenMoving = false

      this.handleSortSaving()
    },

    // 页面滚动
    onPageScroll(e: { detail: { scrollTop: number } }) {
      if (this.data.isMoving || !e?.detail) {
        this.data._scrolledWhenMoving = true
        console.log('scrolled when moving', e)
        return
      }

      const { scrollTop } = e.detail
      console.log('onPageScroll scrollTop: %s, _lastClientY: %s', scrollTop, this.data._lastClientY)
      this.data.scrollTop = scrollTop
    },

    handleSortSaving() {
      const roomSortList = [] as Space.RoomSort[]
      Object.keys(this.data.cardPos).forEach((spaceId) => {
        roomSortList.push({
          spaceId,
          sort: this.data.cardPos[spaceId].index + 1,
        })
      })

      // 更新云端排序
      updateRoomSort(roomSortList)

      // 更新store排序
      const list = [] as Space.SpaceInfo[]
      this.data.subSpaceList.forEach((space) => {
        const { index } = this.data.cardPos[space.spaceId]
        list[index] = space
      })
      this.setData({
        subSpaceList: list,
      })
    },

    // 点击卡片
    handleCardTap(e: { detail: Space.SpaceInfo }) {
      const { spaceId, nodeCount, spaceName, spaceLevel, publicSpaceFlag } = e.detail

      // 只少于等于一个子空间，则进入设备列表页；否则进入下级空间列表页
      const link = nodeCount < 2 ? '/package-space-control/index/index' : '/package-space-control/space-list/index'
      const childPublicSpace = spaceStore.allSpaceList.find((s) => s.pid === spaceId && s.publicSpaceFlag === 1)

      // 更新当前选中空间
      const hasOnlyChildren = nodeCount === 1 // 有且仅有1个下级空间，即为公共空间
      runInAction(() => {
        spaceStore.currentSpaceSelect.push({
          ...e.detail,
          pid: this.data.pid,
        })
        // 如果只有一个子空间，则同时push公共空间
        if (hasOnlyChildren) {
          spaceStore.currentSpaceSelect.push(childPublicSpace!)
        }
      })

      wx.navigateTo({
        url: strUtil.getUrlWithParams(link, {
          pid: spaceId,
          pname: publicSpaceFlag === 1 ? this.data.pname : spaceName,
          plevel: spaceLevel,
        }),
      })
    },

    goBackAndPop() {
      runInAction(() => spaceStore.currentSpaceSelect.pop())
      wx.navigateBack()
    },
  },
})
