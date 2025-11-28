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
                    class="doctor-schedule-card clickable"
                    :class="{ 'stopped': schedule.status === 'stopped' }"
                  >
                    <div class="card-content">
                      <div class="doctor-name">
                        {{ schedule.doctorName }} ({{ schedule.doctorTitle }})
                        <el-tag v-if="schedule.status === 'stopped'" type="info" size="small" class="status-tag">停诊</el-tag>
                      </div>
                      <div class="schedule-info">
                        <span class="room">{{ schedule.roomNumber }}</span>
                        <span class="quota">余号: {{ schedule.remainingQuota }}</span>
                      </div>
                    </div>
                    <div class="card-actions">
                      <el-button
                        type="primary"
                        size="small"
                        link
                        @click="handleAdjustSchedule(schedule)"
                        title="调班"
                        :disabled="schedule.status === 'stopped'"
                      >
                        调班
                      </el-button>
                      <el-button
                        type="danger"
                        size="small"
                        link
                        @click="handleDeleteSchedule(schedule)"
                        title="设置停诊"
                        :disabled="schedule.status === 'stopped'"
                      >
                        停诊
                      </el-button>
                    </div>
                  </div>
                  <div v-if="getScheduleByTimeAndDay(scope.row.timeSlot, index).length === 0" class="no-schedule">
                    暂无排班
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 批量停诊表单区域 -->
          <el-divider content-position="left" class="batch-stop-divider">批量停诊设置</el-divider>
          <el-card class="batch-stop-card" shadow="never">
            <el-form :model="batchStopForm" ref="batchStopFormRef" label-width="120px" :rules="batchStopRules">
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="选择医生" prop="doctorIds" required>
                    <el-select
                      v-model="batchStopForm.doctorIds"
                      multiple
                      placeholder="请选择需要停诊的医生"
                      filterable
                      style="width: 100%"
                    >
                      <el-option
                        v-for="doc in doctorOptions"
                        :key="doc.userId"
                        :label="`${doc.userName} (${doc.doctorSpeciality})`"
                        :value="doc.userId"
                      >
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="起始时段" required>
                    <el-row :gutter="10">
                      <el-col :span="14">
                        <el-form-item prop="startDate" style="margin-bottom: 0">
                          <el-date-picker
                            v-model="batchStopForm.startDate"
                            type="date"
                            placeholder="选择开始日期"
                            value-format="YYYY-MM-DD"
                            style="width: 100%"
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="10">
                        <el-form-item prop="startTimeSlot" style="margin-bottom: 0">
                          <el-select v-model="batchStopForm.startTimeSlot" placeholder="选择时段" style="width: 100%">
                            <el-option label="上午" value="TIME0001"></el-option>
                            <el-option label="下午" value="TIME0002"></el-option>
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="终止时段" required>
                    <el-row :gutter="10">
                      <el-col :span="14">
                        <el-form-item prop="endDate" style="margin-bottom: 0">
                          <el-date-picker
                            v-model="batchStopForm.endDate"
                            type="date"
                            placeholder="选择结束日期"
                            value-format="YYYY-MM-DD"
                            style="width: 100%"
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="10">
                        <el-form-item prop="endTimeSlot" style="margin-bottom: 0">
                          <el-select v-model="batchStopForm.endTimeSlot" placeholder="选择时段" style="width: 100%">
                            <el-option label="上午" value="TIME0001"></el-option>
                            <el-option label="下午" value="TIME0002"></el-option>
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col :span="24">
                  <el-form-item label="停诊原因" prop="reason" required>
                    <el-input
                      v-model="batchStopForm.reason"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入批量停诊的原因"
                      maxlength="200"
                      show-word-limit
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item>
                <el-button type="primary" @click="handleBatchStop" :loading="batchStopLoading">
                  批量设置停诊
                </el-button>
                <el-button @click="resetBatchStopForm">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        <el-empty v-else-if="!loading" description="请选择查询条件并点击查询"></el-empty>
      </el-tab-pane>

      <!-- ==================== 新增排班标签页 ==================== -->
      <el-tab-pane label="新增排班" name="add">
        <h2>批量新增排班</h2>
        <el-form :model="addScheduleForm" ref="addFormRef" label-width="120px">
          <el-form-item label="选择周次" prop="week" required>
            <el-radio-group v-model="addScheduleForm.week">
              <el-radio :value="0">当前周</el-radio>
              <el-radio :value="1">下一周</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-divider content-position="left">一周排班安排</el-divider>

          <div class="week-schedule-container">
            <el-card v-for="day in weekDaysList" :key="day.key" class="day-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="day-title">{{ day.label }}</span>
                  <el-button type="primary" size="small" @click="addScheduleForDay(day.key)">
                    + 添加排班
                  </el-button>
                </div>
              </template>

              <div v-if="addScheduleForm.schedules[day.key].length === 0" class="empty-hint">
                暂无排班，点击上方按钮添加
              </div>

              <div v-else>
                <div v-for="(schedule, index) in addScheduleForm.schedules[day.key]" :key="index" class="schedule-item">
                  <el-row :gutter="10" align="middle">
                    <el-col :span="10">
                      <el-select v-model="schedule.doctor_name" placeholder="选择医生" filterable style="width: 100%">
                        <el-option
                          v-for="doc in doctorOptions"
                          :key="doc.userId"
                          :label="`${doc.userName} (${doc.doctorSpeciality})`"
                          :value="doc.userName">
                        </el-option>
                      </el-select>
                    </el-col>
                    <el-col :span="10">
                      <el-select v-model="schedule.template_id" placeholder="选择时间段" style="width: 100%">
                        <el-option label="上午" value="TIME0001"></el-option>
                        <el-option label="下午" value="TIME0002"></el-option>
                      </el-select>
                    </el-col>
                    <el-col :span="4">
                      <el-button type="danger" size="small" @click="removeScheduleForDay(day.key, index)" style="width: 100%">
                        删除
                      </el-button>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-card>
          </div>

          <el-form-item style="margin-top: 20px;">
            <el-button type="primary" @click="handleAddSchedule" :loading="addLoading">提交排班</el-button>
            <el-button @click="resetAddForm">重置表单</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <!-- ==================== 3. 批量延后排班标签页 ==================== -->
      <el-tab-pane label="批量延后排班" name="adjust">
        <h2>批量延后排班</h2>
        <el-card class="box-card" shadow="never" style="max-width: 800px;">
          <el-form :model="batchDelayForm" :rules="batchDelayRules" ref="batchDelayFormRef" label-width="120px">
            <el-form-item label="选择医生" prop="doctorIds" required>
              <el-select
                v-model="batchDelayForm.doctorIds"
                multiple
                placeholder="请选择需要延后排班的医生"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="doc in doctorOptions"
                  :key="doc.userId"
                  :label="`${doc.userName} (${doc.doctorSpeciality})`"
                  :value="doc.userId"
                >
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="延后天数" prop="delayDays" required>
              <el-input-number
                v-model="batchDelayForm.delayDays"
                :min="1"
                :max="365"
                placeholder="请输入延后天数"
                style="width: 100%"
              />
              <div style="color: #909399; font-size: 12px; margin-top: 5px;">
                所选医生在时间范围内的排班将统一延后指定天数
              </div>
            </el-form-item>

            <el-form-item label="起始时段" required>
              <el-row :gutter="10">
                <el-col :span="14">
                  <el-form-item prop="startDate" style="margin-bottom: 0">
                    <el-date-picker
                      v-model="batchDelayForm.startDate"
                      type="date"
                      placeholder="选择开始日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item prop="startTimeSlot" style="margin-bottom: 0">
                    <el-select v-model="batchDelayForm.startTimeSlot" placeholder="选择时段" style="width: 100%">
                      <el-option label="上午" value="TIME0001"></el-option>
                      <el-option label="下午" value="TIME0002"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="终止时段" required>
              <el-row :gutter="10">
                <el-col :span="14">
                  <el-form-item prop="endDate" style="margin-bottom: 0">
                    <el-date-picker
                      v-model="batchDelayForm.endDate"
                      type="date"
                      placeholder="选择结束日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item prop="endTimeSlot" style="margin-bottom: 0">
                    <el-select v-model="batchDelayForm.endTimeSlot" placeholder="选择时段" style="width: 100%">
                      <el-option label="上午" value="TIME0001"></el-option>
                      <el-option label="下午" value="TIME0002"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>

            <el-alert
              title="延后逻辑说明：所选医生在开始日期到结束日期范围内的所有排班，将统一延后指定天数"
              type="info"
              show-icon
              :closable="false"
              style="margin-bottom: 20px;"
            />

            <el-form-item label="延后原因" prop="reason" required>
              <el-input
                v-model="batchDelayForm.reason"
                type="textarea"
                :rows="3"
                placeholder="请输入批量延后排班的原因"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleBatchDelaySubmit" :loading="batchDelayLoading">
                提交延后申请
              </el-button>
              <el-button @click="resetBatchDelayForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
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

    <!-- ==================== 调班申请对话框 ==================== -->
    <el-dialog
      v-model="adjustDialogVisible"
      title="调班申请"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        :model="adjustDialogForm"
        :rules="adjustDialogFormRules"
        ref="adjustDialogFormRef"
        label-width="120px"
      >
        <!-- 显示当前排班信息 -->
        <el-alert
          :title="`当前排班：${adjustDialogForm.doctorName} - ${adjustDialogForm.originalScheduleInfo}`"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />

        <!-- 调整类型 -->
        <el-form-item label="调整类型" prop="changeType" required>
          <el-radio-group v-model="adjustDialogForm.changeType">
            <el-radio :value="0">调班</el-radio>
            <el-radio :value="1">请假</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 调班信息 (仅在选择调班时显示) -->
        <template v-if="adjustDialogForm.changeType === 0">
          <el-form-item label="目标日期" prop="targetDate" required>
            <el-date-picker
              v-model="adjustDialogForm.targetDate"
              type="date"
              placeholder="选择目标日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="目标时段" prop="targetTimePeriod" required>
            <el-select v-model="adjustDialogForm.targetTimePeriod" placeholder="请选择时段" style="width: 100%">
              <el-option label="上午" :value="1"></el-option>
              <el-option label="下午" :value="2"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="目标医生" prop="targetDoctorId">
            <el-select
              v-model="adjustDialogForm.targetDoctorId"
              placeholder="可选：与其他医生换班"
              filterable
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="doc in doctorOptions"
                :key="doc.userId"
                :label="`${doc.userName} (${doc.doctorSpeciality})`"
                :value="doc.userId"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </template>

        <!-- 请假信息 (仅在选择请假时显示) -->
        <template v-if="adjustDialogForm.changeType === 1">
          <el-form-item label="请假天数" prop="daysOff" required>
            <el-input-number
              v-model="adjustDialogForm.daysOff"
              :min="1"
              :max="30"
              placeholder="请输入请假天数"
              style="width: 100%"
            />
          </el-form-item>

          <el-alert
            title="注意：请假将从原班次开始计算天数"
            type="info"
            show-icon
            :closable="false"
            style="margin-top: 10px;"
          />
        </template>

        <!-- 调整原因 -->
        <el-form-item label="调整原因" prop="reason" required>
          <el-input
            v-model="adjustDialogForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因（必填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="adjustDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDialogSubmit" :loading="adjustDialogLoading">
            提交申请
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 导入你的 API 函数
// @ts-ignore
import { getSchedulesHistory, getSchedules, createNextWeekSchedule, deleteSchedule, stopBatchSchedule, submitScheduleChangeRequest, batchDelaySchedule } from './api/scheduleApi.js'
// import { getDoctorSchedule, addSchedule } from './api/scheduleApi.js'
// import { getDepartmentOptions } from '@/views/DoctorQuery/api/doctorApi.js'
// import { getDoctorListWithFilter } from '@/views/DoctorQuery/api/doctorApi.js'

