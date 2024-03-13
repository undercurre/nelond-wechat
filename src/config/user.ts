/**
 * 用户角色
 */
export enum UserRole {
  UnDef = '', // 未定义
  SuperAdmin = '0', // 总管
  Creator = '1', // 代理商管理员
  Admin = '2', // 项目管理员
  Visitor = '3', // 项目使用者
}

/**
 * 验证码有效时长（秒）
 */
export const CAPTCHA_VALID_TIME = 60
