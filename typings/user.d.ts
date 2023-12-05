// 业务类型示例
declare namespace User {
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
     * 名称
     */
    name: string
    /**
     * 微信id
     */
    wxId: string
    /**
     * 性别
     */
    sex: number
  }
}