// ==================== 定义类型接口 ====================
type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
interface WeekDay {
  key: DayOfWeek;
  label: string;
}
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
  doctorId: string;
  doctorName: string;
  doctorTitle: string;
  roomNumber: string;
  remainingQuota: number;
  templateId?: string; // 添加 template_id 字段，用于调班等操作
  status: 'normal' | 'stopped'; // 排班状态：normal-正常，stopped-停诊
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
const doctorOptions = ref<DoctorOption[]>([])
const scheduleDetails = ref<ScheduleDetail[]>([])
const stopDialogVisible = ref(false)
const selectedSchedule = ref(null)

// --- 查询功能状态 ---
const queryForm = reactive({
  week: 'current',
  selectedDate: '',
  departmentId: ''
})

const showScheduleTable = ref(false)
const scheduleData = ref([{ timeSlot: '上午' }, { timeSlot: '下午' }])
const dayMap: Record<string, number> = {
  'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
}

const timeSlotMap: Record<string, string> = {
  'TIME0001': '上午',
  'TIME0002': '下午'
}

// --- 新增功能状态 ---
const addFormRef = ref<FormInstance>()
const addScheduleForm = reactive({
  week: 1, // 0=当前周，1=下一周
  schedules: {
    mon: [] as Array<{doctor_name: string, template_id: string}>,
    tue: [] as Array<{doctor_name: string, template_id: string}>,
    wed: [] as Array<{doctor_name: string, template_id: string}>,
    thu: [] as Array<{doctor_name: string, template_id: string}>,
    fri: [] as Array<{doctor_name: string, template_id: string}>,
    sat: [] as Array<{doctor_name: string, template_id: string}>,
    sun: [] as Array<{doctor_name: string, template_id: string}>
  }
})

