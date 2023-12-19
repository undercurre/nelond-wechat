import { ComponentWithComputed } from 'miniprogram-computed'
import { spaceBinding, deviceBinding, spaceStore, sceneStore, deviceStore } from '../../store/index'
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
    show: {
      type: Boolean,
      value: false,
    },
    cellStyle: {
      type: String,
      value: '',
    },
    tabStyle: {
      type: String,
      value: '',
    },
    showCell: {
      type: Boolean,
      value: true,
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
    /**
     * 仅开启dataType有效
     * true 过滤包含非公共空间
     * false 仅过滤公共空间
     */
    filter: {
      type: Boolean,
      value: false,
    },
    //自动选中首个空间
    init: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
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
    /**
     * 有下级空间而未选择时应该禁用确认
     */
    disableConfirm(data) {
      if (data.firstSpaceId) {
        if (data.secondSpaceId) {
          if (data.thirdSpaceId) {
            if (data.fourthSpaceId) {
              return false
            } else {
              return Object.keys(
                data.spaceData[data.firstSpaceId].child[data.secondSpaceId].child[data.thirdSpaceId].child,
              ).length
            }
          } else {
            return Object.keys(data.spaceData[data.firstSpaceId].child[data.secondSpaceId].child).length
          }
        } else {
          return Object.keys(data.spaceData[data.firstSpaceId].child).length
        }
      } else {
        return true
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
      spaceList = spaceStore.allSpaceList.filter((space) => {
        const hasScene =
          sceneStore.allRoomSceneList.findIndex(
            (scene) => scene.spaceId === space.spaceId && scene.deviceActions?.length > 0,
          ) >= 0
        const hasDevice = deviceStore.allDeviceList.findIndex((device) => device.spaceId === space.spaceId) >= 0
        const notPublicSpace = space.publicSpaceFlag === 0
        const hasBrotherNode =
          spaceStore.allSpaceList.findIndex((s) => s.pid === space.pid && s.spaceId !== space.spaceId) >= 0
        const hasNotPublicSpaceChild =
          spaceStore.allSpaceList.findIndex((s) => s.pid === space.spaceId && s.publicSpaceFlag === 0) >= 0
        if (this.data.dataType === 'scene') {
          return this.data.filter
            ? hasScene || hasNotPublicSpaceChild
            : notPublicSpace || (!notPublicSpace && hasBrotherNode && hasScene)
        } else if (this.data.dataType === 'device') {
          return this.data.filter
            ? hasDevice || hasNotPublicSpaceChild
            : notPublicSpace || (!notPublicSpace && hasBrotherNode && hasDevice)
        } else {
          return notPublicSpace || (!notPublicSpace && hasBrotherNode && (hasScene || hasDevice))
        }
      })

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
          this.triggerEvent('confirm', this.calcConfirmRes())
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
    tabCheck(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData(
        {
          fourthSpaceId: e.currentTarget.dataset.id,
        },
        () => {
          this.handleConfirm()
        },
      )
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
          this.triggerEvent('confirm', this.calcConfirmRes())
        },
      )
    },
    calcConfirmRes() {
      // 选中spaceLevel不为4时，目标挂载空间应该为该空间下的公共空间
      const result = []
      const { _firstSpaceId, _secondSpaceId, _thirdSpaceId, _fourthSpaceId } = this.data
      if (_firstSpaceId) {
        const firstSpace = spaceStore.allSpaceList.find((space) => space.spaceId === this.data._firstSpaceId)
        result.push({ key: 'firstSpaceId', ...firstSpace })
        if (_secondSpaceId) {
          const secondSpace = spaceStore.allSpaceList.find((space) => space.spaceId === this.data._secondSpaceId)
          result.push({ key: 'secondSpaceId', ...secondSpace })
          if (_thirdSpaceId) {
            const thirdSpace = spaceStore.allSpaceList.find((space) => space.spaceId === this.data._thirdSpaceId)
            result.push({ key: 'thirdSpaceId', ...thirdSpace })
            if (_fourthSpaceId) {
              const fourthSpace = spaceStore.allSpaceList.find((space) => space.spaceId === this.data._fourthSpaceId)
              result.push({ key: 'fourthSpaceId', ...fourthSpace })
            } else if (!_fourthSpaceId && thirdSpace?.spaceLevel !== 4) {
              const v_fourthSpace = spaceStore.allSpaceList.find(
                (space) => space.pid === this.data._thirdSpaceId && space.publicSpaceFlag === 1,
              )
              if (v_fourthSpace) result.push({ key: 'fourthSpaceId', ...v_fourthSpace })
            }
          } else if (!_thirdSpaceId && secondSpace?.spaceLevel !== 4) {
            const v_thirdSpace = spaceStore.allSpaceList.find(
              (space) => space.pid === this.data._secondSpaceId && space.publicSpaceFlag === 1,
            )
            if (v_thirdSpace) result.push({ key: 'thirdSpaceId', ...v_thirdSpace })
          }
        } else if (!_secondSpaceId && firstSpace?.spaceLevel !== 4) {
          const v_secondSpace = spaceStore.allSpaceList.find(
            (space) => space.pid === this.data._firstSpaceId && space.publicSpaceFlag === 1,
          )
          if (v_secondSpace) result.push({ key: 'thirdSpaceId', ...v_secondSpace })
        }
      }
      return result
    },
  },
})
