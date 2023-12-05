/**
 * 	房间信息
 */
type roomInfo = {
  /**
   * 灯打开数量
   */
  deviceLightOnNum?: number
  /**
   * 设备数量
   */
  deviceNum: number
  /**
   * 	房间icon
   */
  roomIcon: string | null
  /**
   * 房间id
   */
  roomId: string
  /**
   * 分组id，房间也属于一个分组
   */
  groupId: string
  /**
   * 房间名称
   */
  roomName: string
  /**
   * 房间场景列表
   */
  sceneList: Scene.SceneItem[]
  /**
   * 下面是小程序端统计的字段
   */
  // 统计多少灯打开（多开开关单独计算）（取代云端deviceLightOnNum）
  lightOnCount: number

  // 非网关设备数
  endCount: number

  // 灯与面板总数量
  lightCount: number
}
declare namespace Room {
  /**
   * 家庭查询房间列表项
   */
  interface RoomItem {
    roomInfo: roomInfo
    /**
     * 房间场景列表
     */
    roomSceneList: Scene.SceneItem[]
  }
  /**
   * 房间信息
   */
  type RoomInfo = roomInfo

  /**
   * 房间排序
   */
  interface RoomSort {
    roomId: string
    sort: number
  }
}
