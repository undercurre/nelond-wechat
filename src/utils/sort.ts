/**
 * 对设备数组进行排序，根据设备对象中的 "proType" 属性值与提供的proType字符串数组的顺序。
 * @param {Array} list - 设备数组
 * @param {Array} sortArray - proType数组
 * @returns {Array} - 排序后的设备数组。
 */
export function sortDeivcesByConfig(list: Device.DeviceItem[], sortArray: string[]) {
  return list.sort((a: Device.DeviceItem, b: Device.DeviceItem) => {
    const typeA = a.proType + a.deviceType
    const typeB = b.proType + b.deviceType
    const indexA = sortArray.indexOf(typeA)
    const indexB = sortArray.indexOf(typeB)
    // 如果 a 和 b 都在 sortArray 中，则按照它们在 sortArray 中的位置排序
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    // 如果只有 a 在 sortArray 中，则 a 在前，否则 b 在前
    if (indexA !== -1) {
      return -1
    } else {
      return 1
    }
  })
}
