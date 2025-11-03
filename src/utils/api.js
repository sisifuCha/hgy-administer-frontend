// src/utils/api.js
import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api', // 你的后端基础地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许跨域发送 cookie
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    if (response.data && response.data.code !== undefined) {
      if (response.data.code === 200) {
        return response.data
      } else {
        return Promise.reject(new Error(response.data.message || 'Error'))
      }
    }
    return response.data
  },
  error => {
    console.error('API 请求错误:', error)
    return Promise.reject(error)
  }
)

export default api
