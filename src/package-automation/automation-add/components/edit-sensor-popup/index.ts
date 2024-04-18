import { ComponentWithComputed } from 'miniprogram-computed'
import { SENSOR_TYPE } from '../../../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    checkList: {
      type: Array,
      value: [],
    },
    //用于判断是哪种类型的传感器
    productId: {
      type: String,
      value: '',
    },
    controlAction: {
      type: Object,
      observer(value) {
        this.setData({
          _controlAction: value,
        })
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    _controlAction: {},
    lux_columns: ['大于', '大于等于', '等于', '小于等于', '小于'],
    lux_sensor_list: ['midea.hlight.006.001', 'midea.hlightsensor.001.001']
  },
  computed: {
    title(data) {
      if (data.productId === SENSOR_TYPE.doorsensor) {
        return '门磁传感器'
      } else if (data.productId === SENSOR_TYPE.freepad) {
        return '无线开关'
      } else if (data.productId === SENSOR_TYPE.lux) {
        return '照度传感器'
      } else {
        return '人体传感器'
      }
    },

    isLuxSensor(data) {
      return data.productId === SENSOR_TYPE.lux
    },

    popupHeight(data) {
      if (data.productId === SENSOR_TYPE.doorsensor) {
        return 602
      } else if (data.productId === SENSOR_TYPE.freepad) {
        return 602
      } else {
        return 506
      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleChange(e: { detail: { ability: IAnyObject } }) {
      console.log(e.detail.ability)
      this.setData({
        _controlAction: { ...e.detail.ability },
      })
    },
    onLuxChange(event: { detail: { symbol: string; value: number } }) {
      this.setData({
        _controlAction: {
          illuminance: event.detail.value,
          illuminance_symbol: event.detail.symbol
        }
      })
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data._controlAction)
    },
    blank() {},
  },
})
