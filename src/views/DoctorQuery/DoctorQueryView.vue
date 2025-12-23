<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDoctors, getDoctor, updateDoctor, getDepartmentOptions, getTitleOptions } from './api/doctorApi.js'

// 定义医生数据类型接口，与接口文档保持一致
interface Doctor {
  userName: string
  userId: string
  userGender: string
  userAccount: string
  userEmail: string
  userPassword: string
  userPhone: string
  doctorId?: string
  titleId: string
  clinicId: string
  doctorStatus: string
  doctorDepart: string
  doctor_id: string
  title?: string
  doctorDetails?: string
  doctorSpeciality?: string
}

// 响应式数据
const doctorList = ref<Doctor[]>([])
const loading = ref(false)
const searchParams = ref<string[]>([])
const editDoctor = ref<Doctor | null>(null)
const isEditDialogVisible = ref(false)
const editLoading = ref(false)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 查询选项
const docTitleOptions = ref<{ value: string; label: string }[]>([])
const departments = ref<{ id: string; name: string }[]>([])

// 构建级联选择器选项
const cascaderOptions = computed(() => {
  return [
    {
      value: 'depart',
      label: '按科室查询',
      children: departments.value.map(dept => ({
        value: dept.id,
        label: dept.name
      }))
    },
    {
      value: 'title',
      label: '按职称查询',
      children: docTitleOptions.value.map(title => ({
        value: title.value,
        label: title.label
      }))
    }
  ]
})

// 初始化数据
onMounted(async () => {
  await Promise.all([
    loadDepartmentOptions(),
    loadTitleOptions()
  ])
  await queryDoctors()
})

// 加载科室选项
const loadDepartmentOptions = async () => {
  try {
    const deptData = await getDepartmentOptions()
    // 根据API响应格式调整，获取正确的数据结构
    departments.value = deptData?.data || deptData || [
      { id: 'DEP001', name: '内科' },
      { id: 'DEP002', name: '外科' },
      { id: 'DEP003', name: '儿科' },
      { id: 'DEP004', name: '妇产科' },
      { id: 'DEP005', name: '眼科' },
      { id: 'DEP006', name: '耳鼻喉科' },
      { id: 'DEP007', name: '口腔科' },
      { id: 'DEP008', name: '皮肤科' },
      { id: 'DEP009', name: '神经内科' },
      { id: 'DEP010', name: '神经外科' },
      { id: 'DEP011', name: '心血管内科' },
      { id: 'DEP012', name: '呼吸内科' },
      { id: 'DEP013', name: '消化内科' },
      { id: 'DEP014', name: '肾内科' },
      { id: 'DEP015', name: '内分泌科' },
      { id: 'DEP016', name: '血液内科' },
      { id: 'DEP017', name: '肿瘤科' },
      { id: 'DEP018', name: '骨科' },
      { id: 'DEP019', name: '心胸外科' },
      { id: 'DEP020', name: '泌尿外科' },
      { id: 'DEP021', name: '整形外科' },
      { id: 'DEP022', name: '麻醉科' }
    ]
  } catch (error) {
    console.error('获取科室选项失败', error)
    ElMessage.error('获取科室选项失败')
    // 使用默认科室数据
    departments.value = Array.from({ length: 22 }, (_, i) => ({
      id: `DEP${(i + 1).toString().padStart(3, '0')}`,
      name: `科室${i + 1}`
    }))
  }
}

// 加载职称选项
const loadTitleOptions = async () => {
  try {
    const titleData = await getTitleOptions()
    // 根据API响应格式调整，获取正确的数据结构
    docTitleOptions.value = titleData?.data || titleData || [
      { value: 'TITLE001', label: '主任医师' },
      { value: 'TITLE002', label: '副主任医师' },
      { value: 'TITLE003', label: '主治医师' },
      { value: 'TITLE004', label: '住院医师' }
    ]
  } catch (error) {
    console.error('获取职称选项失败', error)
    ElMessage.error('获取职称选项失败')
    // 使用默认职称数据
    docTitleOptions.value = [
      { value: 'TITLE001', label: '主任医师' },
      { value: 'TITLE002', label: '副主任医师' },
      { value: 'TITLE003', label: '主治医师' },
      { value: 'TITLE004', label: '住院医师' }
    ]
  }
}