// 一周天数列表
const weekDaysList:WeekDay[] = [
  { key: 'mon', label: '周一' },
  { key: 'tue', label: '周二' },
  { key: 'wed', label: '周三' },
  { key: 'thu', label: '周四' },
  { key: 'fri', label: '周五' },
  { key: 'sat', label: '周六' },
  { key: 'sun', label: '周日' }
]

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
// --- 批量延后排班状态 ---
const batchDelayFormRef = ref<FormInstance>()
const batchDelayLoading = ref(false)
const batchDelayForm = reactive({
  doctorIds: [] as string[],  // 医生ID数组
  delayDays: 1,               // 延后天数
  startDate: '',              // 开始日期
  startTimeSlot: 'TIME0001',  // 开始时段
  endDate: '',                // 结束日期
  endTimeSlot: 'TIME0001',    // 结束时段
  reason: ''                  // 延后原因
})

// --- 调班申请对话框状态 ---
const adjustDialogVisible = ref(false)
const adjustDialogFormRef = ref<FormInstance>()
const adjustDialogLoading = ref(false)
const dialogSourceSchedulesLoading = ref(false)
const dialogSourceSchedules = ref<ScheduleOption[]>([])
const adjustDialogForm = reactive({
  doctorId: '',
  doctorName: '',             // 用于显示
  originalScheduleId: '',
  originalScheduleInfo: '',   // 用于显示
  changeType: 0,
  targetDate: '',
  targetTimePeriod: 1,
  targetDoctorId: '',
  daysOff: 1,
  reason: ''
})

