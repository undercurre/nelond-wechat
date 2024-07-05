import { mzaioRequest } from '../utils/index'

/**
 * 查询用户信息
 * @param.projectId
 * @param.userId 为空即查询本用户
 * @param.roleLevel
 */
export async function queryUserInfo(params: { projectId: string; userId?: string; roleLevel: number }) {
  return await mzaioRequest.post<User.UserInfo>({
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/user/account/info',
    data: { params },
  })
}

/**
 * 编辑用户基础信息
 */
export async function updateUserInfo(data: Partial<User.UserInfo>) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/user/account/updateUserInfo',
    data,
  })
}

/**
 * 解析微信二维码接口
 */
export async function queryWxImgQrCode(imgUrl: string) {
  return await mzaioRequest.post<{ qrCodeUrl: string }>({
    log: true,
    loading: true,
    url: '/v1/mzgd/cl/user/queryWxImgQrCode',
    data: {
      qrCodeDownloadUrl: imgUrl,
    },
  })
}

/**
 * 获取oss上传地址接口
 */
export async function getUploadFileForOssInfo(fileName: string) {
  return await mzaioRequest.post<{ certification: string; downloadUrl: string; uploadUrl: string }>({
    log: false,
    loading: false,
    url: '/v1/mzgd/cl/user/uploadFileForOss',
    data: {
      fileName,
    },
  })
}

/**
 * 美智用户二维码确认授权接口
 */
export async function authQrcode(qrcode: string) {
  return await mzaioRequest.post({
    log: true,
    loading: false,
    url: '/v1/mzgd/cl/user/mzgdUserQrcodeAuthorize',
    data: {
      qrcode,
    },
  })
}

/**
 * 获取验证码接口
 */
export async function getCaptcha(data: { mobilePhone: string }) {
  return await mzaioRequest.post({
    log: true,
    loading: true,
    url: '/v1/mzgd/cl/auth/get/captcha',
    data,
  })
}
