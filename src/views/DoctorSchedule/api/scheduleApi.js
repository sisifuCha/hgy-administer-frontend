import api from '@/utils/api'

/**
 * @description 获取科室选项列表
 * @returns {Promise<Array<{label: string, value: string}>>} 科室选项列表
 */
export const getDepartmentOptions = async () => {
  return api({
    url: '/admin/options/departments',
    method: 'get'
  })
}

/**
 * @description 获取医生排班信息
 * @param {Object} params - 查询参数
 * @param {string} params.week - 周次标识：'current'或'next'
 * @param {string} params.departmentId - 科室ID
 * @returns {Promise<Array>} 排班信息列表
 */
export const getDoctorSchedule = async (params) => {
  return api.post('/admin/getDoctorSchedule', params)
}

/**
* @description 根据医生ID获取其未来的排班列表（用于调班选择）
* @param {string} doctorId
*/
export const getSchedulesByDoctorId = (doctorId) => {
  return api.get(`/admin/schedules/by-doctor/${doctorId}`)
}

/**
 * @description 提交调班/取消排班申请
 * @param {object} adjustmentData 调班表单数据
 */
export const requestScheduleAdjustment = (adjustmentData) => {
  return api.post('/admin/schedules/adjustments', adjustmentData)
}

/**
 * @description 获取待审批的调班申请列表
 */
export const getAdjustmentRequests = () => {
  return api.get('/admin/schedules/adjustments/pending')
}

/**
 * @description 批准一个调班申请
 * @param {string} requestId 申请ID
 */
export const approveAdjustment = (requestId) => {
  return api.post(`/admin/schedules/adjustments/${requestId}/approve`)
}

/**
 * @description 驳回一个调班申请
 * @param {string} requestId 申请ID
 */
export const rejectAdjustment = (requestId) => {
  return api.post(`/admin/schedules/adjustments/${requestId}/reject`)
}

/**
 * @description 获取指定科室的历史排班
 * @param {Object} params - 查询参数
 * @param {string} params.date - 日期（YYYY-MM-DD格式）
 * @param {string} params.depart_name - 科室名称
 * @returns {Promise<Object>} 历史排班数据
 */
export const getSchedulesHistory = (params) => {
  return api.get('/admin/GetSchedulesHistory', { params })
}
