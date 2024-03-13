// 业务类型示例

declare namespace User {
  // 用户角色
  enum UserRole {
    UnDef = '', // 未定义
    SuperAdmin = '0', // 总管
    Creator = '1', // 代理商管理员
    Admin = '2', // 项目管理员
    Visitor = '3', // 项目使用者
  }
  interface UserLoginRes {
    /**
     * 头像
     */
    headImageUrl?: string
    /**
     * 昵称
     */
    nickName?: string
    /**
     * 手机号
     */
    mobilePhone: string
    /**
     * 令牌
     */
    token: string
  }
  interface UserInfo {
    /**
     * 头像
     */
    headImageUrl: string
    /**
     * 昵称
     */
    nickName: string
    /**
     * 手机号
     */
    mobilePhone: string
    /**
     * 用户id
     */
    userId: string
    /**
     * 用户名称
     */
    userName: string
    /**
     * 微信id
     */
    wxId: string
    /**
     * 性别
     */
    sex: number
    /**
     * 用户角色 uuid
     */
    roleId: UserRole
    /**
     * 用户角色名称
     */
    roleName: string
  }
}
