<template>
  <div class="added-source-audit">
    <h2 class="page-title">加号请求审核</h2>
    
    <!-- 表格展示加号请求列表 -->
    <el-card class="table-card">
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="patient_id" label="患者ID" width="180" />
        <el-table-column prop="sch_id" label="排班ID" width="180" />
        <el-table-column prop="apply_time" label="申请时间" width="200" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason_text" label="申请理由" min-width="300" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleApprove(scope.row)"
              :disabled="scope.row.status !== '待审核'"
            >
              同意
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleReject(scope.row)"
              :disabled="scope.row.status !== '待审核'"
              style="margin-left: 10px"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAddedSourceList, checkAddedSource } from './api'

// 表格数据
const tableData = ref([])

// 分页数据
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 根据状态获取标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case '待审核':
      return 'warning'
    case '已同意':
      return 'success'
    case '已拒绝':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取加号请求列表
const fetchAddedSourceList = async () => {
  try {
    const response = await getAddedSourceList({
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize
    })
    console.log('加号请求列表响应:', response)
    
    // 由于响应拦截器已经处理了code，这里直接使用返回的数据
    tableData.value = response.AddedSourceList || []
    pagination.value.total = tableData.value.length // 实际项目中应该从接口返回total字段
  } catch (error) {
    console.error('获取加号请求列表失败:', error)
    ElMessage.error('获取加号请求列表失败')
  }
}

// 同意加号请求
const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定同意该加号请求吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await checkAddedSource({
      patient_id: row.patient_id,
      sch_id: row.sch_id,
      status: '已同意'
    })
    
    // 由于响应拦截器已经处理了错误，这里直接显示成功消息
    ElMessage.success('同意加号请求成功')
    fetchAddedSourceList() // 重新获取列表
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    console.error('同意加号请求失败:', error)
    // 错误信息已在拦截器中处理
  }
}

// 拒绝加号请求
const handleReject = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定拒绝该加号请求吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await checkAddedSource({
      patient_id: row.patient_id,
      sch_id: row.sch_id,
      status: '已拒绝'
    })
    
    // 由于响应拦截器已经处理了错误，这里直接显示成功消息
    ElMessage.success('拒绝加号请求成功')
    fetchAddedSourceList() // 重新获取列表
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    console.error('拒绝加号请求失败:', error)
    // 错误信息已在拦截器中处理
  }
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchAddedSourceList()
}

// 当前页码改变
const handleCurrentChange = (current: number) => {
  pagination.value.currentPage = current
  fetchAddedSourceList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchAddedSourceList()
})
</script>

<style scoped>
.added-source-audit {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: bold;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>