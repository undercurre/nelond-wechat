import dayjs from 'dayjs'

const log = wx.getRealtimeLogManager()

/**
 * @name 日志工具
 * @description Logger.debug Logger.error, Logger.log 同时上报到We分析
 */
export const Logger = {
  debug(...args: unknown[]) {
    console.warn(`${dayjs().format('HH:mm:ss.SSS')} |`, ...args)
    log.warn(args)
  },
  console(...args: unknown[]) {
    console.log(...args)
  },
  trace(...args: unknown[]) {
    console.log(`${dayjs().format('HH:mm:ss.SSS')} |`, ...args)
  },
  log(...args: unknown[]) {
    console.log(...args)
    log.info(args)
  },
  error(...args: unknown[]) {
    console.error(...args)
    log.error(args)
  },
}