// --- 调班审批状态 ---
const requestsLoading = ref(false)
const adjustmentRequests = ref<AdjustmentRequest[]>([])

// --- 批量停诊状态 ---
const batchStopFormRef = ref<FormInstance>()
const batchStopLoading = ref(false)
const batchStopForm = reactive({
  doctorIds: [] as string[],
  startDate: '',
  startTimeSlot: 'TIME0001',
  endDate: '',
  endTimeSlot: 'TIME0001',
  reason: ''
})

// 批量停诊表单验证规则
const batchStopRules = {
  doctorIds: [
    { required: true, message: '请至少选择一位医生', trigger: 'change', type: 'array', min: 1 }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入停诊原因', trigger: 'blur' },
    { min: 2, max: 200, message: '停诊原因长度在 2 到 200 个字符', trigger: 'blur' }
  ]
}

// 批量延后排班表单验证规则
const batchDelayRules = {
  doctorIds: [
    { required: true, message: '请至少选择一位医生', trigger: 'change', type: 'array', min: 1 }
  ],
  delayDays: [
    { required: true, message: '请输入延后天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '延后天数必须在 1-365 天之间', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  startTimeSlot: [
    { required: true, message: '请选择开始时段', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ],
  endTimeSlot: [
    { required: true, message: '请选择结束时段', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入延后原因', trigger: 'blur' },
    { min: 2, max: 200, message: '延后原因长度在 2 到 200 个字符', trigger: 'blur' }
  ]
}

// 调班申请对话框表单验证规则
const adjustDialogFormRules = computed(() => {
  const baseRules = {
    changeType: [
      { required: true, message: '请选择调整类型', trigger: 'change' }
    ],
    reason: [
      { required: true, message: '请输入调整原因', trigger: 'blur' },
      { min: 2, max: 200, message: '调整原因长度在 2 到 200 个字符', trigger: 'blur' }
    ]
  }

  // 根据调整类型动态添加验证规则
  if (adjustDialogForm.changeType === 0) {
    return {
      ...baseRules,
      targetDate: [
        { required: true, message: '请选择目标日期', trigger: 'change' }
      ],
      targetTimePeriod: [
        { required: true, message: '请选择目标时段', trigger: 'change' }
      ]
    }
  } else {
    return {
      ...baseRules,
      daysOff: [
        { required: true, message: '请输入请假天数', trigger: 'blur' },
        { type: 'number', min: 1, max: 30, message: '请假天数必须在 1-30 天之间', trigger: 'blur' }
      ]
    }
  }
})

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
  // 使用模拟数据
  doctorOptions.value = [
    { userId: 'DOC0004', userName: '王崇慧', doctorSpeciality: '泌尿外科' },
    { userId: 'DOC0006', userName: '刘炳岩', doctorSpeciality: '泌尿外科' },
    { userId: 'DOC0007', userName: '严肃', doctorSpeciality: '泌尿外科' },
    {userId:'DOC0008',userName:'乔逸',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0026',userName:'冷俊胜',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0040',userName:'刘广华',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0055',userName:'叶子兴',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0059',userName:'吴兴成',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0070',userName:'周敏敏',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0071',userName:'周敬敏',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0072',userName:'周智恩',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0097',userName:'左宇志',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0116',userName:'张学斌',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0125',userName:'张玉石',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0132',userName:'张震宇',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0143',userName:'徐维锋',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0150',userName:'文进',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0164',userName:'李宏军',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0172',userName:'李永强',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0196',userName:'毛全宗',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0215',userName:'王文达',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0218',userName:'王栋',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0239',userName:'石维坤',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0245',userName:'纪志刚',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0256',userName:'肖河',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0262',userName:'范欣荣',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0264',userName:'荣石',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0267',userName:'董德鑫',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0277',userName:'谢燚',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0283',userName:'赵奕',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0286',userName:'赵扬',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0292',userName:'连鹏鹄',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0294',userName:'邓建华',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0305',userName:'郑国洋',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0354',userName:'马琳',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0362',userName:'魏梦超',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0365',userName:'黄厚锋',doctorSpeciality:'泌尿外科'},
    {userId:'DOC0367',userName:'黄钟明',doctorSpeciality:'泌尿外科'},
    { userId: '6', userName: '朱燕林', doctorSpeciality: '妇产科' }
  ]
  adjustmentRequests.value = getMockAdjustmentRequests()
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

// 处理周次查询（使用 /admin/getSchedules 接口） 输入相对周次进行查询
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
      departName: selectedDept.name  // 使用科室名称（注意：后端参数名是 departName）
    }

    console.log('==================== 周次查询调试信息 ====================')
    console.log('queryForm.week:', queryForm.week)
    console.log('weekNumber:', weekNumber)
    console.log('selectedDept:', selectedDept)
    console.log('完整请求参数:', params)
    console.log('参数类型检查:', {
      week: typeof params.week,
      departName: typeof params.departName
    })
    console.log('========================================================')

    const response = await getSchedules(params)

    console.log('==================== 后端返回数据结构 ====================')
    console.log('response:', response)
    console.log('response 类型:', typeof response)
    console.log('response 是否为数组:', Array.isArray(response))
    console.log('response 的键:', response ? Object.keys(response) : 'null')
    console.log('========================================================')

    // 处理响应数据 - 将按星期分组的数据转换为数组格式
    const convertedData: ScheduleDetail[] = []

    if (response && typeof response === 'object') {
      Object.keys(response).forEach(dayKey => {
        const dayIndex = dayMap[dayKey] as number // 明确告诉 TypeScript 这是 number
        const schedules = response[dayKey]

        if (Array.isArray(schedules)) {
          schedules.forEach((schedule: any) => {
            convertedData.push({
              id: schedule.schedule_id || '',
              timeSlot: timeSlotMap[schedule.schedule_time_id] || '未知',
              dayIndex: dayIndex,
              doctorId: schedule.doctor_id || '',
              doctorName: schedule.doctor_name || `医生${schedule.doctor_id}`,  // 暂时使用 doctor_id
              doctorTitle: schedule.doctor_title || '医师',  // 默认职称
              roomNumber: schedule.room_number || '待定',  // 默认诊室
              remainingQuota: schedule.available_slots || 0,
              templateId: schedule.schedule_time_id || '',  // 保存 template_id
              status: schedule.status === 'stopped' ? 'stopped' : 'normal'  // 设置状态
            })
          })
        }
      })
    }

    console.log('✅ 转换后的数据:', convertedData)
    scheduleDetails.value = convertedData
    showScheduleTable.value = true
  } catch (error) {
    console.error('获取排班数据失败', error)
    ElMessage.error('获取排班数据失败')
  } finally {
    loading.value = false
  }
}

// 处理日期查询（使用 /admin/GetSchedulesHistory 接口）
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
    console.log('后端返回数据:', response)
    //做一个数据结构转化
    const convertedData: ScheduleDetail[] = []
    if (response && typeof response === 'object'){
      console.log('response 的键:', Object.keys(response))
      Object.keys(response).forEach(dayKey => {
        const dayIndex = dayMap[dayKey]
        const daySchedules = response[dayKey]

        if (Array.isArray(daySchedules)) {
          daySchedules.forEach((schedule: any) => {
            convertedData.push({
              id: schedule.schedule_id || `${dayKey}_${schedule.template_id}`, // 使用真实的 schedule_id 字段
              timeSlot: timeSlotMap[schedule.template_id] || '未知',
              dayIndex: dayIndex,
              doctorId: schedule.doc_id || schedule.doctor_id || '',
              doctorName: schedule.doc_name || '未知医生',
              doctorTitle: schedule.title || '医师',
              roomNumber: schedule.room_number || '待定', // 如果没有诊室信息
              remainingQuota: parseInt(schedule.left_source_count) || 0,
              templateId: schedule.template_id || '',  // 保存 template_id
              status: schedule.status === 'stopped' ? 'stopped' : 'normal'  // 设置状态
            })
          })
        }
      })
    }else {
      console.warn('❌ response.data 不存在或不是对象:', response)
    }

    console.log('✅ 转换后的数据:', convertedData)
    console.log('✅ 转换后数据长度:', convertedData.length)
    scheduleDetails.value = convertedData
    showScheduleTable.value = true
    console.log('🔄 表格显示状态:', showScheduleTable.value)
    console.log('🔄 排班数据长度:', scheduleDetails.value.length)
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

// 为指定日期添加排班
const addScheduleForDay = (dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun') => {
  addScheduleForm.schedules[dayKey].push({
    doctor_name: '',
    template_id: 'TIME0001'
  })
}

// 删除指定日期的排班
const removeScheduleForDay = (dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', index: number) => {
  addScheduleForm.schedules[dayKey].splice(index, 1)
}

const handleAddSchedule = async () => {
  // 验证是否至少有一天有排班
  const hasSchedule = Object.values(addScheduleForm.schedules).some(daySchedules => daySchedules.length > 0)
  if (!hasSchedule) {
    ElMessage.warning('请至少为一天添加排班')
    return
  }

  // 验证所有排班是否都填写完整
  let isValid = true
  for (const [day, schedules] of Object.entries(addScheduleForm.schedules)) {
    for (const schedule of schedules) {
      if (!schedule.doctor_name || !schedule.template_id) {
        ElMessage.error(`请完整填写 ${weekDaysList.find(d => d.key === day)?.label} 的排班信息`)
        isValid = false
        return
      }
    }
  }

  if (!isValid) return

  addLoading.value = true
  try {
    console.log('=== 新增排班请求详情 ===')
    console.log('1. 完整表单数据:', JSON.stringify(addScheduleForm, null, 2))
    console.log('2. 请求体数据 (scheduleData):', JSON.stringify(addScheduleForm.schedules, null, 2))
    console.log('3. URL参数 (week):', addScheduleForm.week)
    console.log('4. 请求URL:', `/api/admin/CreateNextWeekSchedule?week=${addScheduleForm.week}`)
    console.log('========================')

    await createNextWeekSchedule(addScheduleForm.schedules, addScheduleForm.week)

    console.log('新增排班成功')
    ElMessage.success('新增排班成功！')
    resetAddForm()
    activeTab.value = 'query'
  } catch (error) {
    const err =error as any
    console.error('新增排班失败详情:', {
      message: err.message,
      response: err.response,
      config: err.config
    })

    // 更详细的错误提示
    if (err.message && err.message.includes('timeout')) {
      ElMessage.error('请求超时，可能是后端处理较慢，请联系后端开发人员检查')
    } else if (err.response) {
      ElMessage.error(`新增排班失败: ${err.response.data?.message || err.message}`)
    } else {
      ElMessage.error('新增排班失败，请检查网络连接')
    }
  } finally {
    addLoading.value = false
  }
}

const resetAddForm = () => {
  addScheduleForm.week = 1
  addScheduleForm.schedules = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: []
  }
}
// --- 批量延后排班相关方法 ---
const handleBatchDelaySubmit = async () => {
  if (!batchDelayFormRef.value) return

  try {
    // 验证表单
    await batchDelayFormRef.value.validate()

    // 验证日期范围
    if (batchDelayForm.startDate && batchDelayForm.endDate) {
      const startDateTime = new Date(batchDelayForm.startDate).getTime()
      const endDateTime = new Date(batchDelayForm.endDate).getTime()

      if (startDateTime > endDateTime) {
        ElMessage.warning('开始日期不能晚于结束日期')
        return
      }

      // 如果日期相同，检查时段
      if (startDateTime === endDateTime) {
        if (batchDelayForm.startTimeSlot === 'TIME0002' && batchDelayForm.endTimeSlot === 'TIME0001') {
          ElMessage.warning('同一天时，开始时段不能晚于结束时段')
          return
        }
      }
    }

    // 获取选中医生的名字列表
    const selectedDoctorNames = batchDelayForm.doctorIds
      .map(id => {
        const doctor = doctorOptions.value.find(doc => doc.userId === id)
        return doctor ? doctor.userName : ''
      })
      .filter(name => name)

    // 构造确认消息
    const doctorListHtml = selectedDoctorNames.length <= 5
      ? selectedDoctorNames.map(name => `<li>${name}</li>`).join('')
      : selectedDoctorNames.slice(0, 5).map(name => `<li>${name}</li>`).join('') +
        `<li>... 等共 ${selectedDoctorNames.length} 位医生</li>`

    const timeSlotMap = {
      'TIME0001': '上午',
      'TIME0002': '下午'
    }

    const confirmMessage = `
      <div style="text-align: left;">
        <p><b>将为以下医生延后排班：</b></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${doctorListHtml}
        </ul>
        <p><b>时间范围：</b></p>
        <p style="margin-left: 20px;">
          从 ${batchDelayForm.startDate} ${timeSlotMap[batchDelayForm.startTimeSlot]} 到 ${batchDelayForm.endDate} ${timeSlotMap[batchDelayForm.endTimeSlot]}
        </p>
        <p><b>延后天数：</b> ${batchDelayForm.delayDays} 天</p>
        <p style="margin-top: 15px;">是否确认继续？</p>
      </div>
    `

    // 确认操作
    await ElMessageBox.confirm(
      confirmMessage,
      '批量延后排班确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    batchDelayLoading.value = true

    // 构造请求数据
    const requestData = {
      doc_ids: batchDelayForm.doctorIds,
      delay_days: batchDelayForm.delayDays,
      start_time: {
        date: batchDelayForm.startDate,
        template_id: batchDelayForm.startTimeSlot
      },
      end_time: {
        date: batchDelayForm.endDate,
        template_id: batchDelayForm.endTimeSlot
      },
      reason: batchDelayForm.reason
    }

    console.log('批量延后排班请求数据:', requestData)

    // 调用API
    await batchDelaySchedule(requestData)

    ElMessage.success('批量延后排班提交成功！')

    // 重置表单
    resetBatchDelayForm()

    // 重新查询排班数据
    handleQueryClick()

  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消批量延后排班操作')
    } else {
      console.error('批量延后排班失败:', error)
      ElMessage.error('批量延后排班提交失败，请重试')
    }
  } finally {
    batchDelayLoading.value = false
  }
}

