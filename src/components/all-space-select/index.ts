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
    init: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false,
    spaceData: {} as { [key: string]: Space.SpaceTreeNode },
    firstSpaceId: '',
    secondSpaceId: '',
    thirdSpaceId: '',
    fourthSpaceId: '',
    _firstSpaceId: '',
    _secondSpaceId: '',
    _thirdSpaceId: '',
    _fourthSpaceId: '',
  },
  computed: {
    checkedSpaceName(data: IAnyObject) {
      let desc = ''
      if (data._firstSpaceId) {
        desc += data.spaceData[data._firstSpaceId].spaceName
        if (data._secondSpaceId) {
          desc += `，${data.spaceData[data._firstSpaceId].child[data._secondSpaceId].spaceName}`
          if (data._thirdSpaceId) {
            desc += `，${
              data.spaceData[data._firstSpaceId].child[data._secondSpaceId].child[data._thirdSpaceId].spaceName
            }`
          }
        }
      }
      return desc
    },
    isShowTab(data: IAnyObject) {
      if (!data.showTab) return false
      if (data.firstSpaceId && data.secondSpaceId && data.thirdSpaceId) {
        return Object.keys(data.spaceData[data.firstSpaceId].child[data.secondSpaceId].child[data.thirdSpaceId].child)
          .length
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
        if (this.data.init) {
          this.initDefault()
        }
      })
    },

    buildTree(data: Space.allSpace[], pid: string): { [key: string]: Space.SpaceTreeNode } {
      const result: { [key: string]: Space.SpaceTreeNode } = {}
      for (const item of data) {
        if (item.pid === pid) {
          const child = this.buildTree(data, item.spaceId)
          if (child) {
            result[item.spaceId] = { ...item, child }
          } else {
            result[item.spaceId] = { ...item, child: {} }
          }
        }
      }
      return result
    },
    initDefault() {
      const [first = '', second = '', third = '', fourth = ''] = this.getKey(this.data.spaceData)
      this.setData(
        {
          firstSpaceId: first,
          secondSpaceId: second,
          thirdSpaceId: third,
          fourthSpaceId: fourth,
          _firstSpaceId: first,
          _secondSpaceId: second,
          _thirdSpaceId: third,
          _fourthSpaceId: fourth,
        },
        () => {
          this.triggerEvent('confirm', {
            firstSpaceId: this.data._firstSpaceId,
            secondSpaceId: this.data._secondSpaceId,
            thirdSpaceId: this.data._thirdSpaceId,
            fourthSpaceId: this.data._fourthSpaceId,
          })
        },
      )
    },
    getKey(obj: { [key: string]: Space.SpaceTreeNode }): string[] {
      const key = Object.keys(obj)[0]
      if (typeof obj[key].child === 'object' && JSON.stringify(obj[key].child) !== '{}') {
        return [key, ...this.getKey(obj[key].child)]
      } else {
        return [key]
      }
    },
    showPopup() {
      this.setData({ show: true })
    },
    closePopup() {
      this.setData({ show: false })
    },
    firstCheck(e: { currentTarget: { dataset: { id: string } } }) {
      console.log(e)

      this.setData({
        firstSpaceId: e.currentTarget.dataset.id,
        secondSpaceId: '',
        thirdSpaceId: '',
        fourthSpaceId: '',
      })
    },
    secondCheck(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        secondSpaceId: e.currentTarget.dataset.id,
        thirdSpaceId: '',
        fourthSpaceId: '',
      })
    },
    thirdCheck(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        thirdSpaceId: e.currentTarget.dataset.id,
        fourthSpaceId: '',
      })
    },
    fourthCheck(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        fourthSpaceId: e.currentTarget.dataset.id,
      })
    },
    handleConfirm() {
      this.setData(
        {
          _firstSpaceId: this.data.firstSpaceId,
          _secondSpaceId: this.data.secondSpaceId,
          _thirdSpaceId: this.data.thirdSpaceId,
          _fourthSpaceId: this.data.fourthSpaceId,
          show: false,
        },
        () => {
          this.triggerEvent('confirm', {
            firstSpaceId: this.data._firstSpaceId,
            secondSpaceId: this.data._secondSpaceId,
            thirdSpaceId: this.data._thirdSpaceId,
            fourthSpaceId: this.data._fourthSpaceId,
          })
        },
      )
    },
  },
})
