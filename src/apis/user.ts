import { mzaioRequest } from '../utils/index'

/**
 * 查询用户信息
 */
export async function queryUserInfo() {
  return await mzaioRequest.post<User.UserInfo>({
    log: true,
    loading: false,
    url: '/v1/mzgd/user/queryWxUserInfo',
  })
}

/**
 * 解析微信二维码接口
 */
export async function queryWxImgQrCode(imgUrl: string) {
  return await mzaioRequest.post<{ qrCodeUrl: string }>({
    log: true,
    loading: true,
    url: '/v1/mzgd/user/queryWxImgQrCode',
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
    url: '/v1/mzgd/user/uploadFileForOss',
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
    url: '/v1/mzgd/user/mzgdUserQrcodeAuthorize',
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
    loading: false,
    url: '/v1/mzgd/cl/auth/get/captcha',
    data,
  })
}
