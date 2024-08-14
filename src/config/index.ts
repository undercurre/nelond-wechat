export * from './project'
export * from './scene'
export * from './code'
export * from './device'
export * from './light'
export * from './img'
export * from './user'
export * from './doc'

let env: ENV_TYPE = 'dev'

export const mzaioDomain: ConfigWithEnv<string> = {
  dev: 'test.meizgd.com',
  sit: 'test.meizgd.com',
  prod: 'mzaio.meizgd.com',
  Lan: '',
}

export const storageExpire = 60 * 60 * 24 * 30

// export const QQMapConfig = {
//   key: 'L7HBZ-UZ6EU-7J5VU-BR54O-3ZDG5-6CFIC',
//   sig: 'W9RrPrVIxGPyuKEzzS76ktDxvN3zxxyJ',
// }

/**
 * 获取当前云端环境
 */
export function getEnv() {
  return env
}

/**
 * 获取美智云云端域名地址
 */
export function getMzaioDomain() {
  // 如不包含http前缀，自动补全
  return mzaioDomain[env].includes('http') ? mzaioDomain[env] : `${isLan() ? 'http' : 'https'}://${mzaioDomain[env]}`
}

export function isHttpsDomain() {
  const domain = getMzaioDomain()
  return domain.includes('https')
}

export function isLan() {
  return env === 'Lan'
}

/**
 * 判断是否dount多端app编译环境
 */
export function isNative() {
  let isNative = false
  // #if NATIVE
  isNative = true
  // #endif

  return isNative
}

/**
 * 获取美智云云端地址,包括上下文
 * // dev: `https://${mzaioDomain.dev}/mzaio`,
  // sit: `https://${mzaioDomain.sit}/mzaio`,
  // prod: `https://${mzaioDomain.prod}/mzaio`,
  // Lan: `https://${mzaioDomain.Lan}/mzaio`,
 */
export function getMzaioBaseURL() {
  return `${getMzaioDomain()}/mzaio`
}

/**
 * 美智云后端websocket地址
 * dev: `wss://${mzaioDomain.dev}/mzaio/v1/mzgd/cl/wss`,
  sit: `wss://${mzaioDomain.sit}/mzaio/v1/mzgd/cl/wss`,
  prod: `wss://${mzaioDomain.prod}/mzaio/v1/mzgd/cl/wss`,
  Lan: `wss://${mzaioDomain.Lan}/mzaio/v1/mzgd/cl/wss`,
 */
export function getMzaioWSURL() {
  const domain = getMzaioDomain()
  const isHttps = isHttpsDomain()

  const server = domain.replace('https://', '').replace('http://', '')
  return `${!isHttps ? 'ws' : 'wss'}://${server}/mzaio/v1/mzgd/cl/wss`
}

export function setEnv(val: ENV_TYPE) {
  env = val
}

/**
 * 返回内嵌H5页面的基本路径
 */
export function getH5BaseUrl() {
  return `https://${mzaioDomain[env]}/meiju`
}

// wx的环境名称 --> 云端环境名称
export const envMap = {
  develop: 'dev',
  trial: 'dev',
  release: 'prod',
} as const
