import api from '@/utils/api'

/**
 * @description 获取患者列表（分页）
 * @param {object} params - 分页参数，如 { page: 1, num: 10 }
 */
export const getPatientList = (params) => {
  return api.get('/admin/patients', { params })
}

/**
 * @description 根据ID获取单个患者信息
 * @param {string} patientId
 */
export const getPatientById = (patientId) => {
  return api.get(`/admin/patients/${patientId}`)
}

/**
 * @description 更新患者信息
 * @param {string} patientId
 * @param {object} patientData
 */
export const updatePatient = (patientId, patientData) => {
  return api.put(`/admin/patients/${patientId}`, patientData)
}

/**
 * @description 获取待认证的患者申请列表
 */
export const getPendingAuthRequests = () => {
  return api.get('/admin/patients/auth/pending')
}

/**
 * @description 批准患者的认证申请
 * @param {string} requestId
 */
export const approveAuthRequest = (requestId) => {
  return api.post(`/admin/patients/auth/${requestId}/approve`)
}

/**
 * @description 驳回患者的认证申请
 * @param {string} requestId
 */
export const rejectAuthRequest = (requestId) => {
  return api.post(`/admin/patients/auth/${requestId}/reject`)
}
