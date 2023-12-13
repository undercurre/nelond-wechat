import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import { saveHouseRoomInfo } from '../../apis/index'
import { projectBinding, roomBinding } from '../../store/index'
import { checkInputNameIllegal, emitter } from '../../utils/index'

Component({
  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [projectBinding] })],

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    isSave: {
      type: Boolean,
      value: true,
    },
    isEditName: {
      type: Boolean,
      value: true,
    },
    isEditIcon: {
      type: Boolean,
      value: true,
    },
    spaceId: {
      type: String,
      default: '',
    },
    spaceName: {
      type: String,
      default: '',
    },
    roomIcon: {
      type: String,
      default: '',
    },
  },

  observers: {
    show: function (show) {
      if (!show) {
        return
      }

      console.log('observers-spaceName, roomIcon', this.data)

      this.setData({
        spaceInfo: {
          hasEditName: Boolean(this.data.spaceName),
          name: this.data.spaceName,
          icon: this.data.roomIcon || 'parents-space',
        },
      })
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    spaceInfo: {
      hasEditName: false,
      name: '',
      icon: 'parents-room',
    },
    iconList: [
      {
        icon: 'drawing-room',
        text: '客厅',
      },
      {
        icon: 'master-bedroom',
        text: '主卧',
      },
      {
        icon: 'second-bedroom',
        text: '次卧',
      },
      {
        icon: 'study-room',
        text: '书房',
      },
      {
        icon: 'restaurant',
        text: '餐厅',
      },
      {
        icon: 'cloakroom',
        text: '衣帽间',
      },
      {
        icon: 'bathroom',
        text: '浴室',
      },
      {
        icon: 'balcony',
        text: '阳台',
      },
      {
        icon: 'toilet',
        text: '卫生间',
      },
      {
        icon: 'gallery',
        text: '走廊',
      },
      {
        icon: 'kitchen',
        text: '厨房',
      },
      {
        icon: 'parents-room',
        text: '默认',
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    changeRoomName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeRoomName', event)

      this.setData({
        'spaceInfo.hasEditName': true,
        'spaceInfo.name': event.detail || '',
      })
    },

    handleClose() {
      this.triggerEvent('close')
    },
    async handleConfirm() {
      if (!this.data.spaceInfo.name) {
        Toast('名称不能为空')
        return
      }

      // 校验名字合法性
      if (checkInputNameIllegal(this.data.spaceInfo.name)) {
        Toast('名称不能用特殊符号或表情')
        return
      }

      if (this.data.spaceInfo.name.length > 5) {
        Toast('名称不能超过5个字符')
        return
      }

      if (this.data.isSave) {
        const res = await saveHouseRoomInfo({
          projectId: projectBinding.store.currentProjectId,
          spaceId: this.data.spaceId,
          roomIcon: this.data.spaceInfo.icon,
          spaceName: this.data.spaceInfo.name,
        })

        if (res.success) {
          roomBinding.store.updateSpaceList()
          emitter.emit('homeInfoEdit')
        } else {
          return
        }
      }

      this.triggerEvent('confirm', {
        spaceId: this.data.spaceId,
        roomIcon: this.data.spaceInfo.icon,
        spaceName: this.data.spaceInfo.name,
      })

      this.triggerEvent('close')
    },
    /**
     * 图标选中操作
     */
    selectIcon({ currentTarget }: WechatMiniprogram.BaseEvent) {
      console.log('selectIcon', currentTarget)
      const { icon, text } = currentTarget.dataset

      if (this.data.spaceInfo.name && this.data.spaceInfo.hasEditName) {
        this.setData({
          'spaceInfo.icon': icon,
        })
      } else {
        this.setData({
          'spaceInfo.name': text,
          'spaceInfo.icon': icon,
          'spaceInfo.hasEditName': false,
        })
      }
    },
  },
})
