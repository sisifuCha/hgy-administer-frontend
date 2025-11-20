import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import router from '@/router/index.js'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 后端API基础URL，根据实际情况修改
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// 请求拦截器
let loadingInstance = null
service.interceptors.request.use(
  config => {
    // 显示加载动画
    if (config.showLoading !== false) {
      loadingInstance = ElLoading.service({
        text: '请求中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }

    // 添加token到请求头
    const token = localStorage.getItem('token')
    console.log('🚀 请求拦截器：获取到的 token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 记录请求日志
    console.log('🚀 API Request:', {
      url: config.baseURL + config.url,
      method: config.method.toUpperCase(),
      data: config.data,
      params: config.params
    })

    return config
  },
  error => {
    // 关闭加载动画
    if (loadingInstance) {
      loadingInstance.close()
    }
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 关闭加载动画
    if (loadingInstance) {
      loadingInstance.close()
    }

    // 记录响应日志
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })

    // 检查业务状态码
    const { code, message, data } = response.data

    // 根据后端返回的状态码处理
    if (code === 200 || code === '200') {
      // 成功响应，返回数据
      return data
    } else if (code === 401 || code === '401') {
      // 未授权，清除token并跳转到登录页
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(new Error(message || '未授权'))
    } else {
      // 其他业务错误
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message || '请求失败'))
    }
  },
  error => {
    // 关闭加载动画
    if (loadingInstance) {
      loadingInstance.close()
    }

    console.error('❌ Response Error:', error)

    // 处理HTTP错误状态码
    let errorMessage = '网络错误，请稍后重试'

    if (error.response) {
      const { status, statusText } = error.response
      switch (status) {
        case 400:
          errorMessage = '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          localStorage.removeItem('token')
          router.push('/login');
          break
        case 403:
          errorMessage = '拒绝访问'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 502:
          errorMessage = '网关错误'
          break
        case 503:
          errorMessage = '服务不可用'
          break
        case 504:
          errorMessage = '网关超时'
          break
        default:
          errorMessage = `请求失败: ${status} ${statusText}`
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络设置'
    }

    // 显示错误消息
    ElMessage.error(errorMessage)

    return Promise.reject(error)
  }
)

// 封装常用的请求方法
const api = {
  // GET请求
  get(url, params = {}, config = {}) {
    return service({
      url,
      method: 'GET',
      params,
      ...config
    })
  },

  // POST请求
  post(url, data = {}, config = {}) {
    return service({
      url,
      method: 'POST',
      data,
      ...config
    })
  },

  // PUT请求
  put(url, data = {}, config = {}) {
    return service({
      url,
      method: 'PUT',
      data,
      ...config
    })
  },

  // DELETE请求
  delete(url, params = {}, config = {}) {
    return service({
      url,
      method: 'DELETE',
      params,
      ...config
    })
  },

  // PATCH请求
  patch(url, data = {}, config = {}) {
    return service({
      url,
      method: 'PATCH',
      data,
      ...config
    })
  },

  // 文件上传
  upload(url, formData, config = {}) {
    return service({
      url,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  },

  // 文件下载
  download(url, params = {}, config = {}) {
    return service({
      url,
      method: 'GET',
      params,
      responseType: 'blob',
      ...config
    })
  },

  // 原始axios实例（用于特殊需求）
  instance: service
}

// 兼容原有的调用方式
export default api

// 同时导出service实例，供特殊场景使用
export { service }
