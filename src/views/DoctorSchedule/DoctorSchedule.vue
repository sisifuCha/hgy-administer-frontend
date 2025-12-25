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
                    :class="{ 'stopped': schedule.status === -1 }"
                  >
                    <div class="card-content">
                      <div class="doctor-name">
                        {{ schedule.doctorName }} ({{ schedule.doctorTitle }})
                        <el-tag v-if="schedule.status === -1" type="info" size="small" class="status-tag">停诊</el-tag>
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
                        :disabled="schedule.status === -1"
                      >
                        调班
                      </el-button>
                      <el-button
                        type="danger"
                        size="small"
                        link
                        @click="handleDeleteSchedule(schedule)"
                        title="设置停诊"
                        :disabled="schedule.status === -1"
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
                  <el-form-item label="选择科室" prop="department" required>
                    <el-select
                      v-model="batchStopForm.department"
                      placeholder="请选择科室"
                      filterable
                      style="width: 100%"
                      @change="handleDepartmentChange"
                    >
                      <el-option
                        v-for="dept in departments"
                        :key="dept.id"
                        :label="dept.name"
                        :value="dept.name"
                      >
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="选择医生" prop="doctorIds" required>
                    <el-select
                      v-model="batchStopForm.doctorIds"
                      multiple
                      placeholder="请选择需要停诊的医生"
                      filterable
                      style="width: 100%"
                      :disabled="!batchStopForm.department"
                    >
                      <el-option
                        v-for="doc in doctorOptions"
                        :key="doc.userid"
                        :label="`${doc.username} (${doc.department})`"
                        :value="doc.userid"
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
                            <el-option
                              v-for="slot in availableTimeSlots"
                              :key="slot.value"
                              :label="slot.label"
                              :value="slot.value"
                            ></el-option>
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
                            <el-option
                              v-for="slot in availableTimeSlots"
                              :key="slot.value"
                              :label="slot.label"
                              :value="slot.value"
                            ></el-option>
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
          <el-form-item label="选择科室" prop="department" required>
            <el-select
              v-model="addScheduleForm.department"
              placeholder="请选择科室"
              filterable
              style="width: 100%"
              @change="(value) => {
                // 清空已添加的所有排班
                Object.keys(addScheduleForm.schedules).forEach(key => {
                  addScheduleForm.schedules[key] = []
                })
                fetchDoctorsByDepartment(value)
              }"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.name"
              >
              </el-option>
            </el-select>
          </el-form-item>
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
                      <el-select v-model="schedule.doctor_name" placeholder="选择医生" filterable style="width: 100%" :disabled="!addScheduleForm.department">
                        <el-option
                          v-for="doc in doctorOptions"
                          :key="doc.userid"
                          :label="`${doc.username} (${doc.department})`"
                          :value="doc.username">
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
            <el-form-item label="选择科室" prop="department" required>
              <el-select
                v-model="batchDelayForm.department"
                placeholder="请选择科室"
                filterable
                style="width: 100%"
                @change="(value) => {
                  batchDelayForm.doctorIds = []
                  fetchDoctorsByDepartment(value)
                }"
              >
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.name"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="选择医生" prop="doctorIds" required>
              <el-select
                v-model="batchDelayForm.doctorIds"
                multiple
                placeholder="请选择需要延后排班的医生"
                filterable
                style="width: 100%"
                :disabled="!batchDelayForm.department"
              >
                <el-option
                  v-for="doc in doctorOptions"
                  :key="doc.userid"
                  :label="`${doc.username} (${doc.department})`"
                  :value="doc.userid"
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
                      <el-option
                        v-for="slot in availableTimeSlots"
                        :key="slot.value"
                        :label="slot.label"
                        :value="slot.value"
                      ></el-option>
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
                      <el-option
                        v-for="slot in availableTimeSlots"
                        :key="slot.value"
                        :label="slot.label"
                        :value="slot.value"
                      ></el-option>
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

      <!-- ==================== 4. 调班审批标签页==================== -->
      <el-tab-pane label="调班审批" name="approve">
        <h2>调班申请查询</h2>

        <!-- 查询条件区域 -->
        <div class="query-conditions">
          <el-form :inline="true">
            <el-form-item label="申请状态">
              <el-select v-model="shiftRequestsQuery.status" placeholder="选择状态" style="width: 150px">
                <el-option label="待处理" value="PENDING"></el-option>
                <el-option label="已批准" value="APPROVED"></el-option>
                <el-option label="已驳回" value="REJECTED"></el-option>
                <el-option label="全部" value="ALL"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="申请类型">
              <el-select v-model="shiftRequestsQuery.type" placeholder="选择类型" style="width: 150px">
                <el-option label="全部" value="ALL"></el-option>
                <el-option label="调班" value="SHIFT_CHANGE"></el-option>
                <el-option label="请假" value="LEAVE"></el-option>
              </el-select>
            </el-form-item>

            <!-- 暂时注释：按医生ID查询 -->
            <!-- <el-form-item label="医生ID">
              <el-input v-model="shiftRequestsQuery.doc_id" placeholder="输入医生ID" clearable style="width: 150px"></el-input>
            </el-form-item> -->

            <!-- 暂时注释：按日期范围查询 -->
            <!-- <el-form-item label="目标日期范围">
              <el-date-picker
                v-model="shiftRequestsQuery.targetDateFrom"
                type="date"
                placeholder="开始日期"
                value-format="YYYY-MM-DD"
                style="width: 150px"
              />
              <span style="margin: 0 5px">至</span>
              <el-date-picker
                v-model="shiftRequestsQuery.targetDateTo"
                type="date"
                placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 150px"
              />
            </el-form-item> -->

            <el-form-item>
              <el-button type="primary" @click="handleShiftRequestsQuery" :loading="shiftRequestsLoading">查询</el-button>
              <el-button @click="handleShiftRequestsReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 申请列表表格 -->
        <el-table :data="shiftRequestsList" v-loading="shiftRequestsLoading" border>
          <el-table-column prop="id" label="申请ID" width="80"></el-table-column>
          <el-table-column prop="doctorName" label="申请医生" width="120"></el-table-column>
          <el-table-column prop="type" label="申请类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'SHIFT_CHANGE' ? 'primary' : 'warning'">
                {{ row.type === 'SHIFT_CHANGE' ? '调班' : '请假' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetDate" label="目标日期" width="120"></el-table-column>
          <el-table-column label="相关排班ID" width="180">
            <template #default="{ row }">
              <div>原排班: {{ row.originalScheduleId }}</div>
              <div v-if="row.targetScheduleId">目标排班: {{ row.targetScheduleId }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="leaveLength" label="请假天数" width="100">
            <template #default="{ row }">
              {{ row.leaveLength || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="申请理由" show-overflow-tooltip min-width="150"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : 'danger'"
              >
                {{ row.status === 'PENDING' ? '待处理' : row.status === 'APPROVED' ? '已批准' : '已驳回' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                type="success"
                @click="handleApprove(row.id.toString())"
                :disabled="row.status !== 'PENDING'"
              >
                批准
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleReject(row.id.toString())"
                :disabled="row.status !== 'PENDING'"
              >
                驳回
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="shiftRequestsQuery.page"
            v-model:page-size="shiftRequestsQuery.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="shiftRequestsTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handleShiftRequestsPageChange"
            @size-change="handleShiftRequestsPageSizeChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>


  </div>

  <!-- 调班申请对话框 -->
  <el-dialog
    v-model="adjustDialogVisible"
    title="排班变更申请"
    width="600px"
    :close-on-click-modal="false"
    :before-close="handleDialogClose"
  >
    <el-form
      :model="adjustDialogForm"
      :rules="adjustDialogFormRules"
      ref="adjustDialogFormRef"
      label-width="120px"
    >
      <!-- 显示当前排班信息 -->
      <el-alert
        :title="`当前排班：${adjustDialogForm.doctorName}`"
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

      <!-- 目标日期 (仅调班时显示) -->
      <el-form-item label="目标日期" prop="targetDate" v-if="adjustDialogForm.changeType === 0">
        <el-date-picker
          v-model="adjustDialogForm.targetDate"
          type="date"
          placeholder="选择目标日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 目标时段 (仅调班时显示) -->
      <el-form-item label="目标时段" prop="targetTime" v-if="adjustDialogForm.changeType === 0">
        <el-select v-model="adjustDialogForm.targetTime" placeholder="选择目标时段" style="width: 100%">
          <el-option label="上午" :value="'TIME0001'"></el-option>
          <el-option label="下午" :value="'TIME0002'"></el-option>
        </el-select>
      </el-form-item>

      <!-- 调整原因 -->
      <el-form-item label="调整原因" prop="reason" required>
        <el-input
          v-model="adjustDialogForm.reason"
          type="textarea"
          :rows="4"
          placeholder="请输入调整原因"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="handleSubmitAdjustment" :loading="adjustDialogLoading">
          提交申请
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
// 导入你的 API 函数
// @ts-ignore
import { getSchedulesHistory, getSchedules, createNextWeekSchedule, deleteSchedule, stopBatchSchedule, batchDelaySchedule, getShiftRequests, handleShiftRequest, submitScheduleChangeRequest, getDoctorOptions, getDoctorsByDepartment, requestScheduleAdjustment } from './api/scheduleApi.js'
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
  userid: string;
  username: string;
  department: string;
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
  status: number; // 排班状态：0-还没开始, 1-进行中, 2-已结束, -1-停诊
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

// 调班申请列表项类型（新接口返回的数据结构）
interface ShiftRequestItem {
  id: number;
  doctorId: number;
  doctorName: string;
  originalScheduleId: number;
  targetScheduleId: number | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  targetDate: string;
  type: 'SHIFT_CHANGE' | 'LEAVE';
  leaveLength: number | null;
}

// 调班申请查询响应类型
interface ShiftRequestsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: ShiftRequestItem[];
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

// --- 调班申请状态 ---
const adjustDialogVisible = ref(false)
const adjustDialogFormRef = ref<FormInstance>()
const adjustDialogLoading = ref(false)
const adjustDialogForm = reactive({
  id: '',
  doc_id: '',
  doctorName: '',
  changeType: 0, // 0: 调班, 1: 请假
  targetDate: '',
  targetTime: 'TIME0001', // 默认上午
  reason: ''
})

// 调班申请表单验证规则
const adjustDialogFormRules = reactive({
  changeType: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  targetDate: [{ required: adjustDialogForm.changeType === 0, message: '请选择目标日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' },
          { min: 2, max: 200, message: '调整原因长度在 2 到 200 个字符', trigger: 'blur' }]
})

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
  department: '', // 新增科室选择
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
    // 生成完整的yyyy-MM-dd格式日期
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    days.push({
      dayName: dayNames[i],
      date: `${year}-${month}-${day}`
    })
  }
  return days
})

// 从查询结果中提取可用的时段选项
const availableTimeSlots = computed(() => {
  // 从 scheduleDetails 中提取所有唯一的 templateId
  const uniqueTemplateIds = new Set<string>()

  scheduleDetails.value.forEach(schedule => {
    if (schedule.templateId) {
      uniqueTemplateIds.add(schedule.templateId)
    }
  })

  // 如果没有查询数据，返回默认选项
  if (uniqueTemplateIds.size === 0) {
    return [
      { label: '上午', value: 'TIME0001' },
      { label: '下午', value: 'TIME0002' }
    ]
  }

  // 根据 templateId 生成选项列表
  const options = Array.from(uniqueTemplateIds).map(templateId => ({
    label: timeSlotMap[templateId] || templateId,
    value: templateId
  }))

  // 按 templateId 排序
  options.sort((a, b) => a.value.localeCompare(b.value))

  return options
})

// ==================== 状态管理 ====================
// --- 批量延后排班状态 ---
const batchDelayFormRef = ref<FormInstance>()
const batchDelayLoading = ref(false)
const batchDelayForm = reactive({
  department: '',             // 新增科室选择
  doctorIds: [] as string[],  // 医生ID数组
  delayDays: 1,               // 延后天数
  startDate: '',              // 开始日期
  startTimeSlot: 'TIME0001',  // 开始时段
  endDate: '',                // 结束日期
  endTimeSlot: 'TIME0001',    // 结束时段
  reason: ''                  // 延后原因
})



// --- 调班审批状态 ---
const requestsLoading = ref(false)
const adjustmentRequests = ref<AdjustmentRequest[]>([])

// 新的调班申请查询相关状态
const shiftRequestsLoading = ref(false)
const shiftRequestsList = ref<ShiftRequestItem[]>([])
const shiftRequestsTotal = ref(0)
const shiftRequestsQuery = reactive({
  status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL',
  type: 'ALL' as 'SHIFT_CHANGE' | 'LEAVE' | 'ALL',
  // doc_id: '',  // 可选，暂时注释
  // targetDateFrom: '',  // 可选，暂时注释
  // targetDateTo: '',    // 可选，暂时注释
  page: 1,
  pageSize: 10
})

// --- 批量停诊状态 ---
const batchStopFormRef = ref<FormInstance>()
const batchStopLoading = ref(false)
const batchStopForm = reactive({
  department: '', // 新增科室选择
  doctorIds: [] as string[],
  startDate: '',
  startTimeSlot: 'TIME0001',
  endDate: '',
  endTimeSlot: 'TIME0001',
  reason: ''
})

// 批量停诊表单验证规则
const batchStopRules = {
  department: [
    { required: true, message: '请选择科室', trigger: 'change' }
  ],
  doctorIds: [
    { required: true, message: '请至少选择一位医生', trigger: 'change', type: 'array', min: 1 }
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
    { required: true, message: '请输入停诊原因', trigger: 'blur' },
    { min: 2, max: 200, message: '停诊原因长度在 2 到 200 个字符', trigger: 'blur' }
  ]
}

// 批量延后排班表单验证规则
const batchDelayRules = {
  department: [
    { required: true, message: '请选择科室', trigger: 'change' }
  ],
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



// --- 生命周期函数 ---
onMounted(() => {
  // 设置科室数据
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
  
  // 初始加载科室数据
  // 现在不再直接加载所有医生，而是根据科室选择动态加载
  
  adjustmentRequests.value = getMockAdjustmentRequests()
})

// --- 方法 ---
// 根据科室获取医生列表
const fetchDoctorsByDepartment = async (departmentName: string) => {
  if (!departmentName) {
    doctorOptions.value = []
    return
  }
  
  try {
    // 调用API根据科室获取医生信息
    const response = await getDoctorsByDepartment(departmentName)
    
    // 检查响应数据格式
    if (response && response.data && Array.isArray(response.data)) {
      // 过滤出有用户ID的医生数据
      const filteredDoctors = response.data.filter((doc: any) => doc.userid)
      console.log('根据科室获取的医生数据:', response.data) 
      // 转换为前端需要的格式
      doctorOptions.value = filteredDoctors.map((doc: any) => ({
        userid: doc.userid, // 医生ID
        username: doc.username, // 医生名字
        department: doc.department || '未指定科室' // 使用科室名称代替专长
      }))
      
      console.log(`成功加载 ${doctorOptions.value.length} 名医生`)
    } else {
      console.warn('未获取到医生数据，使用默认模拟数据')
        // 如果API没有返回数据，使用默认模拟数据
        doctorOptions.value = [
          { userid: 'DOC0004', username: '王崇慧', department: '泌尿外科' },
          { userid: 'DOC0006', username: '刘炳岩', department: '泌尿外科' },
          { userid: 'DOC0007', username: '严肃', department: '泌尿外科' },
          { userid: 'DOC0008', username: '乔逸', department: '泌尿外科' },
          { userid: '6', username: '朱燕林', department: '妇产科' }
        ]
    }
  } catch (error) {
    console.error('获取医生列表异常:', error)
    // 如果API请求异常，保持当前医生数据不变
  }
}

// 科室变化时获取医生列表
const handleDepartmentChange = (departmentName: string) => {
  console.log('选择的科室:', departmentName)
  // 清空已选择的医生
  batchStopForm.doctorIds = []
  // 获取该科室的医生列表
  fetchDoctorsByDepartment(departmentName)
}



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
    console.log('response.data:', response.data)
    console.log('========================================================')

    // 处理响应数据 - 将按星期分组的数据转换为数组格式
    const convertedData: ScheduleDetail[] = []

    // 获取实际的排班数据（后端返回的数据在 response.data 中）
    const scheduleData = response.data || {}

    console.log("scheduleData:", scheduleData)

    if (scheduleData && typeof scheduleData === 'object') {
      Object.keys(scheduleData).forEach(dayKey => {
        const dayIndex = dayMap[dayKey] as number // 明确告诉 TypeScript 这是 number
        const schedules = scheduleData[dayKey]
        console.log(`处理 ${dayKey} 的排班数据:`, schedules)

        if (Array.isArray(schedules)) {
          schedules.forEach((schedule: any) => {
            convertedData.push({
              id: schedule.id || '',
              timeSlot: timeSlotMap[schedule.template_id] || '未知',  // 使用 template_id 映射时间段
              dayIndex: dayIndex,
              doctorId: schedule.doc_id || '',  // 使用组合ID作为医生ID
              doctorName: schedule.doc_name || '未知医生',  // 后端返回的是 doc_name
              doctorTitle: schedule.title || '医师',  // 后端返回的是 title
              roomNumber: '待定',  // 后端没有返回该字段
              remainingQuota: parseInt(schedule.left_source_count) || 0,  // 后端返回的是 left_source_count
              templateId: schedule.template_id || '',  // 后端返回的是 template_id
              status: schedule.status // 直接使用后端返回的整数状态
            })
          })
        }
      })
    }

    console.log('✅ 转换后的数据:', convertedData)
    scheduleDetails.value = convertedData
    console.log('🔄 表格显示状态:', showScheduleTable.value)
    console.log("scheduleDetails.value:", scheduleDetails)
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
              status: schedule.status // 直接使用后端返回的整数状态
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
  addScheduleForm.department = ''
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
  // 清空医生选项
  doctorOptions.value = []
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
        const doctor = doctorOptions.value.find(doc => doc.userid === id)
        return doctor ? doctor.username : ''
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

// 查询调班申请列表（新接口）
const fetchShiftRequests = async () => {
  shiftRequestsLoading.value = true
  try {
    const params = {
      status: shiftRequestsQuery.status,
      type: shiftRequestsQuery.type,
      // doc_id: shiftRequestsQuery.doc_id || undefined,
      // targetDateFrom: shiftRequestsQuery.targetDateFrom || undefined,
      // targetDateTo: shiftRequestsQuery.targetDateTo || undefined,
      page: shiftRequestsQuery.page,
      pageSize: shiftRequestsQuery.pageSize
    }

    const response = await getShiftRequests(params) as any
    console.log("查询调班申请响应:", response.data.items)

    // 字段映射：将后端字段名转换为前端期望的字段名
    const mappedItems = (response.data.items || []).map((item: any) => ({
      id: item.id,
      doctorId: item.docId,           // 后端: docId → 前端: doctorId
      doctorName: item.docName,        // 后端: docName → 前端: doctorName
      originalScheduleId: item.oriScheId,  // 后端: oriScheId → 前端: originalScheduleId
      targetScheduleId: item.targetScheId, // 后端: targetScheId → 前端: targetScheduleId
      reason: item.reason,
      status: item.status,
      targetDate: item.targetDate,
      type: item.type === 0 ? 'SHIFT_CHANGE' : 'LEAVE',  // 后端: 0/1 → 前端: 'SHIFT_CHANGE'/'LEAVE'
      leaveLength: item.leaveLength
    }))

    shiftRequestsList.value = mappedItems
    shiftRequestsTotal.value = response.total || 0

    console.log('📋 查询调班申请成功:', {
      总记录数: response.total,
      当前页: response.page,
      每页条数: response.pageSize,
      返回记录数: mappedItems.length,
      映射后的数据: mappedItems
    })
  } catch (error) {
    console.error('查询调班申请失败:', error)
    ElMessage.error('查询调班申请列表失败')
    shiftRequestsList.value = []
    shiftRequestsTotal.value = 0
  } finally {
    shiftRequestsLoading.value = false
  }
}

// 处理查询按钮点击
const handleShiftRequestsQuery = () => {
  shiftRequestsQuery.page = 1  // 重置到第一页
  fetchShiftRequests()
}

// 处理分页变化
const handleShiftRequestsPageChange = (page: number) => {
  shiftRequestsQuery.page = page
  fetchShiftRequests()
}

// 处理每页条数变化
const handleShiftRequestsPageSizeChange = (pageSize: number) => {
  shiftRequestsQuery.pageSize = pageSize
  shiftRequestsQuery.page = 1  // 重置到第一页
  fetchShiftRequests()
}

// 重置查询条件
const handleShiftRequestsReset = () => {
  shiftRequestsQuery.status = 'PENDING'
  shiftRequestsQuery.type = 'ALL'
  // shiftRequestsQuery.doc_id = ''
  // shiftRequestsQuery.targetDateFrom = ''
  // shiftRequestsQuery.targetDateTo = ''
  shiftRequestsQuery.page = 1
  shiftRequestsQuery.pageSize = 10
  fetchShiftRequests()
}

const handleApprove = async (requestId: string) => {
  try {
    await ElMessageBox.confirm('确定要批准这个调班申请吗?', '提示', { type: 'warning' })

    await handleShiftRequest(requestId, 'APPROVE')
    ElMessage.success('已批准')

    // 重新加载列表
    await fetchShiftRequests()
  } catch (error: any) {
    // 用户取消操作时不显示错误
    if (error !== 'cancel' && error !== 'close') {
      console.error('批准申请失败:', error)
      ElMessage.error('批准失败，请稍后重试')
    }
  }
}

const handleReject = async (requestId: string) => {
  try {
    await ElMessageBox.confirm('确定要驳回这个调班申请吗?', '提示', { type: 'warning' })

    await handleShiftRequest(requestId, 'REJECT')
    ElMessage.success('已驳回')

    // 重新加载列表
    await fetchShiftRequests()
  } catch (error: any) {
    // 用户取消操作时不显示错误
    if (error !== 'cancel' && error !== 'close') {
      console.error('驳回申请失败:', error)
      ElMessage.error('驳回失败，请稍后重试')
    }
  }
}

// --- 排班卡片操作方法 ---

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

    // 重新加载排班数据，确保显示最新的停诊状态
    if (queryForm.week) {
      await handleQueryByWeek()
    } else if (queryForm.selectedDate) {
      await handleQuery()
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

// --- 调班申请相关方法 ---
// 处理调班按钮点击事件
const handleAdjustSchedule = (schedule: ScheduleDetail) => {
  console.log("处理调班按钮点击事件 - 选中的排班信息:", schedule)
  // 初始化表单数据
  adjustDialogForm.id = schedule.id
  adjustDialogForm.doc_id = schedule.doctorId
  adjustDialogForm.doctorName = schedule.doctorName
  adjustDialogForm.changeType = 0
  adjustDialogForm.targetDate = ''
  adjustDialogForm.targetTime = 'TIME0001'
  adjustDialogForm.reason = ''
  
  // 打开对话框
  adjustDialogVisible.value = true
}

// 提交调班申请
const handleSubmitAdjustment = async () => {
  if (!adjustDialogFormRef.value) return
  
  try {
    // 验证表单
    await adjustDialogFormRef.value.validate()
    
    adjustDialogLoading.value = true
    console.log("调整排班表单数据:", adjustDialogForm)
    // 构造请求数据
    const requestData = {
      doc_id: adjustDialogForm.doc_id,
      id: adjustDialogForm.id,
      changeType: adjustDialogForm.changeType,
      targetDate: adjustDialogForm.changeType === 0 ? adjustDialogForm.targetDate : undefined,
      targetTime: adjustDialogForm.changeType === 0 ? adjustDialogForm.targetTime : undefined,
      reason: adjustDialogForm.reason
    }
    console.log('提交调班申请数据:', requestData)
    
    // 调用API
    await submitScheduleChangeRequest(requestData)
    
    ElMessage.success('排班变更申请提交成功！')
    
    // 关闭对话框
    adjustDialogVisible.value = false
    
    // 重置表单
    resetAdjustDialogForm()
    
    // 重新查询排班数据
    handleQueryClick()
    
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消操作')
    } else {
      console.error('提交排班变更申请失败:', error)
      ElMessage.error('提交排班变更申请失败，请重试')
    }
  } finally {
    adjustDialogLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  adjustDialogVisible.value = false
  resetAdjustDialogForm()
}

// 重置调班申请表单
const resetAdjustDialogForm = () => {
  if (adjustDialogFormRef.value) {
    adjustDialogFormRef.value.resetFields()
  }
  adjustDialogForm.id = ''
  adjustDialogForm.doc_id = ''
  adjustDialogForm.doctorName = ''
  adjustDialogForm.changeType = 0
  adjustDialogForm.targetDate = ''
  adjustDialogForm.targetTime = 'TIME0001'
  adjustDialogForm.reason = ''
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
        const doctor = doctorOptions.value.find(doc => doc.userid === id)
        return doctor ? doctor.username : ''
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