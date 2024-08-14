import { storageExpire } from '../config/index'

interface Storage {
  readonly prefixKey: string
  getKey(key: string): string
  set(
    key: string,
    value: IAnyObject | string | number | boolean, // 原生类型、Date、及能够通过JSON.stringify序列化的对象
    expire?: number | null, // 缓存的时间，单位：秒
    encrypt?: boolean,
  ): void | Promise<WechatMiniprogram.GeneralCallbackResult> // 异步操作Storage支持加密，支持promise，加密最低版本2.21.3
  get<T, P = undefined>(key: string, def?: P, encrypt?: boolean): T | P | Promise<T | P | undefined> | undefined // encrypt需要set和get同时为true
  remove(key: string): void | Promise<WechatMiniprogram.GeneralCallbackResult>
  clear(): void | Promise<WechatMiniprogram.GeneralCallbackResult>
}

export const createStorage = ({ prefixKey = '', sync = true, defaultCacheTime = storageExpire } = {}): Storage => {
  return {
    prefixKey: prefixKey,
    getKey(key: string) {
      return `${this.prefixKey}${key}`.toUpperCase()
    },
    set(
      key: string,
      value: IAnyObject | string | number | boolean,
      expire = defaultCacheTime as number,
      encrypt = false,
    ) {
      const stringData = JSON.stringify({
        value,
        expire: expire !== null ? new Date().getTime() + expire * 1000 : null,
      })
      if (sync) {
        return wx.setStorageSync(this.getKey(key), stringData)
      }
      return wx.setStorage({
        key: this.getKey(key),
        data: stringData,
        encrypt,
      })
    },
    get<T, P>(key: string, def?: P, encrypt = false) {
      if (sync) {
        const item = wx.getStorageSync(this.getKey(key))
        if (item) {
          try {
            const data = JSON.parse(item)
            const { value, expire } = data
            // 在有效期内直接返回
            if (expire === null || expire >= Date.now()) {
              return value as T
            }
            this.remove(this.getKey(key))
          } catch (e) {
            return def
          }
        }
        return def
      }
      return new Promise<T | P | undefined>((resolve) => {
        wx.getStorage({
          key: this.getKey(key),
          encrypt,
          fail() {
            resolve(def)
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data)
              const { value, expire } = data
              // 在有效期内直接返回
              if (expire === null || expire >= Date.now()) {
                return resolve(value as T)
              }
              this.remove(this.getKey(key))
            } catch (e) {
              resolve(def)
            }
          },
        })
      })
    },
    remove(key: string) {
      try {
        if (sync) {
          return wx.removeStorageSync(this.getKey(key))
        }
        return wx.removeStorage({
          key: this.getKey(key),
        })
      } catch (e) {
        return
      }
    },
    clear() {
      if (sync) {
        return wx.clearStorageSync()
      }
      return wx.clearStorage()
    },
  }
}

export const storage = createStorage()

export const asyncStorage = createStorage({ sync: true })

export default storage
