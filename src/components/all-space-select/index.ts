import { ComponentWithComputed } from 'miniprogram-computed'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    spaceData: {
      type: Array,
      value: [
        {
          pid: '',
          spaceId: '1',
          spaceName: '美创园区',
          child: [
            {
              pid: '1',
              spaceId: '14',
              spaceName: '4栋',
              child: [
                {
                  pid: '14',
                  spaceId: '142',
                  spaceName: '2楼',
                  child: [
                    { pid: '142', spaceId: '142r', spaceName: '软件部' },
                    { pid: '142', spaceId: '142y', spaceName: '硬件部' },
                  ],
                },
                {
                  pid: '14',
                  spaceId: '143',
                  spaceName: '3楼',
                  child: [],
                },
              ],
            },
            { pid: '1', spaceId: '13', spaceName: '3栋', child: [] },
            {
              pid: '1',
              spaceId: '12',
              spaceName: '2栋',
              child: [
                {
                  pid: '12',
                  spaceId: '122',
                  spaceName: '2楼',
                  child: [{ pid: '122', spaceId: '122r', spaceName: '硬件部' }],
                },
              ],
            },
          ],
        },
        {
          pid: '',
          spaceId: '2',
          spaceName: '总部',
          child: [],
        },
      ],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false,
    firstIndex: -1,
    secondIndex: -1,
    thirdIndex: -1,
    fourthIndex: -1,
  },
  computed: {
    checkedSpaceName(data) {
      let desc = ''
      if (data.firstIndex !== -1) {
        desc += data.spaceData[data.firstIndex].spaceName
        if (data.secondIndex !== -1) {
          desc += `，${data.spaceData[data.firstIndex].child[data.secondIndex].spaceName}`
          if (data.thirdIndex !== -1) {
            desc += `，${data.spaceData[data.firstIndex].child[data.secondIndex].child[data.thirdIndex].spaceName}`
          }
        }
      }
      return desc
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
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
  },
})
