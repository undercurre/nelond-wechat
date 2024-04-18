import { PRO_TYPE, NO_COLOR_TEMP } from '../config/index'
import { isNullOrUnDef } from './index'

/**
 * Deserted 此方法已不必使用，暂时保留代码
 *  子设备和wifi设备属性不一致,以子设备属性为标准转换
 * @param proType
 * @param properties
 */
export function transferDeviceProperty(proType: string, properties: IAnyObject) {
  const result = {} as IAnyObject

  if (isNullOrUnDef(properties)) {
    console.warn('转换标准属性失败，属性集为空')
    return result
  }
  // 开关属性
  // if (!isNullOrUnDef(properties.power) || !isNullOrUnDef(properties.power)) {
  //   result.power = properties.power ?? (properties.power === 'off' ? 0 : 1)
  // }
  if (!isNullOrUnDef(properties.power)) {
    result.power = properties.power
  }

  // 灯光属性
  if (proType === PRO_TYPE.light) {
    const { maxColorTemp, minColorTemp } = properties.colorTempRange || properties // 色温范围，空间首页的数据的色温属性可能已经被转换过，可能不存在colorTempRange属性

    result.maxColorTemp = maxColorTemp
    result.minColorTemp = minColorTemp

    // if (!isNullOrUnDef(properties.ColorTemp) || !isNullOrUnDef(properties.color_temperature)) {
    //   result.ColorTemp = properties.ColorTemp ?? Math.round((properties.color_temperature / 255) * 100)
    // }

    // if (!isNullOrUnDef(properties.Level) || !isNullOrUnDef(properties.brightness)) {
    //   result.Level = properties.Level ?? Math.round((properties.brightness / 255) * 100)
    // }
    if (!isNullOrUnDef(properties.colorTemperature)) {
      result.colorTemperature = properties.colorTemperature
    }

    if (!isNullOrUnDef(properties.brightness)) {
      result.brightness = properties.brightness
    }
  }
  // 目前只有WIFI窗帘一种
  else if (proType === PRO_TYPE.curtain) {
    return properties
  }

  return result
}

/**
 * Deserted 此方法已不必使用，暂时保留代码
 * 标准属性转wifi属性
 * @param proType
 * @param properties
 */
export function toWifiProperty(proType: string, properties: IAnyObject) {
  const result = {} as IAnyObject

  if (proType === PRO_TYPE.light) {
    // !isNullOrUnDef(properties.power) && (result.power = properties.power ? 'on' : 'off')
    !isNullOrUnDef(properties.power) && (result.power = properties.power)

    !isNullOrUnDef(properties.colorTemperature) && (result.colorTemperature = properties.colorTemperature)

    !isNullOrUnDef(properties.brightness) && (result.brightness = properties.brightness)
  }
  // 窗帘控制
  else if (proType === PRO_TYPE.curtain) {
    return properties
    // const { curtain_status, curtain_direction, curtain_position: pos } = properties
    // if (!isNullOrUnDef(pos)) {
    //   result.curtain_position = curtain_direction === 'reverse' ? 100 - Number(pos) : pos
    // }
    // if (!isNullOrUnDef(curtain_status)) {
    //   result.curtain_status = curtain_status
    // }
  }

  return result
}

function getValuesMap(key: string) {
  const map :Record<string, string> = {
    'greaterThan': '大于',
    'lessThan': '小于',
    'greaterThanOrEqualTo': '大于等于',
    'lessThanOrEqualTo': '小于等于',
    'equalTo': '等于'
  }
  return map[key]
}

/**
 * 转换成属性描述
 * @param proType
 * @param property 设备属性
 */
export function toPropertyDesc(proType: string, productId: string, property: IAnyObject) {
  const descList = [] as string[]
  if (proType === PRO_TYPE.light) {
    !isNullOrUnDef(property.power) && descList.push(property.power ? '打开' : '关闭')
    if (property.power === 1) {
      !isNullOrUnDef(property.brightness) && descList.push(`亮度${property.brightness}%`)

      if (!isNullOrUnDef(property.colorTemperature) && !NO_COLOR_TEMP.includes(productId)) {
        const { maxColorTemp, minColorTemp } = property.colorTempRange || property
        const color = (property.colorTemperature / 100) * (maxColorTemp - minColorTemp) + minColorTemp
        descList.push(`色温${color}K`)
      }
    }
  }

  if (proType === PRO_TYPE.switch) {
    !isNullOrUnDef(property) && !isNullOrUnDef(property.power) && descList.push(property.power ? '打开' : '关闭')
  }

  if (proType === PRO_TYPE.curtain) {
    if (property.curtain_position === 0) {
      descList.push(`关闭`)
    } else if (property.curtain_position === 100) {
      descList.push(`打开`)
    } else {
      descList.push(`开启至${property.curtain_position}%`)
    }
  }

  if (proType === PRO_TYPE.sensor) {
    !isNullOrUnDef(property.occupancy) && descList.push(property.occupancy ? '有人移动' : '超时无人移动')
    !isNullOrUnDef(property.IlluminanceLevelStatus) &&
      descList.push(property.IlluminanceLevelStatus === '2' ? '环境光亮' : '环境光暗')
    !isNullOrUnDef(property.doorStatus) &&
      descList.push(
        property.doorStatus ? (!isNullOrUnDef(property.PIRToUnoccupiedDelay) ? '超时未关闭' : '打开') : '关闭',
      )
    !isNullOrUnDef(property.illuminance) &&
      descList.push(`照度${getValuesMap(property.illuminance_symbol)}${property.illuminance}K`)
    !isNullOrUnDef(property.buttonClicked) &&
      descList.push(property.buttonClicked === 1 ? '单击' : property.buttonClicked === 2 ? '双击' : '长按')
  }

  if (proType === PRO_TYPE.bathHeat) {
    const { mode, light_mode, heating_temperature } = property
    if (mode?.indexOf('close_all') > -1) {
      descList.push('待机')
    }
    if (mode?.indexOf('heating') > -1) {
      if (Number(heating_temperature) >= 43) {
        descList.push('强暖')
      } else if (heating_temperature <= 42) {
        descList.push('弱暖')
      }
    }
    if (mode?.indexOf('ventilation') > -1) {
      descList.push('换气')
    }
    if (mode?.indexOf('blowing') > -1) {
      descList.push('吹风')
    }
    if (light_mode === 'main_light') {
      descList.push('照明')
    } else if (light_mode === 'night_light') {
      descList.push('夜灯')
    } else if (light_mode === 'close_all') {
      descList.push('关灯')
    }
  }

  if (proType === PRO_TYPE.clothesDryingRack) {
    const { updown, laundry, light } = property
    if (updown === 'up') {
      descList.push('上升')
    }
    if (updown === 'down') {
      descList.push('下降')
    }
    if (updown === 'pause') {
      descList.push('暂停')
    }
    if (laundry === 'on') {
      descList.push('一键晾衣')
    }
    if (light === 'on') {
      descList.push('照明')
    } else if (light === 'off') {
      descList.push('关灯')
    }
  }

  return descList
}
