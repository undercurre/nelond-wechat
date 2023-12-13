declare namespace Scene {
  /**
   * 查询空间的场景列表项
   */
  interface SceneItem extends SceneBase {
    /**
     * 条件类型
     * 0-或，1-与
     */
    conditionType: string
    deviceActions: DeviceAction[]
    deviceConditions: DeviceCondition[]
    projectId: string
    orderNum: number
    spaceId: string
    spaceName: string
  }
  /**
   * 空间列表里的场景列表项
   */
  interface SceneBase {
    /**
     * 对应的默认场景
     * 0：全开 1：全关 2：明亮 3：柔和
     */
    defaultType: string
    /**
     * 是否默认创建的场景
     * 0：否 1：是
     */
    isDefault: string
    /**
     * 	场景Icon
     */
    sceneIcon: string
    /**
     * 场景id
     */
    sceneId: string
    /**
     * 场景名称
     */
    sceneName: string
    /**
     * 场景更新时间
     */
    updateStamp: number
  }
  /** 结果集合 */
  interface DeviceAction {
    /**
     * 动作控制集合
     * 例如："controlAction":[{"modelName":'wallSwitch1,"power":0},{"modelName":'wallSwitch2',"power":1}]
     */
    controlAction: IAnyObject[]
    /** 设备id */
    deviceId: string
    // 设备名称
    deviceName?: string

    // 设备图片
    devicePic?: string
    /** 设备类型 */
    deviceType: number
    /** 品类码 */
    proType: string
  }
  interface DeviceCondition {
    /**
     * 绑定控制集合，
     * 例如："controlEvent":[{"modelName":'wallSwitch1',"buttonScene":1}]
     * buttonScene 电控所需参数，目前固定为1
     */
    controlEvent: { modelName: string; buttonScene: number }[]
    /** 设备id */
    deviceId: string
  }
  interface AddSceneDto {
    /**
     * 条件类型
     * 0-或，1-与，目前全部传0
     */
    conditionType: '0' | '1'

    // 结果集合
    deviceActions: DeviceAction[]

    // 条件集合
    deviceConditions: DeviceCondition[]
    projectId: string
    spaceId: string
    sceneIcon: string
    sceneName: string
    /**
     * 场景类型
     * 0-没条件，1-有条件
     */
    sceneType: string
    orderNum: number
  }
  interface UpdateSceneDto {
    /**
     * 条件类型
     * 0-或，1-与，目前全部传0
     * updateType=3或者updateType=5时，必传
     */
    conditionType?: '0' | '1'
    deviceActions?: DeviceAction[]
    deviceConditions?: DeviceCondition[]
    sceneIcon?: string
    sceneId?: string
    spaceId?: string
    sceneName?: string
    /** 更新类型
     * 0-仅更新名称和icon，1-删除结果 2-取消绑定 3-更新绑定 4-删除结果与取消绑定 5-删除结果与更新绑定
     */
    updateType: '0' | '1' | '2' | '3' | '4' | '5'
  }
}
