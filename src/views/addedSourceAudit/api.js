import api from '@/utils/api'

/**
 * 获取加号请求列表
 * @param {Object} params - 请求参数
 * @param {number} params.pageSize - 每页条数
 * @param {number} params.page - 页码
 * @returns {Promise}
 */
export const getAddedSourceList = (params = {}) => {
    return api.get('/admin/getAddedSource', params)
}

/**
 * 审批加号请求
 * @param {Object} data - 请求参数
 * @param {string} data.patient_id - 患者ID
 * @param {string} data.sch_id - 排班ID
 * @param {string} data.status - 审批状态
 * @returns {Promise}
 */
export const checkAddedSource = (data) => {
    return api.put('/admin/checkAddedSource', data)
}