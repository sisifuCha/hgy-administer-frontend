<template>
  <div class="doctor-schedule-container">
    <el-tabs v-model="activeTab">
      <!-- ==================== 排班查询标签页 ==================== -->
      <el-tab-pane label="排班查询" name="query">
        <h2>医生排班查询</h2>
        <!-- 查询条件区域 -->
        <div class="query-conditions">
          <el-row :gutter="20" align="middle">
            <el-col :span="6">
              <el-form-item label="选择周次">
                <el-select v-model="queryForm.week" placeholder="请选择周次" clearable @change="onWeekChange">
                  <el-option label="当前周" value="current"></el-option>
                  <el-option label="下一周" value="next"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="或指定日期">
                <el-date-picker
                  v-model="queryForm.selectedDate"
                  type="date"
                  placeholder="选择日期查看该周"
                  value-format="YYYY-MM-DD"
                  clearable
                  @change="onDateChange"
                  />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="选择科室">
                <el-select v-model="queryForm.departmentId" placeholder="请选择科室" clearable>
                  <el-option
                    v-for="dept in departments"
                    :key="dept.id"
                    :label="dept.name"
                    :value="dept.id">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleQueryClick" :loading="loading">查询</el-button>
              <el-button @click="handleResetQuery">重置</el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 排班表格区域 -->
        <div class="schedule-table-container" v-if="showScheduleTable">
          <el-table :data="scheduleData" style="width: 100%" v-loading="loading" border>
            <el-table-column prop="timeSlot" label="时段" width="100" fixed></el-table-column>
            <el-table-column
              v-for="(day, index) in weekDays"
              :key="index"
              :label="`${day.dayName} (${day.date})`"
              width="220"
            >
              <template #default="scope">
                <div class="schedule-cell">
                  <div
                    v-for="schedule in getScheduleByTimeAndDay(scope.row.timeSlot, index)"
                    :key="schedule.id"
                    class="doctor-schedule-card"
                  >
                    <div class="doctor-name">{{ schedule.doctorName }} ({{ schedule.doctorTitle }})</div>
                    <div class="schedule-info">
                      <span class="room">{{ schedule.roomNumber }}</span>
                      <span class="quota">余号: {{ schedule.remainingQuota }}</span>
                    </div>
                  </div>
                  <div v-if="getScheduleByTimeAndDay(scope.row.timeSlot, index).length === 0" class="no-schedule">
                    暂无排班
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else-if="!loading" description="请选择查询条件并点击查询"></el-empty>
      </el-tab-pane>

      <!-- ==================== 新增排班标签页 ==================== -->
      <el-tab-pane label="新增排班" name="add">
        <h2>新增医生排班</h2>
        <el-form :model="addScheduleForm" ref="addFormRef" label-width="120px" style="max-width: 600px">
          <el-form-item label="选择医生" prop="doctorId" required>
            <el-select v-model="addScheduleForm.doctorId" placeholder="请选择医生" filterable>
              <el-option
                v-for="doc in doctorOptions"
                :key="doc.userId"
                :label="`${doc.userName} (${doc.doctorSpeciality})`"
                :value="doc.userId">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="排班日期" prop="scheduleDate" required>
            <el-date-picker
              v-model="addScheduleForm.scheduleDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="时间段" prop="timeSlot" required>
            <el-select v-model="addScheduleForm.timeSlot" placeholder="请选择时间段">
              <el-option label="上午 (08:00-12:00)" value="AM"></el-option>
              <el-option label="下午 (14:00-18:00)" value="PM"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="放号数量" prop="totalQuota" required>
            <el-input-number v-model="addScheduleForm.totalQuota" :min="1" />
          </el-form-item>
          <el-form-item label="诊室" prop="roomNumber" required>
            <el-input v-model="addScheduleForm.roomNumber" placeholder="请输入诊室号，如 内科1诊室"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAddSchedule" :loading="addLoading">立即创建</el-button>
            <el-button @click="resetAddForm">重置表单</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <!-- ==================== 3. 调班申请标签页 (新功能) ==================== -->
      <el-tab-pane label="调班申请" name="adjust">
        <h2>医生调班申请</h2>
        <el-form :model="adjustForm" ref="adjustFormRef" label-width="120px" style="max-width: 800px;">
          <el-card class="box-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>源班次 (要调走的班)</span>
              </div>
            </template>
            <el-form-item label="选择医生" prop="sourceDoctorId" required>
              <el-select v-model="adjustForm.sourceDoctorId" placeholder="请选择医生" filterable @change="onSourceDoctorChange">
                <el-option v-for="doc in doctorOptions" :key="doc.userId" :label="`${doc.userName} (${doc.doctorSpeciality})`" :value="doc.userId"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="选择源班次" prop="sourceScheduleId" required>
              <el-select v-model="adjustForm.sourceScheduleId" placeholder="请先选择医生以加载其班次" :loading="sourceSchedulesLoading">
                <el-option v-for="sch in sourceSchedules" :key="sch.id" :label="`${sch.date} ${sch.timeSlot}`" :value="sch.id"></el-option>
              </el-select>
            </el-form-item>
          </el-card>

          <el-card class="box-card" shadow="never" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>目的班次 (要调往的班)</span>
                <el-switch v-model="adjustForm.isCancel" active-text="取消排班(放假)" @change="onCancelSwitchChange" />
              </div>
            </template>
            <div v-if="!adjustForm.isCancel">
              <el-form-item label="选择医生" prop="destDoctorId">
                <el-select v-model="adjustForm.destDoctorId" placeholder="可与其他医生换班" filterable clearable>
                  <el-option v-for="doc in doctorOptions" :key="doc.userId" :label="`${doc.userName} (${doc.doctorSpeciality})`" :value="doc.userId"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="排班日期" prop="destDate">
                <el-date-picker v-model="adjustForm.destDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
              </el-form-item>
              <el-form-item label="时间段" prop="destTimeSlot">
                <el-select v-model="adjustForm.destTimeSlot" placeholder="请选择时间段">
                  <el-option label="上午" value="AM"></el-option>
                  <el-option label="下午" value="PM"></el-option>
                </el-select>
              </el-form-item>
            </div>
            <el-alert v-else title="将直接取消源班次，为医生放假。" type="info" show-icon :closable="false" />
          </el-card>

          <el-form-item label="调班理由" prop="reason" required style="margin-top: 20px;">
            <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="请输入调班或取消排班的理由"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleAdjustSubmit" :loading="adjustLoading">提交申请</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ==================== 4. 调班审批标签页 (新功能) ==================== -->
      <el-tab-pane label="调班审批" name="approve">
        <h2>待审批的调班申请</h2>
        <el-table :data="adjustmentRequests" v-loading="requestsLoading" border>
          <el-table-column prop="requestingDoctorName" label="申请医生" width="120"></el-table-column>
          <el-table-column label="源班次">
            <template #default="{ row }">
              <div>{{ row.sourceSchedule.doctorName }}</div>
              <div>{{ row.sourceSchedule.date }} {{ row.sourceSchedule.timeSlot }}</div>
            </template>
          </el-table-column>
          <el-table-column label="目的班次">
            <template #default="{ row }">
              <div v-if="row.isCancel">
                <el-tag type="info">取消排班(放假)</el-tag>
              </div>
              <div v-else>
                <div>{{ row.destSchedule.doctorName }}</div>
                <div>{{ row.destSchedule.date }} {{ row.destSchedule.timeSlot }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="申请理由" show-overflow-tooltip></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'PENDING' ? 'warning' : 'info'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
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

<script setup lang="ts">
import { ref, reactive, onMounted, computed,watch } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 导入你的 API 函数
import { getSchedulesHistory, getSchedules } from './api/scheduleApi.js'
// import { getDoctorSchedule, addSchedule } from './api/scheduleApi.js'
// import { getDepartmentOptions } from '@/views/DoctorQuery/api/doctorApi.js'
// import { getDoctorListWithFilter } from '@/views/DoctorQuery/api/doctorApi.js'

// ==================== 1. 定义类型接口 ====================
// 科室类型
interface Department {
  id: string;
  name: string;
}

// 医生选项类型
interface DoctorOption {
  userId: string;
  userName: string;
  doctorSpeciality: string;
}

// 详细排班信息类型
interface ScheduleDetail {
  id: string;
  timeSlot: string;
  dayIndex: number;
  doctorName: string;
  doctorTitle: string;
  roomNumber: string;
  remainingQuota: number;
}


interface ScheduleOption { id: string; date: string; timeSlot: string; }
interface AdjustmentRequest {
  id: string;
  requestingDoctorName: string;
  sourceSchedule: { doctorName: string; date: string; timeSlot: string; };
  destSchedule: { doctorName: string; date: string; timeSlot: string; };
  isCancel: boolean;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// --- 通用状态 ---
const loading = ref(false)
const addLoading = ref(false)
const activeTab = ref('query')

// ==================== 2. 为 ref 添加类型 ====================
const departments = ref<Department[]>([]) // 之前是 ref([])，现在是 ref<Department[]>([])
const doctorOptions = ref<DoctorOption[]>([]) // 之前是 ref([])
const scheduleDetails = ref<ScheduleDetail[]>([]) // 之前是 ref([])

// --- 查询功能状态 ---
const queryForm = reactive({
  week: 'current',
  selectedDate: '',
  departmentId: ''
})

const showScheduleTable = ref(false)
const scheduleData = ref([{ timeSlot: '上午' }, { timeSlot: '下午' }])

// --- 新增功能状态 ---
const addFormRef = ref<FormInstance>()
const addScheduleForm = reactive({
  doctorId: '',
  scheduleDate: '',
  timeSlot: '',
  totalQuota: 20,
  roomNumber: ''
})

// --- 计算属性 ---
const weekDays = computed(() => {
  const days = []
  let targetDate: Date
  if (queryForm.selectedDate) {
    targetDate = new Date(queryForm.selectedDate)
  }
  else {
    targetDate = new Date()
    if (queryForm.week==='next'){
      targetDate.setDate(targetDate.getDate() + 7)
    }
  }
  const currentDay = targetDate.getDay() || 7

  // 计算该周的周一日期
  const startDate = new Date(targetDate)
  startDate.setDate(targetDate.getDate() - (currentDay - 1))
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push({
      dayName: dayNames[i],
      date: `${date.getMonth() + 1}-${date.getDate()}`
    })
  }
  return days
})

// ==================== 状态管理 ====================
// --- 调班申请状态 ---
const adjustFormRef = ref<FormInstance>()
const adjustLoading = ref(false)
const sourceSchedulesLoading = ref(false)
const sourceSchedules = ref<ScheduleOption[]>([])
const adjustForm = reactive({
  sourceDoctorId: '',
  sourceScheduleId: '',
  isCancel: false,
  destDoctorId: '',
  destDate: '',
  destTimeSlot: '',
  reason: ''
})

// --- 调班审批状态 ---
const requestsLoading = ref(false)
const adjustmentRequests = ref<AdjustmentRequest[]>([])

// --- 生命周期函数 ---
onMounted(() => {
  // fetchInitialData()
  // fetchAdjustmentRequests() // 获取待审批列表
  departments.value = [
    { id: 'DEP001', name: '内科' },
    { id: 'DEP002', name: '外科' },
    { id: 'DEP003', name: '妇产科' },
    { id: 'DEP004', name: '儿科' },
    { id: 'DEP005', name: '心内科门诊' },
    { id: 'DEP006', name: '肾内科门诊' },
    { id: 'DEP007', name: '血液科门诊' },
    { id: 'DEP008', name: '感染内科门诊' },
    { id: 'DEP009', name: '肝炎门诊' },
    { id: 'DEP010', name: '基本外科门诊' },
    { id: 'DEP011', name: '骨科门诊' },
    { id: 'DEP012', name: '胸外科门诊' },
    { id: 'DEP013', name: '泌尿外科门诊' },
    { id: 'DEP014', name: '心外科门诊' },
    { id: 'DEP015', name: '疼痛综合门诊' },
    { id: 'DEP016', name: '妇科门诊' },
    { id: 'DEP017', name: '产科门诊' },
    { id: 'DEP018', name: '妇科内分泌及生殖门诊' },
    { id: 'DEP019', name: '妇科计划生育门诊' },
    { id: 'DEP020', name: '综合妇科门诊' },
    { id: 'DEP021', name: '儿科门诊' },
    { id: 'DEP022', name: '眼科门诊' },
  ]
  doctorOptions.value = [
    { userId: '1', userName: '张医生', doctorSpeciality: '内科' },
    { userId: '2', userName: '李医生', doctorSpeciality: '外科' },
  ]
  // 使用模拟数据
  doctorOptions.value = [
    { userId: '1', userName: '张医生', doctorSpeciality: '内科' },
    { userId: '2', userName: '李医生', doctorSpeciality: '外科' },
  ]
  adjustmentRequests.value = getMockAdjustmentRequests()
})
// ==================== 监听器 ====================
// 监听调班申请的医生选择，以动态加载其排班
watch(() => adjustForm.sourceDoctorId, (newDoctorId) => {
  if (newDoctorId) {
    onSourceDoctorChange(newDoctorId)
  } else {
    sourceSchedules.value = []
    adjustForm.sourceScheduleId = ''
  }
})

// --- 方法 ---
const fetchInitialData = async () => {
  try {
    // const [deptRes, docRes] = await Promise.all([
    //   // getDepartmentOptions(),
    //   // getDoctorListWithFilter({ page: 1, num: 1000 })
    // ])
    // // departments.value = deptRes || []
    // // doctorOptions.value = docRes.records || []
  } catch (error) {
    console.error('获取初始数据失败', error)
    ElMessage.error('获取科室或医生列表失败')
  }
}

// 统一的查询入口：根据用户选择决定调用哪个接口
const handleQueryClick = () => {
  if (!queryForm.departmentId) {
    ElMessage.warning('请选择科室')
    return
  }
  if (!queryForm.week && !queryForm.selectedDate) {
    ElMessage.warning('请选择周次或指定日期')
    return
  }

  // 根据用户选择的查询方式决定调用哪个接口
  if (queryForm.week) {
    // 选择了周次（0/1），调用 /admin/getSchedules 接口
    handleQueryByWeek()
  } else if (queryForm.selectedDate) {
    // 选择了具体日期，调用 /admin/GetSchedulesHistory 接口
    handleQuery()
  }
}

// 新方法：处理周次查询（使用 /admin/getSchedules 接口）
const handleQueryByWeek = async () => {
  if (!queryForm.departmentId) {
    ElMessage.warning('请选择科室')
    return
  }

  loading.value = true
  try {
    // 根据选中的科室ID找到对应的科室名称
    const selectedDept = departments.value.find(dept => dept.id === queryForm.departmentId)
    if (!selectedDept) {
      ElMessage.error('未找到选中的科室信息')
      return
    }

    // 将 week 值转换为 0 或 1
    const weekNumber = queryForm.week === 'current' ? 0 : 1

    const params = {
      week: weekNumber,  // 0=当前周，1=下一周
      depart_name: selectedDept.name  // 使用科室名称
    }

    console.log('调用周次排班接口 - 根据周次查询:', params)
    const response = await getSchedules(params)

    // 处理响应数据
    scheduleDetails.value = response || []
    showScheduleTable.value = true
  } catch (error) {
    console.error('获取排班数据失败', error)
    ElMessage.error('获取排班数据失败')
  } finally {
    loading.value = false
  }
}

// 保留原方法：处理日期查询（使用 /admin/GetSchedulesHistory 接口）
const handleQuery = async () => {
  if (!queryForm.departmentId) {
    ElMessage.warning('请选择科室')
    return
  }
  if (!queryForm.selectedDate) {
    ElMessage.warning('请选择日期')
    return
  }

  loading.value = true
  try {
    // 根据选中的科室ID找到对应的科室名称
    const selectedDept = departments.value.find(dept => dept.id === queryForm.departmentId)
    if (!selectedDept) {
      ElMessage.error('未找到选中的科室信息')
      return
    }

    const params = {
      date: queryForm.selectedDate,  // 格式：'2025-11-20'
      depart_name: selectedDept.name  // 使用科室名称
    }
    console.log('调用历史排班接口 - 根据日期查询:', params)
    const response = await getSchedulesHistory(params)

    // 处理响应数据
    scheduleDetails.value = response || []
    showScheduleTable.value = true
  } catch (error) {
    console.error('获取排班数据失败', error)
    ElMessage.error('获取排班数据失败')
  } finally {
    loading.value = false
  }
}

const handleResetQuery = () => {
  queryForm.week = ''
  queryForm.selectedDate = ''
  queryForm.departmentId = ''
  showScheduleTable.value = false
  scheduleDetails.value = []
}

// 当用户选择周次时，清空日期选择
const onWeekChange = (value: string) => {
  if (value) {
    queryForm.selectedDate = ''
  }
}

// 当用户选择日期时，清空周次选择
const onDateChange = (value: string) => {
  if (value) {
    queryForm.week = ''
  }
}

// ==================== 3. 为函数参数添加类型 ====================
const getScheduleByTimeAndDay = (timeSlot: string, dayIndex: number) => {
  return scheduleDetails.value.filter(s => s.timeSlot === timeSlot && s.dayIndex === dayIndex)
}

const handleAddSchedule = async () => {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (valid) {
      addLoading.value = true
      try {
        console.log('提交的新增排班数据:', addScheduleForm)
        // await addSchedule(addScheduleForm)
        ElMessage.success('新增排班成功！')
        resetAddForm()
        activeTab.value = 'query'
      } catch (error) {
        console.error('新增排班失败', error)
        ElMessage.error('新增排班失败')
      } finally {
        addLoading.value = false
      }
    } else {
      ElMessage.error('请检查表单是否填写完整')
    }
  })
}

