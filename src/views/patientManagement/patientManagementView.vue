<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// import { getPatientList, getPatientById, updatePatient, getPendingAuthRequests, approveAuthRequest, rejectAuthRequest } from './api/patientApi.js'

// --- 类型定义 ---
interface Patient {
  userId: string;
  userName: string;
  userGender: string;
  userPhone: string;
  userEmail: string;
  authStatus: 'VERIFIED' | 'PENDING';
}
interface AuthRequest {
  id: string;
  userId: string;
  userName: string;
  idCard: string;
  applyTime: string;
}

// --- 状态管理 ---
const activeTab = ref('list')

// 列表页状态
const listLoading = ref(false)
const patientList = ref<Patient[]>([])
const totalPatients = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 查找与更新页状态
const searchLoading = ref(false)
const updateLoading = ref(false)
const searchId = ref('')
const searchedPatient = ref<Patient | null>(null)

// 审批页状态
const requestsLoading = ref(false)
const authRequests = ref<AuthRequest[]>([])

// --- 生命周期函数 ---
onMounted(() => {
  fetchPatientList()
  fetchAuthRequests()
})

// --- 方法 ---

// 获取患者列表
const fetchPatientList = async () => {
  listLoading.value = true
  try {
    // const response = await getPatientList({ page: currentPage.value, num: pageSize.value })
    // patientList.value = response.records
    // totalPatients.value = response.total
    // 使用模拟数据
    const mockResponse = getMockPatients(currentPage.value, pageSize.value)
    patientList.value = mockResponse.records
    totalPatients.value = mockResponse.total
  } catch (error) {
    ElMessage.error('获取患者列表失败')
  } finally {
    listLoading.value = false
  }
}

// 列表页翻页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPatientList()
}

// 查找患者
const handleSearch = async () => {
  if (!searchId.value) {
    ElMessage.warning('请输入患者ID')
    return
  }
  searchLoading.value = true
  searchedPatient.value = null
  try {
    // const response = await getPatientById(searchId.value)
    // searchedPatient.value = response
    // 使用模拟数据
    searchedPatient.value = { userId: searchId.value, userName: '模拟患者', userGender: '男', userPhone: '13800138000', userEmail: 'mock@test.com', authStatus: 'PENDING' }
  } catch (error) {
    ElMessage.error('查找患者失败，请检查ID是否正确')
  } finally {
    searchLoading.value = false
  }
}

// 更新患者信息
const handleUpdate = async () => {
  if (!searchedPatient.value) return
  updateLoading.value = true
  try {
    // await updatePatient(searchedPatient.value.userId, searchedPatient.value)
    ElMessage.success('患者信息更新成功！')
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    updateLoading.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  searchedPatient.value = null
  searchId.value = ''
}

// 获取待审批列表
const fetchAuthRequests = async () => {
  requestsLoading.value = true
  try {
    // const response = await getPendingAuthRequests()
    // authRequests.value = response
    authRequests.value = getMockAuthRequests()
  } catch (error) {
    ElMessage.error('获取待审批列表失败')
  } finally {
    requestsLoading.value = false
  }
}

// 批准申请
const handleApprove = async (requestId: string) => {
  await ElMessageBox.confirm('确定要批准该患者的身份认证吗?', '提示', { type: 'success' })
  try {
    // await approveAuthRequest(requestId)
    ElMessage.success('已批准')
    fetchAuthRequests() // 刷新列表
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 驳回申请
const handleReject = async (requestId: string) => {
  await ElMessageBox.confirm('确定要驳回该患者的身份认证吗?', '提示', { type: 'warning' })
  try {
    // await rejectAuthRequest(requestId)
    ElMessage.success('已驳回')
    fetchAuthRequests() // 刷新列表
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// --- 模拟数据函数 ---
const getMockPatients = (page: number, num: number): { records: Patient[], total: number } => {
  const all: Patient[] = Array.from({ length: 35 }).map((_, i) => ({
    userId: `PAT2025${1000 + i}`,
    userName: `患者${i + 1}`,
    userGender: i % 2 === 0 ? '男' : '女',
    userPhone: `139${String(i).padStart(8, '0')}`,
    userEmail: `patient${i}@hospital.com`,
    authStatus: i < 25 ? 'VERIFIED' : 'PENDING'
  }));
  return {
    records: all.slice((page - 1) * num, page * num),
    total: all.length
  };
}
const getMockAuthRequests = (): AuthRequest[] => {
  return [
    { id: 'AUTH001', userId: 'PAT20251026', userName: '患者27', idCard: '440...X', applyTime: '2025-11-15 10:30' },
    { id: 'AUTH002', userId: 'PAT20251027', userName: '患者28', idCard: '310...8', applyTime: '2025-11-15 11:00' },
  ]
}
</script>

<template>
  <div class="patient-management-container">
    <el-tabs v-model="activeTab">
      <!-- ==================== 1. 患者列表 ==================== -->
      <el-tab-pane label="患者列表" name="list">
        <h2>所有患者</h2>
        <el-table :data="patientList" v-loading="listLoading" border>
          <el-table-column prop="userId" label="患者ID" width="180"></el-table-column>
          <el-table-column prop="userName" label="姓名" width="120"></el-table-column>
          <el-table-column prop="userGender" label="性别" width="80"></el-table-column>
          <el-table-column prop="userPhone" label="手机号"></el-table-column>
          <el-table-column prop="userEmail" label="邮箱"></el-table-column>
          <el-table-column label="认证状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.authStatus === 'VERIFIED' ? 'success' : 'warning'">
                {{ row.authStatus === 'VERIFIED' ? '已认证' : '待认证' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="totalPatients"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handlePageChange"
          style="margin-top: 20px; justify-content: flex-end;"
        />
      </el-tab-pane>

      <!-- ==================== 2. 查找与更新 ==================== -->
      <el-tab-pane label="查找与更新" name="search">
        <h2>查找与更新患者信息</h2>
        <div class="search-section">
          <el-input v-model="searchId" placeholder="请输入患者ID" style="width: 300px; margin-right: 10px;"></el-input>
          <el-button type="primary" @click="handleSearch" :loading="searchLoading">查找</el-button>
        </div>

        <el-card v-if="searchedPatient" class="update-form-card" v-loading="updateLoading">
          <template #header>
            <div>正在编辑患者: {{ searchedPatient.userName }} (ID: {{ searchedPatient.userId }})</div>
          </template>
          <el-form :model="searchedPatient" label-width="100px">
            <el-form-item label="姓名">
              <el-input v-model="searchedPatient.userName"></el-input>
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="searchedPatient.userPhone"></el-input>
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="searchedPatient.userEmail"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="handleUpdate">保存更新</el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-empty v-else description="请输入ID以查找患者进行编辑"></el-empty>
      </el-tab-pane>

      <!-- ==================== 3. 认证审批 ==================== -->
      <el-tab-pane label="认证审批" name="approval">
        <h2>待认证申请</h2>
        <el-table :data="authRequests" v-loading="requestsLoading" border>
          <el-table-column prop="userId" label="患者ID"></el-table-column>
          <el-table-column prop="userName" label="姓名"></el-table-column>
          <el-table-column prop="idCard" label="身份证号"></el-table-column>
          <el-table-column prop="applyTime" label="申请时间"></el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" @click="handleApprove(row.id)">批准</el-button>
              <el-button size="small" type="danger" @click="handleReject(row.id)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.patient-management-container {
  padding: 20px;
}
.search-section {
  margin-bottom: 20px;
}
.update-form-card {
  margin-top: 20px;
  max-width: 600px;
}
</style>
