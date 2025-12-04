import api from '@/utils/api'
import axios from "axios";

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
  return api.get('/admin/GetSchedulesHistory', params)
}

/**
 * @description 根据周次获取排班信息
 * @param {Object} params - 查询参数
 * @param {number} params.week - 周次标识：0=当前周，1=下一周
 * @param {string} params.departName - 科室名称
 * @returns {Promise<Array>} 排班信息列表
 */
export const getSchedules = (params) => {
  return api.get('/admin/getSchedules', params)
}

/**
 * @description 创建下周排班
 * @param {Object} scheduleData - 排班数据
 * @param {Array} scheduleData.mon - 周一排班列表
 * @param {Array} scheduleData.tue - 周二排班列表
 * @param {Array} scheduleData.wed - 周三排班列表
 * @param {Array} scheduleData.thu - 周四排班列表
 * @param {Array} scheduleData.fri - 周五排班列表
 * @param {Array} scheduleData.sat - 周六排班列表
 * @param {Array} scheduleData.sun - 周日排班列表
 * @param {number} week - 周次标识：0=当前周，1=下一周
 * @returns {Promise<void>}
 *
 * 请求格式说明：
 * - URL: POST /admin/CreateNextWeekSchedule?week=1
 * - 请求体: { mon: [...], tue: [...], ... }
 * - URL参数: week (从查询字符串获取)
 */
export const createNextWeekSchedule = (scheduleData, week) => {
  console.log('📤 API层 - createNextWeekSchedule 调用参数:', {
    scheduleData,
    week,
    requestUrl: `/admin/CreateNextWeekSchedule?week=${week}`
  })

  return api.post('/admin/CreateNextWeekSchedule', scheduleData, {
    params: { week }
  })
}

/**
 * @description 删除排班（停诊单个排班）
 * @param {Object} params - 查询参数
 * @param {string} params.schedule_id - 要删除的排班记录ID
 * @param {string} params.reason - 停班的原因
 * @returns {Promise<void>}
 */
export const deleteSchedule = (params) => {
  return api.post(`/admin/stopSingle/Schedule`, {}, { params })
}

/**
 * @description 批量设置排班为停诊
 * @param {Object} data - 批量停诊数据
 * @param {Array<string>} data.doc_ids - 医生ID数组
 * @param {Object} data.start_time - 开始时间 {date: 'YYYY-MM-DD', template_id: 'TIME0001'}
 * @param {Object} data.end_time - 结束时间 {date: 'YYYY-MM-DD', template_id: 'TIME0002'}
 * @param {string} data.reason - 批量处理的原由
 * @returns {Promise<void>}
 */
export const stopBatchSchedule = (data) => {
  return api.post('/admin/stopBatchSchedule', data)
}

/**
 * @description 提交调班/请假申请（新接口）
 * @param {Object} data - 调班申请数据
 * @param {string} data.doctorId - 医生ID（必填）
 * @param {string} data.originalScheduleId - 原班次ID（必填）
 * @param {number} data.changeType - 调整类型（必填）：0-调班, 1-请假
 * @param {string} [data.targetDate] - 目标日期（调班时必填，格式：YYYY-MM-DD）
 * @param {number} [data.targetTimePeriod] - 目标时段编号（调班时必填）
 * @param {string} [data.targetDoctorId] - 目标医生ID（调班时可选）
 * @param {number} [data.daysOff] - 请假天数（请假时必填）
 * @param {string} data.reason - 调整原因（必填）
 * @returns {Promise<void>}
 */
// export const submitScheduleChangeRequest = (data) => {
//   return api.post('/doctor/schedule_change_request', data)
// }

export const submitScheduleChangeRequest = (data) => {
  return axios.post('http://localhost:8080/doctor/schedule_change_request', data, {
    withCredentials: true
  })
}

/**
 * @description 批量延后排班
 * @param {Object} data - 批量延后数据
 * @param {Array<string>} data.doc_ids - 医生ID数组（必填）
 * @param {number} data.delay_days - 延后天数（必填）
 * @param {Object} data.start_time - 开始时间（必填）
 * @param {string} data.start_time.date - 开始日期（格式：YYYY-MM-DD）
 * @param {string} data.start_time.template_id - 开始时段编号（如：TIME0001）
 * @param {Object} data.end_time - 结束时间（必填）
 * @param {string} data.end_time.date - 结束日期（格式：YYYY-MM-DD）
 * @param {string} data.end_time.template_id - 结束时段编号（如：TIME0001）
 * @param {string} data.reason - 延后原因（必填）
 * @returns {Promise<void>}
 */
export const batchDelaySchedule = (data) => {
  return api.post('/admin/batchDelay', data)
}

/**
 * @description 查询医生调班申请列表（管理员端）
 * @param {Object} params - 查询参数
 * @param {string} params.status - 申请状态：PENDING/APPROVED/REJECTED/ALL，必选，默认PENDING
 * @param {string} params.type - 申请类型：SHIFT_CHANGE/LEAVE/ALL，必选，默认ALL
 * @param {string} [params.doc_id] - 医生ID，可选，按医生ID查询
 * @param {string} [params.targetDateFrom] - 起始日期，可选，格式YYYY-MM-DD
 * @param {string} [params.targetDateTo] - 结束日期，可选，格式YYYY-MM-DD，需要和From同时出现
 * @param {number} params.page - 当前页码，必选
 * @param {number} params.pageSize - 每页条数，必选
 * @returns {Promise<Object>} 返回分页的申请列表
 *
 * 返回数据结构：
 * {
 *   page: number,       // 当前页码
 *   pageSize: number,   // 每页条数
 *   total: number,      // 总记录数
 *   items: Array<{      // 申请记录列表
 *     id: number,                    // 申请ID
 *     doctorId: number,              // 医生ID
 *     doctorName: string,            // 医生姓名
 *     originalScheduleId: number,    // 原始排班ID
 *     targetScheduleId: number|null, // 目标排班ID（调班时存在）
 *     reason: string,                // 申请原因
 *     status: string,                // 申请状态：PENDING/APPROVED/REJECTED
 *     targetDate: string,            // 目标排班日期，如：2025-12-10
 *     type: string,                  // 申请类型：SHIFT_CHANGE/LEAVE
 *     leaveLength: number|null       // 请假长度（仅请假类型使用）
 *   }>
 * }
 */
export const getShiftRequests = (params) => {
  return api.get('/admin/shift-requests', params)
}