const resetAddForm = () => {
  if (!addFormRef.value) return
  addFormRef.value.resetFields()
}
// --- 调班申请相关方法 ---
const onSourceDoctorChange = async (doctorId: string) => {
  sourceSchedulesLoading.value = true
  try {
    // 应该调用API: const schedules = await getSchedulesByDoctorId(doctorId)
    // 使用模拟数据
    console.log(`正在为医生 ${doctorId} 加载班次...`)
    sourceSchedules.value = [
      { id: 'sch_001', date: '2025-11-17', timeSlot: '上午' },
      { id: 'sch_002', date: '2025-11-18', timeSlot: '下午' },
    ]
    adjustForm.sourceScheduleId = '' // 清空之前的选择
  } catch (error) {
    ElMessage.error('加载医生班次失败')
  } finally {
    sourceSchedulesLoading.value = false
  }
}

const onCancelSwitchChange = (isCancel: boolean) => {
  if (isCancel) {
    // 如果是取消排班，清空目的班次信息
    adjustForm.destDoctorId = ''
    adjustForm.destDate = ''
    adjustForm.destTimeSlot = ''
  }
}

const handleAdjustSubmit = async () => {
  if (!adjustFormRef.value) return
  await adjustFormRef.value.validate(async (valid) => {
    if (valid) {
      adjustLoading.value = true
      try {
        console.log('提交的调班申请数据:', adjustForm)
        // await requestScheduleAdjustment(adjustForm)
        ElMessage.success('调班申请提交成功！')
        // 成功后重置表单
        adjustFormRef.value?.resetFields()
      } catch (error) {
        ElMessage.error('提交失败')
      } finally {
        adjustLoading.value = false
      }
    }
  })
}

