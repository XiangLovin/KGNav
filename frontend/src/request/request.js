// 引入 axios
import axios from "axios";

// 创建 axios 实例
const request = axios.create({
  // baseURL: '/wiki',
  timeout: 3000
})

// 请求拦截处理
request.interceptors.request.use(
  config => {
    config.headers = {
      'Content-Tpye': 'application/json; charset=utf-8'
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// 相应拦截处理
request.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

export default function (method, url, data = null) {
  method = method.toLowerCase()
  if (method === 'post') {
    return request.post(url, data)
  } else if (method === 'get') {
    return request.get(url, { params: data })
  } else if (method === 'delete') {
    return request.delete(url, { params: data })
  } else if (method === 'put') {
    return request.put(url, data)
  } else {
    console.error('Unkown Method' + method)
    return false
  }
}
