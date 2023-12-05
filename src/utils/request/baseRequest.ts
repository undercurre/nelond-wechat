import { hideLoading, showLoading, Logger, shouNoNetTips } from '../index'

export type BaseRequestOptions<T extends AnyResType> = WechatMiniprogram.RequestOption<T> & {
  /**
   * 可以传入是否展示loading，自定义成功或者失败回调
   */
  loading?: boolean
  /**
   * 是否打印请求和响应
   */
  log?: boolean

  /**
   * 是否使用默认错误提示，默认true
   */
  isDefaultErrorTips?: boolean
  /**
   * 单独接口请求成功处理
   */
  successHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => T
  /**
   * 单独接口请求失败处理
   */
  failHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => T
  /**
   * 通用接口请求成功处理
   */
  generalSuccessHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => T
  /**
   * 通用接口请求失败处理
   */
  generalFailHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => T
}

// 基本的请求方法实例
type BaseRequest = <T extends AnyResType>(requestOption: BaseRequestOptions<T>) => Promise<T>

// 封装好http method的请求实例
type BaseRequestWithMethod = BaseRequest & {
  get: BaseRequest
  post: BaseRequest
  put: BaseRequest
  delete: BaseRequest
}

const baseRequest: BaseRequest = function <T extends AnyResType = AnyResType>(requestOption: BaseRequestOptions<T>) {
  return new Promise<T>((resolve) => {
    // 这里配置自定义的header
    const header = {}
    if (requestOption.header) {
      requestOption.header = {
        ...header,
        ...requestOption.header,
      }
    } else {
      requestOption.header = header
    }
    // 是否显示loading，显示mask用于阻止用户多次点击
    if (requestOption.loading) {
      showLoading()
    }

    const start = Date.now()
    const successHandler = requestOption.successHandler || requestOption.generalSuccessHandler

    // 请求成功回调处理
    requestOption.success = (result) => {
      if (requestOption.loading) {
        hideLoading()
      }

      // 是否打印请求结果
      if (requestOption.log) {
        const cost_time = Date.now() - start

        Logger.console(`✔ ${requestOption.url} 用时 ${cost_time} ms\n`, result.data)
      }

      // 如果有传入successHandler，就使用successHandler进行特殊处理
      const afterProcessResult = successHandler ? successHandler(result) : result.data

      resolve(afterProcessResult)
    }

    // 请求失败回调处理
    const failHandler = requestOption.failHandler || requestOption.generalFailHandler

    requestOption.fail = (err) => {
      if (requestOption.loading) {
        hideLoading()
      }

      if (requestOption.log) {
        Logger.error('✘请求URL:' + requestOption.url + ' 失败，原因：' + err.errMsg, requestOption.data)
      }

      if (requestOption.isDefaultErrorTips) {
        shouNoNetTips()
      }

      const data = failHandler ? failHandler(err) : (err as unknown as T)
      resolve(data)
    }

    // 请求发起时的提示
    if (requestOption.log) {
      Logger.console(`» 发起请求 ${requestOption.url} 参数：\n`, requestOption.data)
    }
    wx.request({
      ...requestOption,
    })
  })
}

const baseRequestWithMethod = baseRequest as BaseRequestWithMethod

// 仿照axios，添加get post put delete方法
;(['get', 'post', 'put', 'delete'] as const).forEach((method) => {
  baseRequestWithMethod[method] = (requestOption) => {
    return baseRequest({
      ...requestOption,
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    })
  }
})

export { baseRequestWithMethod as baseRequest }
