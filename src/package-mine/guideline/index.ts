import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { ossDomain } from '../../config/index'
import { storage } from '../../utils/index'

// 设备类型
const system = (storage.get<string>('system') as string).toLocaleLowerCase().indexOf('ios') > -1 ? 'ios' : 'android'

ComponentWithComputed({
  options: {},
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    url: {
      duerVoice: `${ossDomain}/intro.png`,
      miVoice: `${ossDomain}/homlux/aIntro.png`,
      bleEnable: `${ossDomain}/homlux/ble-${system}.png`,
    },
    showImg: '',
  },

  computed: {},

  methods: {
    async onLoad(query: { type: 'duerVoice' | 'miVoice' | 'bleEnable' }) {
      this.setData({
        showImg: this.data.url[query.type],
      })
    },
  },
})
