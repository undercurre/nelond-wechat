import { baseRequest, BaseRequestOptions } from './baseRequest'
import storage from '../storage'
import { getMzaioBaseURL, TOKEN_EXPIRED } from '../../config/index'
import { Logger, logout } from '../../utils/index'

// 后端默认返回格式
type mzaioResponseRowData<T extends AnyResType = AnyResType> = {
  code: number
  msg: string
  success: boolean
  result: T
}

export interface IApiRequestOption {
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
}

type mzaioRequest = <T extends AnyResType>(options: BaseRequestOptions<T>) => Promise<mzaioResponseRowData<T>>

// 封装好http method的请求实例
type mzaioRequestWithMethod = mzaioRequest & {
  get: mzaioRequest
  post: mzaioRequest
  put: mzaioRequest
  delete: mzaioRequest
}

const mzaioRequest: mzaioRequest = function <T extends AnyResType>(options: BaseRequestOptions<T>) {
  // 按需添加header
  const header = {
    Authorization: 'Bearer ' + storage.get('token', ''),
  }

  if (options.header) {
    options.header = {
      ...header,
      ...options.header,
    }
  } else {
    options.header = header
  }

  // 拼接上美智云的基础地址
  options.url = getMzaioBaseURL() + options.url

  // 后续考虑选择用nanoid生成reqId，但是微信小程序不支持浏览器的crypto API，无法使用nanoid和uuid包。
  const reqId = Date.now()
  options.data = Object.assign(
    {
      reqId: reqId.toString(),
      frontendType: 'WeApp',
      systemSource: storage.get<string>('system'),
      timestamp: reqId,
    },
    options.data,
  )

  // 调整请求超时时间，默认10秒
  if (!options.timeout) {
    options.timeout = 10000
  }

  const start = Date.now()

  return baseRequest<T>({
    ...options,
    generalSuccessHandler: (result) => {
      // token过期，跳转到登录
      if ((result.data as unknown as { code: number }).code === TOKEN_EXPIRED) {
        logout()
      } else if (!(result.data as unknown as { success: boolean }).success && options.log) {
        Logger.error('接口已响应，但返回异常', options, result.data)
      }

      const cost_time = Date.now() - start

      wx.reportEvent('wxdata_perf_monitor', {
        wxdata_perf_monitor_id: options.url,
        wxdata_perf_monitor_level: 0,
        wxdata_perf_error_code: (result.data as IAnyObject).code,
        wxdata_perf_cost_time: cost_time,
        wxdata_perf_error_msg: (result.data as IAnyObject).msg || '',
      })

      return result.data
    },
    generalFailHandler: (error) => {
      const cost_time = Date.now() - start

      wx.reportEvent('wxdata_perf_monitor', {
        wxdata_perf_monitor_id: options.url,
        wxdata_perf_monitor_level: 0,
        wxdata_perf_error_code: -1,
        wxdata_perf_cost_time: cost_time,
        wxdata_perf_error_msg: error.errMsg || '',
      })

      return {
        code: -1,
        msg: error.errMsg,
        success: false,
      } as unknown as T
    },
  }) as unknown as Promise<mzaioResponseRowData<T>>
}

const mzaioRequestWithMethod = mzaioRequest as mzaioRequestWithMethod

// 仿照axios，添加get post put delete方法
;(['get', 'post', 'put', 'delete'] as const).forEach((method) => {
  mzaioRequestWithMethod[method] = (options) => {
    return mzaioRequest({
      isDefaultErrorTips: true,
      ...options,
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE',
    })
  }
})

export { mzaioRequestWithMethod as mzaioRequest }
