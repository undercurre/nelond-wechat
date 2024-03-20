import { mzaioRequest } from '../utils/index'
export * from './project'
export * from './device'
export * from './space'
export * from './user'
export * from './ota'
export * from './scene'
export * from './meiju'

/**
 * 用户登录
 * @param data.code 微信登录动态令牌
 * @param data.jsCode 获取手机的动态令牌
 * @param data.captcha 激活验证码
 */
export async function login(data: { jsCode?: string; code?: string; captcha?: string }) {
  return await mzaioRequest.post<User.UserInfo>({
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/auth/wx/login',
    data,
  })
}

// 测试网络连接状态用
export async function peekNetwork() {
  return await mzaioRequest.post({
    log: false,
    loading: false,
    isDefaultErrorTips: false,
    url: '/',
    timeout: 2000,
  })
}
