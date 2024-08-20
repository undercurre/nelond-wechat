// 业务类型示例

declare namespace User {
  // 用户角色
  enum UserRole {
    UnDef = -1, // 未定义
    SuperAdmin = 0, // 总管
    Creator = 1, // 代理商管理员
    Admin = 2, // 项目管理员
    Visitor = 3, // 项目使用者
    ProjectSuperAdmin = 4, // 项目超级管理员
  }

  interface RoleItem {
    roleId: string
    roleName: string
    roleLevel: number
    projectId: string
    projectType: string
    defaultRoleFlag: number
  }
  interface UserInfo {
    /**
     * 用户名称
     */
    userName: string
    /**
     * 手机号
     */
    mobilePhone: string
    /**
     * 令牌
     */
    token: string
    /** 角色列表 */
    roleList: RoleItem[]
  }
}
