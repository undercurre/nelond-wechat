export const strUtil = {
  /**
   * 获取拼装参数后的完整url
   * @param url
   * @param params
   */
  getUrlWithParams(url: string, params: IAnyObject) {
    let result = ''

    Object.entries(params).forEach(([key, value]) => {
      result += `${key}=${value}&`
    })

    result = result.substring(0, result.length - 1) //末尾是&
    return result ? `${url}?${result}` : url
  },

  /**
   * 获取url的拼接参数
   * @param url
   */
  getUrlParams(url: string) {
    const theRequest: IAnyObject = {}
    if (url.indexOf('?') != -1) {
      const queryString = url.substr(url.indexOf('?') + 1)
      const strs = queryString.split('&')
      for (let i = 0; i < strs.length; i++) {
        theRequest[strs[i].split('=')[0]] = unescape(strs[i].split('=')[1])
      }
    }
    return theRequest
  },

  /**
   * 分割16进制字符串，转化成对应num个字节数组，
   * 此正则只针对十六进制
   * 输入多于六个字符，超过的字符如果不属于十六进制会变成NaN
   * @param str 16进制字符串
   * @param num 要拆分的字节数的个体单位
   */
  hexStringToArrayUnit8(str: string, num: number) {
    const reg = new RegExp(`([0-9a-fA-F]{${num}})`)
    let arr = str.split(reg)

    arr = arr.filter((item) => item != '')

    return arr.map((item) => parseInt('0x' + item))
  },

  /**
   * 16进制字符串转ArrayBuffer
   * @param str
   */
  hexStringToArrayBuffer: (str: string) => {
    if (!str) {
      return new ArrayBuffer(0)
    }
    const buffer = new ArrayBuffer(str.length / 2)
    const dataView = new DataView(buffer)
    let ind = 0
    for (let i = 0, len = str.length; i < len; i += 2) {
      const code = parseInt(str.substr(i, 2), 16)
      dataView.setUint8(ind, code)
      ind++
    }
    return buffer
  },
  // ArrayBuffer转16进制字符串示例
  ab2hex(buffer: ArrayBuffer) {
    const hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    })
    return hexArr.join('')
  },

  /**
   * ArrayBuffer转为字符串，参数为ArrayBuffer对象
   * @param buf ArrayBuffer
   */
  ab2str(buf: ArrayBuffer) {
    const bytes = new Uint8Array(buf)
    let text = ''
    for (let i = 0; i < bytes.length; i++) {
      text += '%' + bytes[i].toString(16)
    }
    return decodeURIComponent(text)
  },
  /**
   * 周期描述转换
   * @param timeType
   * @param timePeriod
   * @returns
   */
  transPeriodDesc(timeType: string, timePeriod: string) {
    if (timeType === '0') {
      return '仅一次'
    } else if (timeType === '2') {
      return '法定工作日'
    } else if (timeType === '3') {
      return '法定节假日'
    } else {
      const weekMap: Record<string, string> = {
        '1': '周日',
        '2': '周一',
        '3': '周二',
        '4': '周三',
        '5': '周四',
        '6': '周五',
        '7': '周六',
      }
      const weekArr = timePeriod.split(',')
      if (weekArr.length === 7) {
        return '每天'
      }
      const newWeekArr: string[] = []
      weekArr.forEach((item) => {
        newWeekArr.push(weekMap[item])
      })
      return newWeekArr.join('、')
    }
  },
  /**
   * 传入开始时间和结束时间，解释结束时间是否为次日
   * @param startTime '12:00'
   * @param endTime '14:00'
   * @returns
   */
  transEndTimeDesc(startTime: string, endTime: string) {
    const startTimeHour = parseInt(startTime.substring(0, 2))
    const endTimeHour = parseInt(endTime.substring(0, 2))
    const startTimeMin = parseInt(startTime.substring(startTime.indexOf(':') + 1))
    const endTimeMin = parseInt(endTime.substring(endTime.indexOf(':') + 1))

    if (endTimeHour < startTimeHour) {
      return `次日${endTime}`
    } else if (endTimeHour === startTimeHour) {
      if (endTimeMin <= startTimeMin) {
        return `次日${endTime}`
      } else {
        return endTime
      }
    } else {
      return endTime
    }
  },
  /**
   * 自动化场景desc转换 区分时间条件和传感器条件
   * @param effectiveTime
   * @param timeConditions
   */
  transDesc(effectiveTime: AutoScene.effectiveTime, timeConditions: AutoScene.TimeCondition) {
    if (timeConditions && timeConditions.time) {
      return `${timeConditions.time} ${strUtil.transPeriodDesc(timeConditions.timeType, timeConditions.timePeriod)}`
    } else {
      if (strUtil.isAllday(effectiveTime)) {
        return `${strUtil.transPeriodDesc(effectiveTime.timeType, effectiveTime.timePeriod)}`
      } else {
        return `${effectiveTime.startTime.substring(0, 5)}-${strUtil.transEndTimeDesc(
          effectiveTime.startTime.substring(0, 5),
          effectiveTime.endTime.substring(0, 5),
        )} ${strUtil.transPeriodDesc(effectiveTime.timeType, effectiveTime.timePeriod)}`
      }
    }
  },
  isAllday(effectiveTime: AutoScene.effectiveTime) {
    const start = effectiveTime.startTime.split(':')
    const startMin = Number(start[0]) * 60 + Number(start[1])
    const end = effectiveTime.endTime.split(':')
    const endMin = Number(end[0]) * 60 + Number(end[1])
    if (startMin - endMin === 1 || (startMin === 0 && endMin === 1439)) {
      return true
    } else {
      return false
    }
  },
  /**
   * 传入秒数，转化为时分秒格式
   * @param seconds
   */
  formatTime(seconds: number) {
    return `${Math.trunc(seconds / 3600) > 0 ? Math.trunc(seconds / 3600) + '小时' : ''}${
      Math.trunc((seconds % 3600) / 60) > 0 ? Math.trunc((seconds % 3600) / 60) + '分' : ''
    }${Math.trunc((seconds % 3600) % 60) > 0 ? Math.trunc((seconds % 3600) % 60) + '秒' : ''}`
  },

  /**
   * 计算字符串长度，数字、英文、字母为1，中文为2
   * @param str 要计算的字符串
   * @returns number
   */
  getLength(str: string) {
    let count = 0
    for (let i = 0; i < str.length; i++) {
      if (/[\u4e00-\u9fa5]/.test(str[i])) {
        // 判断是否为中文字符
        count += 2
      } else {
        count += 1
      }
    }
    return count
  },
}

/**
 * 实现一个指定长度的字符串队列
 * 当队列长度超过上限时把最早进入队列的数据出栈
 */
export class StringQueue {
  private queue: string[]
  private readonly maxLength: number

  constructor(maxLength: number) {
    this.queue = []
    this.maxLength = maxLength
  }

  push(str: string): void {
    if (this.queue.length >= this.maxLength) {
      this.queue.shift()
    }
    this.queue.push(str)
  }

  pop(): string | undefined {
    return this.queue.shift()
  }

  size(): number {
    return this.queue.length
  }

  includes(str: string): boolean {
    return this.queue.includes(str)
  }
}
