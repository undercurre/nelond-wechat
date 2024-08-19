import { isHttpsDomain, getMzaioDomain } from './index'

// 小程序（静态资源存放位置根目录）
export const ossDomain = 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/nelond' // ossFile根目录

export function getImageBaseUrl() {
  return !isHttpsDomain() ? `${getMzaioDomain()}/ossFile` : ossDomain
}
export const sceneImgDir = () => `${getImageBaseUrl()}/auto-scene`

export const defaultImgDir = () => `${getImageBaseUrl()}/default-img`

export const productImgDir = () => `${getImageBaseUrl()}/product-icon` // 产品图

export const ShareImgUrl = () => `${defaultImgDir()}/welcome.jpg`

export const guideDir = () => `${getImageBaseUrl()}/connect-guide`
