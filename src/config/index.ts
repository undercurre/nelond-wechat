export * from './project'
export * from './scene'
export * from './code'
export * from './device'
export * from './light'
export * from './img'
export * from './user'

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
 * 获取美智云云端地址
 * // dev: `https://${mzaioDomain.dev}/mzaio`,
  // sit: `https://${mzaioDomain.sit}/mzaio`,
  // prod: `https://${mzaioDomain.prod}/mzaio`,
  // Lan: `https://${mzaioDomain.Lan}/mzaio`,
 */
export function getMzaioBaseURL() {
  return `https://${mzaioDomain[env]}/mzaio`
}

/**
 * 美智云后端websocket地址
 * dev: `wss://${mzaioDomain.dev}/mzaio/v1/mzgd/cl/wss`,
  sit: `wss://${mzaioDomain.sit}/mzaio/v1/mzgd/cl/wss`,
  prod: `wss://${mzaioDomain.prod}/mzaio/v1/mzgd/cl/wss`,
  Lan: `wss://${mzaioDomain.Lan}/mzaio/v1/mzgd/cl/wss`,
 */
export function getMzaioWSURL() {
  return `wss://${mzaioDomain[env]}/mzaio/v1/mzgd/cl/wss`
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