// 重置批量延后排班表单
const resetBatchDelayForm = () => {
  if (batchDelayFormRef.value) {
    batchDelayFormRef.value.resetFields()
  }
  batchDelayForm.doctorIds = []
  batchDelayForm.delayDays = 1
  batchDelayForm.startDate = ''
  batchDelayForm.startTimeSlot = 'TIME0001'
  batchDelayForm.endDate = ''
  batchDelayForm.endTimeSlot = 'TIME0001'
  batchDelayForm.reason = ''
}

// --- 调班申请对话框相关方法 ---
// 重置对话框表单
const resetAdjustDialogForm = () => {
  if (adjustDialogFormRef.value) {
    adjustDialogFormRef.value.resetFields()
  }
  adjustDialogForm.doctorId = ''
  adjustDialogForm.doctorName = ''
  adjustDialogForm.originalScheduleId = ''
  adjustDialogForm.originalScheduleInfo = ''
  adjustDialogForm.changeType = 0
  adjustDialogForm.targetDate = ''
  adjustDialogForm.targetTimePeriod = 1
  adjustDialogForm.targetDoctorId = ''
  adjustDialogForm.daysOff = 1
  adjustDialogForm.reason = ''
}

// 关闭对话框
const handleDialogClose = () => {
  resetAdjustDialogForm()
}

