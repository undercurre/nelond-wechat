import { ComponentWithComputed } from 'miniprogram-computed'
import { spaceBinding, deviceBinding, spaceStore, sceneStore, deviceStore } from '../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehavior from '../../behaviors/pageBehaviors'
import { PRO_TYPE, SCREEN_PID } from '../../config/index'
import Toast from '@vant/weapp/toast/toast'
import { isEmptyObject } from '../../utils/is'

ComponentWithComputed({
  // options: {
  //   pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  // },

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
     * 数据类型：device存在任意可控设备/scene场景/sensor传感器/switch开关和智慧屏/light灯光/gateway网关
     */
    dataTypeList: {
      type: Array,
      value: [],
      observer() {
        this.initTree()
      },
    },
    /**
     * 仅开启dataType有效
     * true 过滤包含非公共空间
     * false 仅过滤公共空间
     * 因为目前需求为展示所有公共空间，则无需用filter该属性，默认为true即可
     */
    filter: {
      type: Boolean,
      value: true,
      observer() {
        this.initTree()
      },
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
        this.initTargetSpace(value)
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    spaceData: {} as { [key: string]: Space.SpaceTreeNode },
    _filterSpaceList: [] as Space.allSpace[], //过滤后的全屋空间平铺列表
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
      console.log('[computed]data.spaceData', data.spaceData)
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
        const lastName = spaceNames[spaceNames.length - 1]
        const lastName2 = spaceNames[spaceNames.length - 2]
        if (lastName === '公区' || lastName === '公共区域') {
          // FIXME 使用更可靠的方法
          return `${lastName2}-${lastName}`
        } else {
          return lastName
        }
      } else {
        return ''
      }
    },
    isShowTab(data: IAnyObject) {
      if (!data.showTab) return false
      const { _firstSpaceId, _secondSpaceId, _thirdSpaceId, spaceData } = data

      if (_firstSpaceId && _secondSpaceId && _thirdSpaceId) {
        const child = spaceData[_firstSpaceId]?.child[_secondSpaceId]?.child[_thirdSpaceId]?.child
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
          const notPublicSpace = space.publicSpaceFlag === 0
          // const hasBrotherNode =
          //   spaceStore.allSpaceList.findIndex((s) => s.pid === space.pid && s.spaceId !== space.spaceId) >= 0
          // 所有公共空间都展示
          const hasBrotherNode = true
          // 下层空间是否存在非公共空间
          // const hasNotPublicSpaceChild =
          //   spaceStore.allSpaceList.findIndex((s) => s.pid === space.spaceId && s.publicSpaceFlag === 0) >= 0
          // 下层空间是否存在空间
          const hasChild = spaceList.findIndex((s) => s.pid === space.spaceId) >= 0

          if (this.data.dataTypeList.length === 0) {
            //hasBrotherNode始终为true，所以所有空间都展示，如果有filter的需求要改一下
            if (notPublicSpace || (!notPublicSpace && hasBrotherNode)) spaceList.push(space)
          } else {
            if (this.data.dataTypeList.includes('scene')) {
              // 该空间存在场景
              const hasScene =
                sceneStore.allRoomSceneList.findIndex(
                  (scene) => scene.spaceId === space.spaceId && scene.deviceActions?.length > 0,
                ) >= 0

              if (this.data.filter) {
                // 只有有场景或者有子空间的空间会展示
                if (hasScene || hasChild) spaceList.push(space)
              } else {
                // 非公共空间或者公共空间里有场景或公共空间有兄弟节点时会展示
                if (notPublicSpace || (!notPublicSpace && hasBrotherNode && hasScene)) spaceList.push(space)
              }
            }
            if (this.data.dataTypeList.includes('device')) {
              // 该空间存在可控设备
              const hasDevice =
                deviceStore.allDeviceList.findIndex(
                  (device) => device.spaceId === space.spaceId && device.proType !== PRO_TYPE.gateway,
                ) >= 0
              if (this.data.filter) {
                if (hasDevice || hasChild) spaceList.push(space)
              } else {
                if (notPublicSpace || (!notPublicSpace && hasBrotherNode && hasDevice)) spaceList.push(space)
              }
            }
            if (this.data.dataTypeList.includes('sensor')) {
              // 该空间存在传感器
              const hasSensor =
                deviceStore.allDeviceList.findIndex(
                  (device) => device.spaceId === space.spaceId && device.proType === PRO_TYPE.sensor,
                ) >= 0
              if (this.data.filter) {
                if (hasSensor || hasChild) spaceList.push(space)
              } else {
                if (notPublicSpace || (!notPublicSpace && hasBrotherNode && hasSensor)) spaceList.push(space)
              }
            }
            if (this.data.dataTypeList.includes('light')) {
              // 该空间存在灯具
              const hasLight =
                deviceStore.allDeviceList.findIndex(
                  (device) => device.spaceId === space.spaceId && device.proType === PRO_TYPE.light,
                ) >= 0
              if (this.data.filter) {
                if (hasLight || hasChild) spaceList.push(space)
              } else {
                if (notPublicSpace || (!notPublicSpace && hasBrotherNode && hasLight)) spaceList.push(space)
              }
            }
            if (this.data.dataTypeList.includes('switch')) {
              // 该空间存在开关包括智慧屏开关
              const hasSwitch =
                deviceStore.allDeviceList.findIndex(
                  (device) =>
                    device.spaceId === space.spaceId &&
                    (device.proType === PRO_TYPE.switch || SCREEN_PID.includes(device.productId)),
                ) >= 0
              if (this.data.filter) {
                if (hasSwitch || hasChild) spaceList.push(space)
              } else {
                if (notPublicSpace || (!notPublicSpace && hasBrotherNode && hasSwitch)) spaceList.push(space)
              }
            }
            if (this.data.dataTypeList.includes('gateway')) {
              // 该空间存在网关
              const hasGateway =
                deviceStore.allDeviceList.findIndex(
                  (device) => device.spaceId === space.spaceId && device.proType === PRO_TYPE.gateway,
                ) >= 0
              if (this.data.filter) {
                if (hasGateway || hasChild) spaceList.push(space)
              } else {
                if (notPublicSpace || (!notPublicSpace && hasBrotherNode && hasGateway)) spaceList.push(space)
              }
            }
          }
        })
      this.setData({
        _filterSpaceList: spaceList,
      })
      const result = this.buildTree(spaceList, '0')
      this.setData({ spaceData: result }, () => {
        if (this.data.targetSpaceId) {
          this.initTargetSpace(this.data.targetSpaceId)
        }
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
    /**
     * 设置目标空间
     */
    initTargetSpace(targetSpaceId: string) {
      if (!targetSpaceId || isEmptyObject(this.data.spaceData)) {
        console.warn(
          '[all-space-select]initTargetSpace失败，targetSpaceId为空或spaceData为空',
          targetSpaceId,
          this.data.spaceData,
        )
        return
      }
      const space = spaceStore.allSpaceList.find((s) => {
        return s.spaceId === targetSpaceId
      })
      if (space) {
        const spaceIds = [space.spaceId]
        let parentSpace = spaceStore.allSpaceList.find((s) => s.spaceId === space.pid)
        while (parentSpace) {
          spaceIds.unshift(parentSpace.spaceId)
          parentSpace = spaceStore.allSpaceList.find((s) => s.spaceId === parentSpace?.pid)
        }
        // 如果spaceData不存在targetSpaceId，则默认选中第一个
        let flag = true
        // 初始化当前层级为spaceData（顶层）
        let currentLevel: Record<string, Space.SpaceTreeNode> = this.data.spaceData
        // 遍历spaceIds
        for (const id of spaceIds) {
          // 检查当前层级是否包含当前ID
          if (!currentLevel[id]) {
            flag = false
            break
          }
          // 更新currentLevel为当前ID对应的下一层
          currentLevel = currentLevel[id].child
        }
        if (flag) {
          console.log('[all-space-select]initTargetSpace成功')
          this.setData(
            {
              firstSpaceId: spaceIds[0] || '',
              _firstSpaceId: spaceIds[0] || '',
              secondSpaceId: spaceIds[1] || '',
              _secondSpaceId: spaceIds[1] || '',
              thirdSpaceId: spaceIds[2] || '',
              _thirdSpaceId: spaceIds[2] || '',
              fourthSpaceId: spaceIds[3] || '',
              _fourthSpaceId: spaceIds[3] || '',
            },
            () => {
              if (this.data.initConfirm) this.triggerEvent('confirm', this.calcConfirmRes())
            },
          )
        } else {
          console.warn('[all-space-select]initTargetSpace失败，spaceData不存在targetSpaceId，已默认initDefault')
          this.initDefault()
        }
      }
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
      if (!spaceStore.allSpaceList.length) {
        Toast('请先添加空间')
        return
      }
      this.setData({ show: true })
    },
    closePopup() {
      this.setData({ show: false })
    },
    firstCheck(e: { currentTarget: { dataset: { id: string } } }) {
      // 下层空间是否存在空间
      let nextSpaceId = ''
      const childList = this.data._filterSpaceList.filter((s) => s.pid === e.currentTarget.dataset.id)
      if (childList.length === 1) nextSpaceId = childList[0].spaceId
      this.setData({
        firstSpaceId: e.currentTarget.dataset.id,
        secondSpaceId: nextSpaceId,
        thirdSpaceId: '',
        fourthSpaceId: '',
      })
    },
    secondCheck(e: { currentTarget: { dataset: { id: string } } }) {
      // 下层空间是否存在空间
      let nextSpaceId = ''
      const childList = this.data._filterSpaceList.filter((s) => s.pid === e.currentTarget.dataset.id)
      if (childList.length === 1) nextSpaceId = childList[0].spaceId
      this.setData({
        secondSpaceId: e.currentTarget.dataset.id,
        thirdSpaceId: nextSpaceId,
        fourthSpaceId: '',
      })
    },
    thirdCheck(e: { currentTarget: { dataset: { id: string } } }) {
      // 下层空间是否存在空间
      let nextSpaceId = ''
      const childList = this.data._filterSpaceList.filter((s) => s.pid === e.currentTarget.dataset.id)
      if (childList.length === 1) nextSpaceId = childList[0].spaceId
      this.setData({
        thirdSpaceId: e.currentTarget.dataset.id,
        fourthSpaceId: nextSpaceId,
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