// --- 调班审批相关方法 ---
const fetchAdjustmentRequests = async () => {
  requestsLoading.value = true
  try {
    // const response = await getAdjustmentRequests()
    // adjustmentRequests.value = response
    adjustmentRequests.value = getMockAdjustmentRequests()
  } catch (error) {
    ElMessage.error('获取审批列表失败')
  } finally {
    requestsLoading.value = false
  }
}

const handleApprove = async (requestId: string) => {
  await ElMessageBox.confirm('确定要批准这个调班申请吗?', '提示', { type: 'warning' })
  try {
    // await approveAdjustment(requestId)
    ElMessage.success('已批准')
    fetchAdjustmentRequests() // 重新加载列表
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReject = async (requestId: string) => {
  await ElMessageBox.confirm('确定要驳回这个调班申请吗?', '提示', { type: 'warning' })
  try {
    // await rejectAdjustment(requestId)
    ElMessage.success('已驳回')
    fetchAdjustmentRequests() // 重新加载列表
  } catch (error) {
    ElMessage.error('操作失败')
  }
}




const getMockScheduleData = (departmentId: string): ScheduleDetail[] => {
  console.log('根据科室ID模拟数据:', departmentId)
  return [
    { id: '1', timeSlot: '上午', dayIndex: 0, doctorName: '张医生', doctorTitle: '主任医师', roomNumber: '内科1诊室', remainingQuota: 15 },
    { id: '2', timeSlot: '上午', dayIndex: 0, doctorName: '李医生', doctorTitle: '副主任医师', roomNumber: '内科2诊室', remainingQuota: 10 },
    { id: '3', timeSlot: '下午', dayIndex: 0, doctorName: '王医生', doctorTitle: '主治医师', roomNumber: '内科1诊室', remainingQuota: 8 },
    { id: '4', timeSlot: '上午', dayIndex: 1, doctorName: '张医生', doctorTitle: '主任医师', roomNumber: '内科1诊室', remainingQuota: 12 },
  ]
}
const getMockAdjustmentRequests = (): AdjustmentRequest[] => {
  return [
    {
      id: 'req_01',
      requestingDoctorName: '张医生',
      sourceSchedule: { doctorName: '张医生', date: '2025-11-17', timeSlot: '上午' },
      destSchedule: { doctorName: '李医生', date: '2025-11-19', timeSlot: '上午' },
      isCancel: false,
      reason: '与李医生换班，因个人事务需调整。',
      status: 'PENDING'
    },
    {
      id: 'req_02',
      requestingDoctorName: '王医生',
      sourceSchedule: { doctorName: '王医生', date: '2025-11-20', timeSlot: '下午' },
      destSchedule: { doctorName: '', date: '', timeSlot: '' },
      isCancel: true,
      reason: '临时有家庭急事，申请取消本次排班。',
      status: 'PENDING'
    }
  ]
}

</script>

<style scoped>
.doctor-schedule-container {
  padding: 20px;
}
.query-conditions {
  margin-bottom: 20px;
}
.schedule-cell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 5px;
}
.doctor-schedule-card {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #e4e7ed;
}
.doctor-name {
  font-weight: bold;
  font-size: 14px;
}
.doctor-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}
.schedule-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.quota {
  color: #409eff;
  font-weight: bold;
}
.no-schedule {
  color: #c0c4cc;
  text-align: center;
  padding: 20px 0;
}
</style>
