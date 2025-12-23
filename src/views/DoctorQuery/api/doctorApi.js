import api from '@/utils/api'

/**
 * 获取医生列表
 * @param {Object} data - 查询参数
 * @param {string} data.filter_name - 筛选条件名称 (depart/title/none)
 * @param {string} data.filter_value - 筛选条件值
 * @param {number} data.page - 页码
 * @param {number} data.num - 每页数量
 * @returns {Promise<Object>} 医生列表数据
 */
export const getDoctors = async (data) => {
  const response = await api.post('/admin/getDoctors', data)
  return response
}

/**
 * 获取单个医生详细信息
 * @param {string} userId - 用户ID（医生ID）
 * @returns {Promise<Object>} 医生详细信息
 */
export const getDoctor = async (userId) => {
  console.log('获取医生详情请求参数:', userId)
  // 根据API文档，参数名应该是doctorId，但根据实际数据结构，使用的是userId
  const response = await api.get('/admin/getDoctor', { doctorId: userId })
  return response
}

/**
 * 更新医生详细信息
 * @param {Object} doctorData - 医生信息
 * @param {string} doctorData.userName - 医生姓名
 * @param {string} doctorData.userId - 医生ID
 * @param {string} doctorData.userGender - 性别
 * @param {string} doctorData.userAccount - 账号
 * @param {string} doctorData.userEmail - 邮箱
 * @param {string} doctorData.userPassword - 密码
 * @param {string} doctorData.userPhone - 电话
 * @param {string} doctorData.title - 职称名称
 * @param {string} doctorData.doctorDepart - 科室名称
 * @param {string} doctorData.doctorStatus - 状态
 * @param {string} doctorData.doctorDetails - 医生详情
 * @param {string} doctorData.doctorSpeciality - 专长
 * @param {string} doctorData.clinicId - 诊所ID
 * @returns {Promise<Object>} 更新结果
 */
export const updateDoctor = async (doctorData) => {
  // 根据接口文档，确保使用正确的字段名
  const updateData = {
    userName: doctorData.userName,
    userId: doctorData.userId,
    userGender: doctorData.userGender,
    userAccount: doctorData.userAccount,
    userEmail: doctorData.userEmail,
    userPassword: doctorData.userPassword,
    userPhone: doctorData.userPhone,
    title: doctorData.title,
    doctorDepart: doctorData.doctorDepart,
    doctorStatus: doctorData.doctorStatus,
    doctorDetails: doctorData.doctorDetails || '',
    doctorSpeciality: doctorData.doctorSpeciality || '',
    clinicId: doctorData.clinicId
  }

  console.log('updateDoctor请求参数:', updateData)
  console.log('doctorDetails字段状态:', typeof updateData.doctorDetails, '值:', updateData.doctorDetails)
  console.log('doctorSpeciality字段状态:', typeof updateData.doctorSpeciality, '值:', updateData.doctorSpeciality)

  const response = await api.post('/admin/updateDoctor', updateData)
  console.log('updateDoctor响应:', response)
  return response
}

/**
 * 获取科室选项列表
 * @returns {Promise<Array<{id: string, name: string}>>} 科室选项列表
 */
export const getDepartmentOptions = async () => {
  return api.get('/admin/options/departments')
}

/**
 * 获取职称选项列表
 * @returns {Promise<Array<{value: string, label: string}>>} 职称选项列表
 */
export const getTitleOptions = async () => {
  return api.get('/admin/options/getTitleOptions')
}