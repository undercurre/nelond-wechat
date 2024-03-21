import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { projectBinding, projectStore } from '../../store/project'
import { queryDictData } from '../../apis/index'

ComponentWithComputed({
  options: {},
  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    projectTypeName: '',
  },

  computed: {},

  lifetimes: {
    async ready() {
      const projectType = projectStore.currentProjectDetail?.projectType ?? '0'
      const res = await queryDictData()
      if (!res.success) {
        console.log('加载项目类型字典失败！', res)
        return
      }
      const projectItem = res.result.find((ele) => ele.dictCode === projectType)
      if (projectItem) {
        this.setData({
          projectTypeName: projectItem.dictName,
        })
      }
    },
    detached() {},
  },

  methods: {},
})
