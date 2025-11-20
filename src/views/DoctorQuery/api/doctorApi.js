import api from '@/utils/api'
export const getDoctorListWithFilter = async (data) => {
  // GET 请求传参必须用 params
  const response = await api.post('/admin/getDoctors', data)
  console.log(response);
  // 直接返回响应，因为api拦截器已经处理了返回数据结构
  return response;
}
/**
 * @description 获取科室选项列表
 * @returns {Promise<Array<{label: string, value: string}>>} 科室选项列表
 */
export const getDepartmentOptions = async () => {
  return api.get('/admin/options/departments');
}
/**
 * @description 获取职称选项列表
 * @returns {Promise<Array<{value: string, label: string}>>} 职称选项列表
 */
export const getTitleOptions = async () => {
  return api.get('/admin/options/getTitleOptions');
}
// 获取单个医生信息
export const getDoctorById = (doctorId) => {
  return api.get('/admin/getDoctor', { params: { doctorId } })
}

// 更新医生信息
export const updateDoctor = (doctorData) => {
  return api.post('/admin/updateDoctor', doctorData)
}



