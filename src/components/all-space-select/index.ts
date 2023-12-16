import { ComponentWithComputed } from 'miniprogram-computed'
import { spaceBinding, deviceBinding, spaceStore, sceneStore } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [spaceBinding, deviceBinding] }), pageBehavior],

  /**
   * 组件的属性列表
   */
  properties: {
    cellStyle: {
      type: String,
      value: '',
    },
    tabStyle: {
      type: String,
      value: '',
    },
    showTab: {
      type: Boolean,
      value: true,
    },
    /**
     * 数据类型：device设备/scene场景
     */
    dataType: {
      type: String,
      value: '',
    },

    filter: {
      type: Boolean,
      value: false,
    },
    initIndex: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false,
    spaceData: [] as Space.SpaceTreeNode[],
    firstIndex: -1,
    secondIndex: -1,
    thirdIndex: -1,
    fourthIndex: -1,
    _firstIndex: -1,
    _secondIndex: -1,
    _thirdIndex: -1,
    _fourthIndex: -1,
  },
  computed: {
    checkedSpaceName(data: IAnyObject) {
      let desc = ''
      if (data._firstIndex !== -1) {
        desc += data.spaceData[data._firstIndex].spaceName
        if (data._secondIndex !== -1) {
          desc += `，${data.spaceData[data._firstIndex].child[data._secondIndex].spaceName}`
          if (data._thirdIndex !== -1) {
            desc += `，${data.spaceData[data._firstIndex].child[data._secondIndex].child[data._thirdIndex].spaceName}`
          }
        }
      }
      return desc
    },
    isShowTab(data: IAnyObject) {
      if (!data.showTab) return false
      if (data.firstIndex !== -1 && data.secondIndex !== -1 && data.thirdIndex !== -1) {
        return data.spaceData[data.firstIndex].child[data.secondIndex].child[data.thirdIndex].child.length
      } else {
        return false
      }
    },
  },
  lifetimes: {
    attached() {},
    ready() {
      this.initTree()
    },
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async initTree() {
      await spaceBinding.store.updateAllSpaceList()
      let spaceList: Space.allSpace[] = spaceStore.allSpaceList
      if (this.data.dataType) {
        if (this.data.dataType === 'scene') {
          spaceList = spaceStore.allSpaceList.filter((space) => {
            const hasScene = sceneStore.allRoomSceneList.findIndex(
              (scene) => scene.spaceId === space.spaceId && scene.deviceActions?.length > 0,
            )
            const notPublicSpace = space.publicSpaceFlag === 0
            const hasBrotherNode =
              spaceStore.allSpaceList.findIndex((s) => s.pid === space.pid && s.spaceId !== space.spaceId) >= 0

            return this.data.filter
              ? hasScene
              : notPublicSpace || (!notPublicSpace && hasBrotherNode) || (!notPublicSpace && hasScene) //TODO:filter逻辑错误，未实现
          })
        }
      }

      const result = this.buildTree(spaceList, '0')
      this.setData({ spaceData: result }, () => {
        if (this.data.initIndex) {
          this.initDefaultIndex()
        }
      })
    },
    buildTree(data: Space.allSpace[], pid: string): Space.SpaceTreeNode[] {
      const result: Space.SpaceTreeNode[] = []
      for (const item of data) {
        if (item.pid === pid) {
          const child = this.buildTree(data, item.spaceId)
          if (child.length > 0) {
            result.push({ ...item, child })
          } else {
            result.push({ ...item, child: [] })
          }
        }
      }
      return result
    },
    initDefaultIndex() {
      const { spaceData } = this.data
      if (spaceData[0].child.length) {
        if (spaceData[0].child[0].child.length) {
          if (spaceData[0].child[0].child[0].child.length) {
            this.setData({
              firstIndex: 0,
              _firstIndex: 0,
              secondIndex: 0,
              _secondIndex: 0,
              thirdIndex: 0,
              _thirdIndex: 0,
              fourthIndex: 0,
              _fourthIndex: 0,
            })
          } else {
            this.setData({
              firstIndex: 0,
              _firstIndex: 0,
              secondIndex: 0,
              _secondIndex: 0,
              thirdIndex: 0,
              _thirdIndex: 0,
            })
          }
        } else {
          this.setData({
            firstIndex: 0,
            _firstIndex: 0,
            secondIndex: 0,
            _secondIndex: 0,
          })
        }
      } else {
        this.setData({
          firstIndex: 0,
          _firstIndex: 0,
        })
      }
    },
    showPopup() {
      this.setData({ show: true })
    },
    closePopup() {
      this.setData({ show: false })
    },
    firstCheck(e: { currentTarget: { dataset: { index: number } } }) {
      console.log(e)

      this.setData({
        firstIndex: e.currentTarget.dataset.index,
        secondIndex: -1,
        thirdIndex: -1,
        fourthIndex: -1,
      })
    },
    secondCheck(e: { currentTarget: { dataset: { index: number } } }) {
      this.setData({
        secondIndex: e.currentTarget.dataset.index,
        thirdIndex: -1,
        fourthIndex: -1,
      })
    },
    thirdCheck(e: { currentTarget: { dataset: { index: number } } }) {
      this.setData({
        thirdIndex: e.currentTarget.dataset.index,
        fourthIndex: -1,
      })
    },
    fourthCheck(e: { currentTarget: { dataset: { index: number } } }) {
      this.setData({
        fourthIndex: e.currentTarget.dataset.index,
      })
    },
    handleConfirm() {
      this.setData({
        _firstIndex: this.data.firstIndex,
        _secondIndex: this.data.secondIndex,
        _thirdIndex: this.data.thirdIndex,
        _fourthIndex: this.data.fourthIndex,
        show: false,
      })
    },
  },
})
