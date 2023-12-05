import { emitter, storage } from '../../utils/index'

// package-automation/scene-success/index.ts
Component({
  /**
   * 页面的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
  },

  methods: {
    go2SceneIndex() {
      emitter.emit('sceneEdit')
      wx.navigateBack({
        delta: 3,
      })
    },
  },
})