// 提交对话框表单
const handleDialogSubmit = async () => {
  if (!adjustDialogFormRef.value) return

  try {
    // 验证表单
    await adjustDialogFormRef.value.validate()

    adjustDialogLoading.value = true

    // 构造请求数据
    const requestData: any = {
      doctorId: adjustDialogForm.doctorId,
      originalScheduleId: adjustDialogForm.originalScheduleId,
      changeType: adjustDialogForm.changeType,
      reason: adjustDialogForm.reason
    }

    // 根据调整类型添加相应字段
    if (adjustDialogForm.changeType === 0) {
      // 调班类型
      requestData.targetDate = adjustDialogForm.targetDate
      requestData.targetTimePeriod = adjustDialogForm.targetTimePeriod
      if (adjustDialogForm.targetDoctorId) {
        requestData.targetDoctorId = adjustDialogForm.targetDoctorId
      }
    } else {
      // 请假类型
      requestData.daysOff = adjustDialogForm.daysOff
    }

    console.log('对话框提交的调班申请数据:', requestData)

    // 调用API
    await submitScheduleChangeRequest(requestData)

    ElMessage.success('调班申请提交成功！')

    // 关闭对话框
    adjustDialogVisible.value = false

    // 重新查询排班数据（可选）
    // handleQueryClick()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交调班申请失败:', error)
      ElMessage.error(error.message || '提交失败，请重试')
    }
  } finally {
    adjustDialogLoading.value = false
  }
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

