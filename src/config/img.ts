// import { getEnv } from './index'

// 小程序（图片存放）
export const ossDomain = 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com' // ossFile根目录
// const imgBaseUrl = `${domain}/${getEnv() === 'sit' || getEnv() == 'dev' ? 'sit' : 'prod'}`
export const ShareImgUrl = `${ossDomain}/homlux/welcome.png`

export const meijuImgDir = `${ossDomain}/homlux/meiju`

export const sceneImgDir = `${ossDomain}/homlux/auto-scene`

export const defaultImgDir = `${ossDomain}/nelond/default-img`

export const productImgDir = `${ossDomain}/homlux/product-icon` // 产品图

// https://www.smartmidea.net/projects/sit/meiju-lite-assets/shareImg/meiju/addDeviceAboutImg/ic_2.4GHzremind@3x.png
// 美居配网迁移的图片
export const imgList = {
  linkGuide: `${meijuImgDir}/addDevice/wifi_img_lianjiezhiyin.png`,
  wifiConnect: `${meijuImgDir}/addDevice/wifi_ic_img_connect.png`,
  questino: `${meijuImgDir}/addDevice/ic_2.4GHzremind@3x.png`,
  success: `${defaultImgDir}/success.png`,
  error: `${defaultImgDir}/error.png`,
}