// 查询医生列表
const queryDoctors = async () => {
  loading.value = true
  try {
    // 构建查询参数，与接口文档保持一致
    const requestBody = {
      filter_name: searchParams.value.length === 2 ? searchParams.value[0] : 'none',
      filter_value: searchParams.value.length === 2 ? searchParams.value[1] : 'none',
      page: currentPage.value,
      num: pageSize.value
    }

    const response = await getDoctors(requestBody)
    console.log('查询医生列表响应:', response)
    if (response.code === 200) {
      console.log('查询医生列表成功:', response.data)
      doctorList.value = response.data?.doctorList || []
      // 从API响应中获取真实的总条数，如果没有则使用当前列表长度
      total.value = response.data?.total || doctorList.value.length
    } else {
      ElMessage.error(response.message || '查询医生列表失败')
      doctorList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('查询医生列表失败', error)
    ElMessage.error('查询医生列表失败')
    doctorList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理查询按钮点击
const handleQuery = () => {
  currentPage.value = 1 // 重置为第一页
  queryDoctors()
}

// 处理重置按钮点击
const handleReset = () => {
  searchParams.value = []
  currentPage.value = 1 // 重置为第一页
  queryDoctors()
}

// 处理分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  queryDoctors()
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  queryDoctors()
}

// 查看医生详情
const viewDoctorDetail = async (doctorId: string) => {
  try {
    console.log('查看医生详情请求参数:', doctorId)
    const response = await getDoctor(doctorId)
    console.log('获取医生详情响应:', response)
    if (response.code === 200) {
      const doctorData = response.data
      
      // 确保医生详情和专长字段被正确初始化
      if (doctorData.doctorDetails === undefined) {
        doctorData.doctorDetails = ''
      }
      if (doctorData.doctorSpeciality === undefined) {
        doctorData.doctorSpeciality = ''
      }
      
      // 根据接口文档，确保使用正确的字段名
      editDoctor.value = doctorData
      isEditDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取医生详情失败')
    }
  } catch (error) {
    console.error('获取医生详情失败', error)
    ElMessage.error('获取医生详情失败')
  }
}

// 保存医生信息
const saveDoctor = async () => {
  if (!editDoctor.value) return

  editLoading.value = true
  try {
    // 准备更新数据，与接口文档保持一致
    const updateData = {
      userName: editDoctor.value.userName,
      userId: editDoctor.value.userId,
      userGender: editDoctor.value.userGender,
      userAccount: editDoctor.value.userAccount,
      userEmail: editDoctor.value.userEmail,
      userPassword: editDoctor.value.userPassword,
      userPhone: editDoctor.value.userPhone,
      title: editDoctor.value.title || '',
      doctorDepart: editDoctor.value.doctorDepart || '',
      doctorStatus: editDoctor.value.doctorStatus,
      doctorDetails: editDoctor.value.doctorDetails || '',
      doctorSpeciality: editDoctor.value.doctorSpeciality || '',
      clinicId: editDoctor.value.clinicId
    }
    
    console.log('保存医生信息请求数据:', updateData)
    
    const response = await updateDoctor(updateData)
    if (response.code === 200) {
      ElMessage.success('更新医生信息成功')
      isEditDialogVisible.value = false
      queryDoctors() // 重新查询医生列表
    } else {
      ElMessage.error(response.message || '更新医生信息失败')
    }
  } catch (error) {
    console.error('更新医生信息失败', error)
    ElMessage.error('更新医生信息失败')
  } finally {
    editLoading.value = false
  }
}

// 关闭编辑对话框
const closeEditDialog = () => {
  isEditDialogVisible.value = false
  editDoctor.value = null
}

// 性别转换
const formatGender = (gender: string) => {
  return gender === '男' || gender === 'm' ? '男' : '女'
}

// 状态转换
const formatStatus = (status: string) => {
  return status === '在职' ? '在职' : '离职'
}

// 状态类型
const getStatusType = (status: string) => {
  return status === '在职' ? 'success' : 'warning'
}
</script>

<template>
  <div class="doctor-query-container">
    <h2>医生信息管理</h2>

    <!-- 查询条件区域 -->
    <div class="query-conditions">
      <el-row :gutter="20">
        <el-col :span="10">
          <el-form-item label="查询条件">
            <el-cascader
              v-model="searchParams"
              :options="cascaderOptions"
              placeholder="请选择科室或职称"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item>
            <el-button
              type="primary"
              @click="handleQuery"
              :loading="loading"
              style="margin-right: 10px"
            >
              查询
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 医生列表 -->
    <el-table
      :data="doctorList"
      style="width: 100%"
      v-loading="loading"
      stripe
      border
    >
      <el-table-column prop="userId" label="医生ID" width="100"></el-table-column>
      <el-table-column prop="userName" label="姓名" width="120"></el-table-column>
      <el-table-column prop="userGender" label="性别" width="80">
        <template #default="{ row }">
          {{ formatGender(row.userGender) }}
        </template>
      </el-table-column>
      <el-table-column prop="userPhone" label="电话" width="150"></el-table-column>
      <el-table-column prop="userEmail" label="邮箱"></el-table-column>
      <el-table-column prop="doctorStatus" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.doctorStatus)">
            {{ formatStatus(row.doctorStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDoctorDetail(row.userId)">
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 编辑医生对话框 -->
    <el-dialog
      v-model="isEditDialogVisible"
      title="编辑医生信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form v-if="editDoctor" :model="editDoctor" label-width="120px" v-loading="editLoading">
        <el-form-item label="医生ID" prop="userId">
          <el-input v-model="editDoctor.userId" disabled></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="userName">
          <el-input v-model="editDoctor.userName" placeholder="请输入医生姓名"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="userGender">
          <el-select v-model="editDoctor.userGender" placeholder="请选择性别">
            <el-option label="男" value="男"></el-option>
            <el-option label="女" value="女"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="工号" prop="userAccount">
          <el-input v-model="editDoctor.userAccount" placeholder="请输入工号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="userEmail">
          <el-input v-model="editDoctor.userEmail" type="email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="电话" prop="userPhone">
          <el-input v-model="editDoctor.userPhone" placeholder="请输入电话"></el-input>
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="editDoctor.title" placeholder="请选择职称">
            <el-option
              v-for="title in docTitleOptions"
              :key="title.label"
              :label="title.label"
              :value="title.label"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="科室" prop="doctorDepart">
          <el-select v-model="editDoctor.doctorDepart" placeholder="请选择科室">
            <el-option
              v-for="dept in departments"
              :key="dept.name"
              :label="dept.name"
              :value="dept.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="doctorStatus">
          <el-select v-model="editDoctor.doctorStatus" placeholder="请选择状态">
            <el-option label="在职" value="在职"></el-option>
            <el-option label="离职" value="离职"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="诊所ID" prop="clinicId">
          <el-input v-model="editDoctor.clinicId" placeholder="请输入诊所ID"></el-input>
        </el-form-item>
        <el-form-item label="专长" prop="doctorSpeciality">
          <el-input v-model="editDoctor.doctorSpeciality" type="textarea" placeholder="请输入专长"></el-input>
        </el-form-item>
        <el-form-item label="详情" prop="doctorDetails">
          <el-input v-model="editDoctor.doctorDetails" type="textarea" placeholder="请输入医生详情"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeEditDialog">取消</el-button>
          <el-button type="primary" @click="saveDoctor" :loading="editLoading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.doctor-query-container {
  padding: 20px;
}

.query-conditions {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>