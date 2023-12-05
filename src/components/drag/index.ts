// 源码：https://github.com/wxp-ui/wxp-ui/#drag-%E7%BB%84%E4%BB%B6

/**
 * 版本号比较
 */
const compareVersion = (v1: string, v2: string) => {
  const v1Split = v1.split('.')
  const v2Split = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1Split.length < len) {
    v1Split.push('0')
  }
  while (v2Split.length < len) {
    v2Split.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1Split[i])
    const num2 = parseInt(v2Split[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}

let listWxs = [] as IAnyObject[] // wxs 传回的最新 list 数据

Component({
  externalClasses: ['item-wrap-class'],
  options: {
    multipleSlots: true,
  },
  properties: {
    extraNodes: {
      // 额外节点
      type: Array,
      value: [],
    },
    listData: {
      // 数据源
      type: Array,
      value: [],
    },
    columns: {
      // 列数
      type: Number,
      value: 1,
    },
    topSize: {
      // 顶部固定高度
      type: Number,
      value: 0,
    },
    bottomSize: {
      // 底部固定高度
      type: Number,
      value: 0,
    },
    itemHeight: {
      // 每个 item 高度, 用于计算 item-wrap 高度
      type: Number,
      value: 0,
    },
    scrollTop: {
      // 页面滚动高度
      type: Number,
      value: 0,
    },
  },
  data: {
    /* 未渲染数据 */
    baseData: {},
    pageMetaSupport: false, // 当前版本是否支持 page-meta 标签
    platform: '', // 平台信息
    rows: 0, // 行数

    /* 渲染数据 */
    wrapStyle: '', // item-wrap 样式
    list: [] as IAnyObject[], // 渲染数据列
    dragging: false,
    updating: false, // 正在更新数据，不允许手势操作
  },
  methods: {
    vibrate() {
      if (this.data.platform !== 'devtools') wx.vibrateShort({ type: 'heavy' })
    },
    pageScroll(e: { scrollTop: number }) {
      if (this.data.pageMetaSupport) {
        this.triggerEvent('scroll', {
          scrollTop: e.scrollTop,
        })
      } else {
        wx.pageScrollTo({
          scrollTop: e.scrollTop,
          duration: 300,
        })
      }
    },
    drag(e: { dragging: boolean; index: number }) {
      console.log('触发drag', this.data.dragging)
      this.triggerEvent('drag', {
        dragging: e.dragging,
        ...this.data.listData[e.index],
      })
      this.setData({
        dragging: e.dragging,
      })
    },
    listChange(e: { list: IAnyObject[] }) {
      listWxs = e.list
    },
    itemClick(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index
      const item = listWxs[index]

      this.triggerEvent('click', {
        key: item.realKey,
        data: item.data,
        extra: e.detail,
      })
    },
    /**
     *  初始化获取 dom 信息
     */
    initDom() {
      const { windowWidth, windowHeight, platform, SDKVersion } = wx.getSystemInfoSync()
      const remScale = (windowWidth || 375) / 375

      this.data.pageMetaSupport = compareVersion(SDKVersion, '2.9.0') >= 0
      this.data.platform = platform

      const baseData = {} as IAnyObject
      baseData.windowHeight = windowHeight
      baseData.realTopSize = (this.data.topSize * remScale) / 2
      baseData.realBottomSize = (this.data.bottomSize * remScale) / 2
      baseData.columns = this.data.columns
      baseData.rows = this.data.rows

      const query = this.createSelectorQuery()
      query.select('.item').boundingClientRect()
      query.select('.item-wrap').boundingClientRect()
      query.exec((res) => {
        if (!res || !res[0] || !res[1]) {
          return
        }
        baseData.itemWidth = res[0].width
        baseData.itemHeight = res[0].height
        baseData.wrapLeft = res[1].left
        baseData.wrapTop = res[1].top + this.data.scrollTop
        this.setData({
          dragging: false,
          updating: false,
          baseData,
        })
      })
    },
    /**
     * column 改变时候需要清空 list, 以防页面溢出
     */
    columnChange() {
      this.setData({
        list: [],
      })
      this.init()
    },
    /**
     *  初始化函数
     *  {listData, topSize, bottomSize, itemHeight} 参数改变需要手动调用初始化方法
     */
    init() {
      const delItem = (item: IAnyObject, extraNode: boolean) => ({
        id: item.dragId,
        extraNode: extraNode,
        fixed: item.fixed,
        slot: item.slot,
        data: item,
      })

      const { listData, extraNodes } = this.data
      const _list = [] as IAnyObject[],
        _before = [] as IAnyObject[],
        _after = [] as IAnyObject[],
        destBefore = [] as IAnyObject[],
        destAfter = [] as IAnyObject[]

      extraNodes.forEach((item) => {
        if (item.type === 'before') {
          _before.push(delItem(item, true))
        } else if (item.type === 'after') {
          _after.push(delItem(item, true))
        } else if (item.type === 'destBefore') {
          destBefore.push(delItem(item, true))
        } else if (item.type === 'destAfter') {
          destAfter.push(delItem(item, true))
        }
      })

      // 遍历数据源增加扩展项, 以用作排序使用
      listData.forEach((item, index) => {
        destBefore.forEach((i) => {
          if (i.data.destKey === index) _list.push(i)
        })
        _list.push(delItem(item, false))
        destAfter.forEach((i) => {
          if (i.data.destKey === index) _list.push(i)
        })
      })

      let i = 0
      const columns = this.data.columns
      const list = (_before.concat(_list, _after) || []).map((item, index) => {
        item.realKey = item.extraNode ? -1 : i++ // 真实顺序
        item.sortKey = index // 整体顺序
        item.tranX = `${(item.sortKey % columns) * 100}%`
        item.tranY = `${Math.floor(item.sortKey / columns) * 100}%`
        return item
      })

      this.data.rows = Math.ceil(list.length / columns)
      listWxs = list

      this.setData({
        list,
        wrapStyle: `height: ${this.data.rows * this.data.itemHeight}rpx`,
        dragging: true,
        updating: true,
      })

      if (list.length === 0) return

      // 异步加载数据时候, 延迟执行 initDom 方法, 防止基础库 2.7.1 版本及以下无法正确获取 dom 信息
      setTimeout(() => this.initDom(), 0)
    },
    handleToSetting(e: { detail: IAnyObject }) {
      this.triggerEvent('toSetting', e.detail)
    },
    handleExec(e: { detail: IAnyObject }) {
      this.triggerEvent('exec', e.detail)
    },
    handleControlTap(e: { detail: IAnyObject }) {
      this.triggerEvent('controlTap', e.detail)
    },
    handleCardTap(e: { detail: IAnyObject }) {
      this.triggerEvent('cardTap', e.detail)
    },
    handleShowDeviceOffline(e: { detail: IAnyObject }) {
      this.triggerEvent('offlineTap', e.detail)
    },
    /* 自动化使用 start */
    handleActionEdit(e: { detail: IAnyObject }) {
      this.triggerEvent('actionEdit', e.detail)
    },
    handleActionDelete(e: { detail: IAnyObject }) {
      this.triggerEvent('actionDelete', e.detail)
    },
    /* 自动化使用 end */
  },
  ready() {
    // prof: 感觉没什么用，暂时注释
    // this.init()
  },
})
