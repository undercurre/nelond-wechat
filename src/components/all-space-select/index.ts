import { ComponentWithComputed } from 'miniprogram-computed'
import { spaceBinding, deviceBinding, spaceStore, sceneStore, deviceStore } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehavior from '../../behaviors/pageBehaviors'
import { PRO_TYPE } from '../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [spaceBinding, deviceBinding] }), pageBehavior],

  /**
   * 组件的属性列表
   */
  properties: {
    // 展示popup
    show: {
      type: Boolean,
      value: false,
    },
    cellStyle: {
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
     * 数据类型：device设备/scene场景/sensor传感器
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
    // 初始化自动选中首个空间
    init: {
      type: Boolean,
      value: true,
    },
    // 初始化自动选中首个空间时是否需要触发confirm方法
    initConfirm: {
      type: Boolean,
      value: true,
    },
    // 自动选中该空间
    targetSpaceId: {
      type: String,
      value: '',
      observer(value) {
        if (value) {
          const space = spaceStore.allSpaceList.find((s) => {
            return s.spaceId === value
          })
          if (space) {
            const spaceIds = [space.spaceId]
            let parentSpace = spaceStore.allSpaceList.find((s) => s.spaceId === space.pid)
            while (parentSpace) {
              spaceIds.unshift(parentSpace.spaceId)
              parentSpace = spaceStore.allSpaceList.find((s) => s.spaceId === parentSpace?.pid)
            }
            this.setData({
              firstSpaceId: spaceIds[0] || '',
              _firstSpaceId: spaceIds[0] || '',
              secondSpaceId: spaceIds[1] || '',
              _secondSpaceId: spaceIds[1] || '',
              thirdSpaceId: spaceIds[2] || '',
              _thirdSpaceId: spaceIds[2] || '',
              fourthSpaceId: spaceIds[3] || '',
              _fourthSpaceId: spaceIds[3] || '',
            })
          }
        }
      },
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
      const spaceIds = [data._firstSpaceId, data._secondSpaceId, data._thirdSpaceId, data._fourthSpaceId]
      const spaceNames = []
      let currentSpace = data.spaceData[data._firstSpaceId]
      if (currentSpace) {
        spaceNames.push(currentSpace.spaceName)
        for (let i = 1; i < spaceIds.length; i++) {
          const spaceId = spaceIds[i]
          if (spaceId) {
            const spaceChild = currentSpace.child[spaceId]
            if (spaceChild) {
              spaceNames.push(spaceChild.spaceName)
              currentSpace = spaceChild
            }
            if (i === 2 && data.showTab) {
              break
            }
          }
        }
        return spaceNames.join('，')
      } else {
        return ''
      }
    },
    isShowTab(data: IAnyObject) {
      if (!data.showTab) return false
      const { firstSpaceId, secondSpaceId, thirdSpaceId, spaceData } = data

      if (firstSpaceId && secondSpaceId && thirdSpaceId) {
        const child = spaceData[firstSpaceId]?.child[secondSpaceId]?.child[thirdSpaceId]?.child
        if (child) {
          return Object.keys(child).length
        }
      }
      return false
    },
    /**
     * 有下级空间而未选择时应该禁用确认
     */
    disableConfirm(data) {
      let count = 0
      const { firstSpaceId, secondSpaceId, thirdSpaceId, fourthSpaceId, spaceData } = data
      if (firstSpaceId) {
        const firstSpace = spaceData[firstSpaceId]
        if (firstSpace) count = Object.keys(firstSpace.child).length
        if (secondSpaceId && firstSpace) {
          const secondSpace = firstSpace.child[secondSpaceId]
          if (secondSpace) count = Object.keys(secondSpace.child).length
          if (thirdSpaceId && secondSpace) {
            const thirdSpace = secondSpace.child[thirdSpaceId]
            if (thirdSpace) count = Object.keys(thirdSpace.child).length
            if (fourthSpaceId && thirdSpace) {
              return false
            }
          }
        }
      }
      return count
    },
  },
  lifetimes: {
    attached() {},
    ready() {},
    detached() {},
  },
  watch: {
    allSpaceList: function () {
      this.initTree()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    initTree() {
      // await spaceBinding.store.updateAllSpaceList()
      const spaceList: Space.allSpace[] = []
      spaceStore.allSpaceList
        .sort((a, b) => b.spaceLevel - a.spaceLevel)
        .forEach((space) => {
          // 该空间存在场景
          const hasScene =
            sceneStore.allRoomSceneList.findIndex(
              (scene) => scene.spaceId === space.spaceId && scene.deviceActions?.length > 0,
            ) >= 0
          // 该空间存在设备
          const hasDevice = deviceStore.allDeviceList.findIndex((device) => device.spaceId === space.spaceId) >= 0
          // 该空间存在传感器
          const hasSensor =
            deviceStore.allDeviceList.findIndex(
              (device) => device.spaceId === space.spaceId && device.proType === PRO_TYPE.sensor,
            ) >= 0
          const notPublicSpace = space.publicSpaceFlag === 0
          const hasBrotherNode =
            spaceStore.allSpaceList.findIndex((s) => s.pid === space.pid && s.spaceId !== space.spaceId) >= 0
          // 下层空间是否存在非公共空间
          // const hasNotPublicSpaceChild =
          //   spaceStore.allSpaceList.findIndex((s) => s.pid === space.spaceId && s.publicSpaceFlag === 0) >= 0
          // 下层空间是否存在空间
          const hasChild = spaceList.findIndex((s) => s.pid === space.spaceId) >= 0
          if (this.data.dataType === 'scene') {
            if (this.data.filter) {
              if (hasScene || hasChild) spaceList.push(space)
            } else {
              if (notPublicSpace || (!notPublicSpace && hasBrotherNode)) spaceList.push(space)
            }
          } else if (this.data.dataType === 'device') {
            if (this.data.filter) {
              if (hasDevice || hasChild) spaceList.push(space)
            } else {
              if (notPublicSpace || (!notPublicSpace && hasBrotherNode)) spaceList.push(space)
            }
          } else if (this.data.dataType === 'sensor') {
            if (this.data.filter) {
              if (hasSensor || hasChild) spaceList.push(space)
            } else {
              if (notPublicSpace || (!notPublicSpace && hasBrotherNode)) spaceList.push(space)
            }
          } else {
            if (notPublicSpace || (!notPublicSpace && hasBrotherNode)) spaceList.push(space)
          }
        })

      const result = this.buildTree(spaceList, '0')
      this.setData({ spaceData: result }, () => {
        if (this.data.init && !this.data.targetSpaceId) {
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
          if (this.data.initConfirm) this.triggerEvent('confirm', this.calcConfirmRes())
        },
      )
    },
    getKey(obj: { [key: string]: Space.SpaceTreeNode }): string[] {
      const key = Object.keys(obj)[0]
      if (!key) return []
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
      const result = []
      const spaceIds = [
        this.data._firstSpaceId,
        this.data._secondSpaceId,
        this.data._thirdSpaceId,
        this.data._fourthSpaceId,
      ]

      for (let i = 0; i < spaceIds.length; i++) {
        const spaceId = spaceIds[i]
        if (!spaceId) {
          break
        }

        const space = spaceStore.allSpaceList.find((s) => s.spaceId === spaceId)
        result.push({ key: `space_${i + 1}`, ...space })

        if (i < 3 && !spaceIds[i + 1] && space?.spaceLevel !== 4) {
          const publicSpace = spaceStore.allSpaceList.find((s) => s.pid === spaceId && s.publicSpaceFlag === 1)
          if (publicSpace) {
            result.push({ key: `space_${i + 2}`, ...publicSpace })
          }
        }
      }

      return result
    },
  },
})
