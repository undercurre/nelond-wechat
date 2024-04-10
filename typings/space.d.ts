declare namespace Space {
  enum SpaceLevel {
    undef = 0,
    park = 1,
    building = 2,
    floor = 3,
    area = 4,
  }

  /**
   * 	空间信息
   */
  type SpaceInfo = {
    /**
     * 设备数量
     */
    deviceCount: number
    /**
     * 子级节点数量，含公共空间
     */
    nodeCount: number
    /**
     * 离线设备数量
     */
    offlineDeviceCount: number
    /**
     * 是否公共空间
     */
    publicSpaceFlag: number
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
    sceneList: Scene.SceneItem[]

    spaceLevel: SpaceLevel
  }

  interface allSpace {
    pid: string
    spaceId: string
    spaceLevel: SpaceLevel
    spaceName: string
    publicSpaceFlag: number
  }

  interface SpaceTreeNode extends allSpace {
    child: { [key: string]: SpaceTreeNode }
  }

  /**
   * 空间排序
   */
  interface RoomSort {
    spaceId: string
    sort: number
  }
}
