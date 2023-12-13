/**
 * 	空间信息
 */
type spaceInfo = {
  /**
   * 设备数量
   */
  deviceCount: number
  /**
   * 子级节点数量
   */
  nodeCount: number
  /**
   * 离线设备数量
   */
  offlineDeviceCount: 0
  /**
   * 空间id
   */
  spaceId: string
  /**
   * 分组id，空间也属于一个分组
   */
  groupId: string
  /**
   * 空间名称
   */
  spaceName: string
  /**
   * 空间场景列表
   */
  sceneList?: Scene.SceneItem[]

  spaceLevel?: 1 | 2 | 3 | 4
}
declare namespace Space {
  /**
   * 项目查询空间列表项
   */
  interface SpaceItem {
    spaceInfo: spaceInfo
    /**
     * 空间场景列表
     */
    roomSceneList?: Scene.SceneItem[]
  }
  /**
   * 空间信息
   */
  type SpaceInfo = spaceInfo

  /**
   * 空间排序
   */
  interface RoomSort {
    spaceId: string
    sort: number
  }
}
