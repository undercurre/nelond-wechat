// 项目
declare namespace Project {
  /**
   * 项目列表，列表项
   */
  export interface IProjectItem {
    /**
     * 项目唯一id
     */
    projectId: string
    /**
     * 项目名称
     */
    projectName: string

    /**
     * 是否创建者
     */
    houseCreatorFlag: boolean
  }

  /**
   * 成员角色
   * 1：创建者
   * 2：管理员
   * 3：游客
   */
  export interface UserRoleMap {
    creator: 1
    admin: 2
    visitor: 3
  }

  export type UserRole = ValueOf<UserRoleMap>

  /**
   * 项目详细值
   */
  export interface IProjectDetail {
    /**
     * 项目唯一id
     */
    projectId: string
    /**
     * 项目名称
     */
    projectName: string

    // 用户项目权限
    houseUserAuth: UserRole

    /**
     * 设备数量
     */
    deviceCount: number

    /**
     * 成员数量
     */
    userCount: number

    /**
     * 项目位置
     */
    houseArea: string

    /**
     * 空间数量
     */
    roomCount: number
  }

  export interface ISpaceInfo {
    lightOnCount: number
    roomIcon: string
    spaceId: string
    spaceName: string
  }

  export interface UserItem {
    /**
     * 成员权限编码
     */
    userHouseAuth: UserRole
    /**
     * 成员权限名称
     */
    roleName: string
    /**
     * 	成员id
     */
    userId: string
    /**
     * 成员名称
     */
    userName: string
    /**
     * 成员头像
     */
    headImageUrl: string
  }

  export interface HomeMemberInfo {
    projectUserList: UserItem[]
    totalElements: number
  }
}