// --- 排班卡片操作方法 ---
const handleAdjustSchedule = (schedule: ScheduleDetail) => {
  console.log('🔄 调班操作 - 选中的排班信息:', {
    排班ID: schedule.id,
    医生ID: schedule.doctorId,
    医生姓名: schedule.doctorName,
    医生职称: schedule.doctorTitle,
    时间段: schedule.timeSlot,
    星期索引: schedule.dayIndex,
    诊室: schedule.roomNumber,
    剩余号源: schedule.remainingQuota
  })

  // 计算日期信息（根据weekDays和dayIndex）
  const dayInfo = weekDays.value[schedule.dayIndex]
  const scheduleInfo = dayInfo ? `${dayInfo.date} ${schedule.timeSlot}` : schedule.timeSlot

  // 重置对话框表单
  resetAdjustDialogForm()

  // 填充排班信息
  adjustDialogForm.doctorId = schedule.doctorId
  adjustDialogForm.doctorName = schedule.doctorName
  adjustDialogForm.originalScheduleId = schedule.id
  adjustDialogForm.originalScheduleInfo = scheduleInfo

  // 打开对话框
  adjustDialogVisible.value = true
}

const handleDeleteSchedule = async (schedule: ScheduleDetail) => {
  console.log('删除排班操作 - 选中的排班信息:', {
    排班ID: schedule.id,
    模板ID: schedule.templateId,
    医生姓名: schedule.doctorName,
    医生职称: schedule.doctorTitle,
    时间段: schedule.timeSlot,
    星期索引: schedule.dayIndex,
    诊室: schedule.roomNumber,
    剩余号源: schedule.remainingQuota
  })

  try {
    const {value:reason}=await ElMessageBox.prompt(
      `正在设置<b> ${schedule.doctorName} 的排班为停诊</b><br/>
        时间：${schedule.timeSlot}<br/>诊室：${schedule.roomNumber}<br/><br/>
       <b>请输入停诊理由:</b>`,
      '删除排班确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        inputType:'textarea',
        inputPlaceholder: '请输入停诊理由',
        inputValidator: (value) => value.trim().length>0,
        inputErrorMessage:'删除理由不能为空'
      }
    )

    // 调用停诊 API
    loading.value = true
    await deleteSchedule({schedule_id: schedule.id, reason: reason})

    ElMessage.success('设置停诊成功！')

    // 更新本地排班状态为停诊，而不是删除
    const targetSchedule = scheduleDetails.value.find(s => s.id === schedule.id)
    if (targetSchedule) {
      targetSchedule.status = 'stopped'
    }

  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消删除')
    } else {
      console.error('删除排班失败:', error)
      ElMessage.error('删除排班失败，请重试')
    }
  } finally {
    loading.value = false
  }
}




