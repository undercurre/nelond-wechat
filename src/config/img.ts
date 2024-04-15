// import { getEnv } from './index'

// 小程序（图片存放）
export const ossDomain = 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com' // ossFile根目录
// const imgBaseUrl = `${domain}/${getEnv() === 'sit' || getEnv() == 'dev' ? 'sit' : 'prod'}`
export const sceneImgDir = `${ossDomain}/nelond/auto-scene`

export const defaultImgDir = `${ossDomain}/nelond/default-img`

export const productImgDir = `${ossDomain}/nelond/product-icon` // 产品图

export const ShareImgUrl = `${defaultImgDir}/welcome.jpg`

export const imgList = {
  success: `${defaultImgDir}/success.png`,
  error: `${defaultImgDir}/error.png`,
}
