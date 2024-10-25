declare namespace Ota {
  interface OtaProduct {
    /** 设备列表 */
    deviceList: string[]
    /** 产品icon */
    icon: string
    /** 产品id */
    productId: string
    /** 产品名称 */
    productName: string
    /** ota更新状态 	ota更新状态 1：升级中 2：升级完成 3：升级失败 */
    updateStatus: number
    /** ota固件版本 */
    version: string
    /** 版本描述 */
    versionDesc: string
    /** ota类型 1：网关 2：子设备 3：wifi  7：边缘网关 */
    otaType: number
  }

  interface OtaUpdate {
    /** 设备Id */
    deviceId: string
    /** 设备名称 */
    deviceName: string
    /** 网关id，如果设备为子设备该参数非空 */
    gatewayId: string
    /** 文件md5 */
    otaMd5: string
    /** 设备产品id(可以用逗号分隔，可能一个或多个产品id) */
    otaProductId: string
    /** 更新版本状态 0：未更新 1：更新中 2：更新完成 */
    otaUpdateStatus: number
    /** 设备图片 */
    pic: string
    /** 空间名称 */
    spaceName: string
    /** 更新版本号 */
    updateVersion: string
    /** ota更新版本连接 */
    updateVersionUrl: string
    /** 版本号 */
    version: string
    /** 版本更新备注 */
    versionDesc: string
    /** ota类型 1：网关 2：子设备 3：wifi  7：边缘网关 */
    otaType: number
  }

  interface DeviceOtaUpdateReqDTO {
    deviceId: string
    gatewayId: string
    otaMd5: string
    otaProductId: string
    updateVersion: string
    updateVersionUrl: string
  }
}