// --- 批量停诊相关方法 ---
const handleBatchStop = async () => {
  if (!batchStopFormRef.value) return

  try {
    // 验证表单
    await batchStopFormRef.value.validate()

    // 验证日期范围
    if (batchStopForm.startDate && batchStopForm.endDate) {
      const startDateTime = new Date(batchStopForm.startDate).getTime()
      const endDateTime = new Date(batchStopForm.endDate).getTime()

      if (startDateTime > endDateTime) {
        ElMessage.warning('开始日期不能晚于结束日期')
        return
      }

      // 如果日期相同，检查时段
      if (startDateTime === endDateTime) {
        if (batchStopForm.startTimeSlot === 'TIME0002' && batchStopForm.endTimeSlot === 'TIME0001') {
          ElMessage.warning('同一天时，开始时段不能晚于结束时段')
          return
        }
      }
    }

    // 获取选中医生的名字列表
    const selectedDoctorNames = batchStopForm.doctorIds
      .map(id => {
        const doctor = doctorOptions.value.find(doc => doc.userId === id)
        return doctor ? doctor.userName : ''
      })
      .filter(name => name)

    // 构造确认消息
    const doctorListHtml = selectedDoctorNames.length <= 5
      ? selectedDoctorNames.map(name => `<li>${name}</li>`).join('')
      : selectedDoctorNames.slice(0, 5).map(name => `<li>${name}</li>`).join('') +
        `<li>... 等共 ${selectedDoctorNames.length} 位医生</li>`

    const confirmMessage = `
      <div style="text-align: left;">
        <p><b>将为以下医生设置停诊：</b></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${doctorListHtml}
        </ul>
        <p><b>停诊时段：</b></p>
        <p style="margin-left: 20px;">
          从 ${batchStopForm.startDate} ${batchStopForm.startTimeSlot === 'TIME0001' ? '上午' : '下午'}
          到 ${batchStopForm.endDate} ${batchStopForm.endTimeSlot === 'TIME0001' ? '上午' : '下午'}
        </p>
        <p style="margin-top: 15px;">是否确认继续？</p>
      </div>
    `

    // 确认操作
    await ElMessageBox.confirm(
      confirmMessage,
      '批量停诊确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    batchStopLoading.value = true

    // 构造请求数据
    const requestData = {
      doc_ids: batchStopForm.doctorIds,
      start_time: {
        date: batchStopForm.startDate,
        template_id: batchStopForm.startTimeSlot
      },
      end_time: {
        date: batchStopForm.endDate,
        template_id: batchStopForm.endTimeSlot
      },
      reason: batchStopForm.reason
    }

    console.log('批量停诊请求数据:', requestData)

    // 调用API
    await stopBatchSchedule(requestData)

    ElMessage.success('批量停诊设置成功！')

    // 重置表单
    resetBatchStopForm()

    // 重新查询排班数据
    handleQueryClick()

  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消批量停诊操作')
    } else {
      console.error('批量停诊失败:', error)
      ElMessage.error('批量停诊设置失败，请重试')
    }
  } finally {
    batchStopLoading.value = false
  }
}

const resetBatchStopForm = () => {
  if (batchStopFormRef.value) {
    batchStopFormRef.value.resetFields()
  }
  batchStopForm.doctorIds = []
  batchStopForm.startDate = ''
  batchStopForm.startTimeSlot = 'TIME0001'
  batchStopForm.endDate = ''
  batchStopForm.endTimeSlot = 'TIME0001'
  batchStopForm.reason = ''
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
  position: relative;
}
.doctor-schedule-card.clickable {
  transition: all 0.3s ease;
}
.doctor-schedule-card.clickable:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
.doctor-schedule-card.clickable:hover .card-actions {
  opacity: 1;
}
.doctor-schedule-card.stopped {
  background-color: #f4f4f5;
  opacity: 0.8;
}
.doctor-schedule-card.stopped:hover {
  background-color: #f4f4f5;
  border-color: #e4e7ed;
  transform: none;
  box-shadow: none;
}
.card-content {
  margin-bottom: 4px;
}
.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.card-actions .el-button {
  padding: 2px 4px;
  font-size: 12px;
}
.doctor-name {
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-tag {
  margin-left: 4px;
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

/* 批量新增排班样式 */
.week-schedule-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.day-card {
  min-height: 150px;
}

.day-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.empty-hint {
  color: #909399;
  text-align: center;
  padding: 30px 0;
  font-size: 14px;
}

.schedule-item {
  margin-bottom: 12px;
}

.schedule-item:last-child {
  margin-bottom: 0;
}

/* 批量停诊样式 */
.batch-stop-divider {
  margin-top: 30px;
  margin-bottom: 20px;
}

.batch-stop-card {
  border: 1px solid #e4e7ed;
  background-color: #f9fafc;
}

.batch-stop-card :deep(.el-card__body) {
  padding: 20px;
}
</style>
