<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPatientList, getPatientDetail } from './api/patientApi.js'

// --- 类型定义 --- 根据接口文档
interface Patient {
  id: string;
  birth: string;
  id_num: string;
  medical_insuranceid: string;
  reimburse_id: string;
  status: string;
}

interface PatientDetail extends Patient {
  email: string;
  pass: string;
  name: string;
  account: string;
  sex: string;
  phone_num: string;
  user_type: string;
}

// --- 状态管理 ---

// 列表页状态
const listLoading = ref(false)
const patientList = ref<Patient[]>([])
const totalPatients = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 详情页状态
const detailLoading = ref(false)
const selectedPatient = ref<Patient | null>(null)
const patientDetail = ref<PatientDetail | null>(null)

// --- 生命周期函数 ---
onMounted(() => {
  fetchPatientList()
})

// --- 方法 ---

// 获取患者列表
const fetchPatientList = async () => {
  listLoading.value = true
  try {
    // 根据接口文档，参数应为pageNum和pageSize
    const response = await getPatientList({ pageNum: currentPage.value, pageSize: pageSize.value })
    console.log('API响应:', response)
    
    // 统一处理不同code情况，优先使用接口文档指定的code=0
    if (response.code === 0 || response.code === 200) {
      // 尝试多种可能的响应结构
      const data = response.data
      if (data) {
        // 优先使用List字段（接口文档）
        if (Array.isArray(data.List)) {
          patientList.value = data.List
        } else if (Array.isArray(data.list)) {
          // 兼容list字段
          patientList.value = data.list
        } else if (Array.isArray(data.records)) {
          // 兼容records字段
          patientList.value = data.records
        } else if (Array.isArray(data)) {
          // 兼容直接返回数组的情况
          patientList.value = data
        } else {
          // 如果没有找到列表数据，使用空数组
          patientList.value = []
        }
        
        // 获取总条数，优先使用total字段
        if (typeof data.total === 'number') {
          totalPatients.value = data.total
        } else if (typeof data.Total === 'number') {
          // 兼容Total字段
          totalPatients.value = data.Total
        } else {
          // 如果没有总条数信息，使用当前页数据长度乘以10作为估计值（最多200条）
          totalPatients.value = Math.min(patientList.value.length * 10, 200)
        }
      } else {
        // 没有data字段，使用空数组
        patientList.value = []
        totalPatients.value = 0
      }
    } else {
      ElMessage.error(response.msg || '获取患者列表失败')
      // 使用模拟数据
      const mockResponse = getMockPatients(currentPage.value, pageSize.value)
      patientList.value = mockResponse.list
      totalPatients.value = mockResponse.total
    }
  } catch (error) {
    console.error('获取患者列表失败', error)
    ElMessage.error('获取患者列表失败')
    // 使用模拟数据
    const mockResponse = getMockPatients(currentPage.value, pageSize.value)
    patientList.value = mockResponse.list
    totalPatients.value = mockResponse.total
  } finally {
    listLoading.value = false
  }
}

// 列表页翻页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPatientList()
}

// 列表页每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchPatientList()
}

// 点击行查看详情
const handleRowClick = async (row: Patient) => {
  selectedPatient.value = row
  await fetchPatientDetail(row.id)
}

// 获取患者详情
const fetchPatientDetail = async (patientId: string) => {
  detailLoading.value = true
  try {
    const response = await getPatientDetail(patientId)
    console.log('API响应:', response)
    if (response.code === 200) {
      patientDetail.value = response.data
    } else {
      ElMessage.error(response.msg || '获取患者详情失败')
      // 使用模拟数据
      patientDetail.value = getMockPatientDetail(patientId)
    }
  } catch (error) {
    console.error('获取患者详情失败', error)
    ElMessage.error('获取患者详情失败')
    // 使用模拟数据
    patientDetail.value = getMockPatientDetail(patientId)
  } finally {
    detailLoading.value = false
  }
}

// 关闭详情
const closeDetail = () => {
  patientDetail.value = null
  selectedPatient.value = null
}

// 模拟数据
/**
 * 生成模拟患者数据
 */
const getMockPatients = (pageNum: number, pageSize: number) => {
  const all: Patient[] = [];
  for (let i = 0; i < 20; i++) {
    all.push({
      id: (i + 1).toString(),
      birth: `198${i % 10}-${(i % 12) + 1}-${(i % 28) + 1}`,
      id_num: `110101198${i % 10}${(i % 12) + 1}${(i % 28) + 1}${String(i).padStart(4, '0')}`,
      medical_insuranceid: `MI${String(i + 1).padStart(4, '0')}`,
      reimburse_id: `R${String(i + 1).padStart(4, '0')}`,
      status: i % 2 === 0 ? 'active' : 'inactive'
    });
  }
  return {
    list: all.slice((pageNum - 1) * pageSize, pageNum * pageSize),
    total: all.length
  };
}

const getMockPatientDetail = (id: string): PatientDetail => {
  return {
    id,
    birth: '1990-01-01',
    id_num: '110101199001011234',
    medical_insuranceid: 'MI001',
    reimburse_id: 'R001',
    status: 'active',
    email: `patient${id}@example.com`,
    pass: '******',
    name: `患者${id}`,
    account: `account${id}`,
    sex: id % 2 === 0 ? '女' : '男',
    phone_num: `138001380${String(id).padStart(2, '0')}`,
    user_type: 'patient'
  }
}
</script>

<template>
  <div class="patient-management-container">
    <h2>患者信息</h2>
    
    <!-- 患者列表 -->
    <el-card class="list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>患者列表</span>
        </div>
      </template>
      
      <el-table 
        :data="patientList" 
        v-loading="listLoading" 
        border 
        style="width: 100%"
        @row-click="handleRowClick"
        :row-class-name="(row) => row.id === selectedPatient?.id ? 'selected-row' : ''"
      >
        <el-table-column prop="id" label="患者ID" width="120"></el-table-column>
        <el-table-column prop="birth" label="出生日期" width="150"></el-table-column>
        <el-table-column prop="id_num" label="身份证号" min-width="200"></el-table-column>
        <el-table-column prop="medical_insuranceid" label="医保ID" width="180"></el-table-column>
        <el-table-column prop="reimburse_id" label="报销ID" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, total, sizes"
          :total="totalPatients"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
    
    <!-- 患者详情 -->
    <el-card v-if="patientDetail" class="detail-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>患者详情</span>
          <el-button type="text" @click="closeDetail">关闭</el-button>
        </div>
      </template>
      
      <div class="detail-content" v-loading="detailLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="患者ID">{{ patientDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ patientDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ patientDetail.sex }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ patientDetail.phone_num }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ patientDetail.email }}</el-descriptions-item>
          <el-descriptions-item label="账户">{{ patientDetail.account }}</el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ patientDetail.birth }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ patientDetail.id_num }}</el-descriptions-item>
          <el-descriptions-item label="医保ID">{{ patientDetail.medical_insuranceid }}</el-descriptions-item>
          <el-descriptions-item label="报销ID">{{ patientDetail.reimburse_id }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ patientDetail.user_type }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="patientDetail.status === 'active' ? 'success' : 'danger'">
              {{ patientDetail.status === 'active' ? '激活' : '停用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.patient-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

h2 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.list-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.detail-card {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-table__header-wrapper th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.selected-row {
  background-color: #ecf5ff;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  margin-top: 20px;
}

.el-descriptions {
  background-color: #fafafa;
}

.el-descriptions__label {
  background-color: #f5f7fa;
  font-weight: 500;
}
</style>