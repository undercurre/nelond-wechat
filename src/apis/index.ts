import { mzaioRequest } from '../utils/index'
export * from './project'
export * from './device'
export * from './space'
export * from './user'
export * from './ota'
export * from './scene'
export * from './meiju'

/**
 * 微信用户登录
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

/**
 * 美智用户登录,手机+密码
 */
export async function loginByMz(data: { mobilePhone: string; password: string }) {
  const codeRes = await getVerifyCode()

  if (!codeRes.success) {
    return { success: false, code: -1, result: null }
  }

  return await mzaioRequest.post<User.UserInfo>({
    log: true,
    loading: true,
    url: '/v1/mzgd/cl/auth/web/login',
    data: {
      ...data,
      verifyCode: codeRes.result.verifyCode,
      verifyCodeKey: codeRes.result.verifyCodeKey,
    },
  })
}

/**
 * web端用户获取校验码
 */
export async function getVerifyCode() {
  return await mzaioRequest.post<{ verifyCode: string; verifyCodeKey: string }>({
    log: true,
    loading: true,
    url: '/v1/mzgd/cl/auth/get/verifyCode',
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

/**
 * 查询字典数据
 * @params type 字典类型 1：项目类型 2：角色类型
 */
export async function queryDictData(type = 1) {
  return await mzaioRequest.post<Project.DictItem[]>({
    isDefaultErrorTips: false,
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/user/queryDictData',
    data: { type },
  })
}
