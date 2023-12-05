import { requestService } from '../../utils/requestService'

//模拟数据
const service = {
  getApiResponse: (apiName, data) => {
    return new Promise((resolve, reject) => {
      requestService.request(apiName, data).then(
        (resp) => {
          if (resp.data.code == 0) {
            resolve(resp.data.data)
          } else {
            reject(resp)
          }
        },
        (error) => {
          reject(error)
        },
      )
    })
  },
  getWxApiPromise: (api, options = {}) => {
    const fn = typeof api === 'function' ? api : wx[api]
    if (typeof fn !== 'function') {
      throw new Error(`wx.${api} is not a function.`)
    }
    return new Promise((resolve, reject) => {
      const success = (response) => resolve(response)
      const fail = (error) => reject(error)
      fn.call(wx, Object.assign({}, options, { success, fail }))
    })
  },
}
export { service }
