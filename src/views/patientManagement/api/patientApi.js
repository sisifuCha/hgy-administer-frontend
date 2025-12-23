import api from '@/utils/api' // 导入封装好的axios实例

/**
 * @description 分页获取患者列表
 * @param {object} params - 分页参数，如 { pageNum: 1, pageSize: 10 }
 */
export const getPatientList = async (params) => {
  return api.post('/admin/getPatients', params)
}

/**
 * @description 根据ID获取单个患者详细信息
 * @param {string} patientId - 患者ID
 */
export const getPatientDetail = async (patientId) => {
  return api.get('/admin/getPatient', { id: patientId })
}