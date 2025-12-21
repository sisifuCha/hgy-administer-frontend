<script setup lang="ts">
// 定义组件名称
const __name__ = 'RuleManagement'

// 导入必要的组件和API
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import api from './api'
import { Plus, Delete } from '@element-plus/icons-vue'

// 规则数据
const ruleData = reactive({
  register_rule: {
    extra_register_time: [
      {
        reason: '',
        time: ''
      }
    ],
    release_time: ''
  },
  refund_fee_rule: {
    gradients: [
      {
        name: '',
        time_condition: '',
        fee_ratio: 0
      }
    ]
  },
  waiting_rules: [
    {
      id: 0,
      ruleName: '',
      ruleValue: 0,
      description: '',
      createdAt: '',
      updatedAt: ''
    }
  ]
})

// 表单加载状态
const loading = ref(false)
// 保存按钮加载状态
const saveLoading = ref(false)
// 表单是否可编辑
const isEditing = ref(false)
// 当前激活的标签页
const activeTab = ref('register')

// 获取规则数据
const getRuleData = async () => {
  try {
    loading.value = true
    const data = await api.getRule()
    
    // 更新规则数据
    ruleData.register_rule = data.register_rule || {
      extra_register_time: [],
      release_time: ''
    }
    
    ruleData.refund_fee_rule = data.refund_fee_rule || {
      gradients: []
    }
    
    // 如果没有额外挂号时间，添加一个空项
    if (ruleData.register_rule.extra_register_time.length === 0) {
      ruleData.register_rule.extra_register_time.push({
        reason: '',
        time: ''
      })
    }
    
    // 如果没有退款规则梯度，添加一个空项
    if (ruleData.refund_fee_rule.gradients.length === 0) {
      ruleData.refund_fee_rule.gradients.push({
        name: '',
        time_condition: '',
        fee_ratio: 0
      })
    }
    
    // 获取候补规则数据
    const waitingRulesData = await api.getWaitingRules()
    ruleData.waiting_rules = waitingRulesData.rules || []
    
    ElMessage.success('规则数据加载成功')
  } catch (error) {
    console.error('获取规则数据失败:', error)
    ElMessage.error('获取规则数据失败')
  } finally {
    loading.value = false
  }
}

// 添加额外挂号时间
const addExtraRegisterTime = () => {
  ruleData.register_rule.extra_register_time.push({
    reason: '',
    time: ''
  })
}

// 删除额外挂号时间
const removeExtraRegisterTime = (index: number) => {
  if (ruleData.register_rule.extra_register_time.length <= 1) {
    ElMessage.warning('至少需要保留一个额外挂号时间')
    return
  }
  ruleData.register_rule.extra_register_time.splice(index, 1)
}

// 添加退款规则梯度
const addRefundGradient = () => {
  ruleData.refund_fee_rule.gradients.push({
    name: '',
    time_condition: '',
    fee_ratio: 0
  })
}

// 删除退款规则梯度
const removeRefundGradient = (index: number) => {
  if (ruleData.refund_fee_rule.gradients.length <= 1) {
    ElMessage.warning('至少需要保留一个退款规则梯度')
    return
  }
  ruleData.refund_fee_rule.gradients.splice(index, 1)
}

// 保存规则数据
const saveRuleData = async () => {
  try {
    // 验证表单数据
    if (!validateForm()) {
      return
    }
    
    saveLoading.value = true
    
    // 保存挂号规则和退款规则
    await api.setRule(ruleData)
    
    // 保存候补规则
    const waitingRuleValues = {}
    ruleData.waiting_rules.forEach(rule => {
      waitingRuleValues[rule.id] = rule.ruleValue
    })
    await api.changeRuleValue({ newValues: waitingRuleValues })
    
    ElMessage.success('规则保存成功')
    isEditing.value = false
  } catch (error) {
    console.error('保存规则数据失败:', error)
    ElMessage.error('保存规则数据失败')
  } finally {
    saveLoading.value = false
  }
}

// 表单验证
const validateForm = (): boolean => {
  // 验证挂号规则
  if (!ruleData.register_rule.release_time) {
    ElMessage.warning('请填写号源发布时间')
    return false
  }
  
  // 验证额外挂号时间
  for (const item of ruleData.register_rule.extra_register_time) {
    if (!item.reason) {
      ElMessage.warning('请填写额外挂号原因')
      return false
    }
    if (!item.time) {
      ElMessage.warning('请填写额外挂号时间')
      return false
    }
  }
  
  // 验证退款规则
  for (const item of ruleData.refund_fee_rule.gradients) {
    if (!item.name) {
      ElMessage.warning('请填写退款规则名称')
      return false
    }
    if (!item.time_condition) {
      ElMessage.warning('请填写退款时间条件')
      return false
    }
    if (item.fee_ratio < 0 || item.fee_ratio > 1) {
      ElMessage.warning('退款比例必须在0到1之间')
      return false
    }
  }
  
  // 验证候补规则
  for (const item of ruleData.waiting_rules) {
    if (item.ruleValue < 0) {
      ElMessage.warning('候补规则值不能为负数')
      return false
    }
  }
  
  return true
}

// 取消编辑
const cancelEdit = () => {
  ElMessageBox.confirm('取消编辑将丢失未保存的更改，确定要取消吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    isEditing.value = false
    // 重新加载数据
    getRuleData()
  }).catch(() => {
    // 取消操作
  })
}

// 页面加载时获取规则数据
onMounted(() => {
  getRuleData()
})
</script>

<template>
  <div class="rule-management-container">
    <h2 class="page-title">规则管理</h2>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button 
        v-if="!isEditing" 
        type="primary" 
        @click="isEditing = true"
      >
        编辑规则
      </el-button>
      <el-button 
        v-if="isEditing" 
        type="success" 
        @click="saveRuleData"
        :loading="saveLoading"
      >
        保存规则
      </el-button>
      <el-button 
        v-if="isEditing" 
        @click="cancelEdit"
      >
        取消编辑
      </el-button>
    </div>
    
    <!-- 规则表单 -->
    <el-card class="rule-card" shadow="hover">
      <el-tabs v-model="activeTab">
        <!-- 挂号规则 -->
        <el-tab-pane label="挂号规则" name="register">
          <el-form label-position="top">
            <el-form-item label="号源发布时间">
              <el-input 
                v-model="ruleData.register_rule.release_time" 
                placeholder="请输入号源发布时间，格式为HH:MM:SS"
                :disabled="!isEditing"
              />
            </el-form-item>
            
            <el-form-item label="额外挂号时间">
              <div class="extra-time-list">
                <div 
                  v-for="(item, index) in ruleData.register_rule.extra_register_time" 
                  :key="index"
                  class="extra-time-item"
                >
                  <el-input 
                    v-model="item.reason" 
                    placeholder="请输入额外挂号原因"
                    :disabled="!isEditing"
                  />
                  <el-input 
                    v-model="item.time" 
                    placeholder="请输入额外挂号时间"
                    :disabled="!isEditing"
                  />
                  <el-button 
                    v-if="isEditing" 
                    type="danger" 
                    icon="Delete" 
                    @click="removeExtraRegisterTime(index)"
                    size="small"
                  />
                </div>
              </div>
              
              <el-button 
                v-if="isEditing" 
                type="primary" 
                icon="Plus" 
                @click="addExtraRegisterTime"
                size="small"
              >
                添加额外挂号时间
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 退款规则 -->
        <el-tab-pane label="退款规则" name="refund">
          <el-form label-position="top">
            <div class="refund-gradient-list">
              <div 
                v-for="(item, index) in ruleData.refund_fee_rule.gradients" 
                :key="index"
                class="refund-gradient-item"
              >
                <h4>退款梯度 {{ index + 1 }}</h4>
                <el-form-item label="规则名称">
                  <el-input 
                    v-model="item.name" 
                    placeholder="请输入规则名称"
                    :disabled="!isEditing"
                  />
                </el-form-item>
                
                <el-form-item label="时间条件">
                  <el-input 
                    v-model="item.time_condition" 
                    placeholder="请输入时间条件"
                    :disabled="!isEditing"
                  />
                </el-form-item>
                
                <el-form-item label="退款比例">
                  <el-slider 
                    v-model="item.fee_ratio" 
                    :min="0" 
                    :max="1" 
                    :step="0.1"
                    :disabled="!isEditing"
                  />
                  <span class="slider-value">{{ (item.fee_ratio * 100).toFixed(0) }}%</span>
                </el-form-item>
                
                <el-button 
                  v-if="isEditing" 
                  type="danger" 
                  icon="Delete" 
                  @click="removeRefundGradient(index)"
                  size="small"
                >
                  删除梯度
                </el-button>
              </div>
            </div>
            
            <el-button 
              v-if="isEditing" 
              type="primary" 
              icon="Plus" 
              @click="addRefundGradient"
              size="small"
            >
              添加退款梯度
            </el-button>
          </el-form>
        </el-tab-pane>
        
        <!-- 候补规则 -->
        <el-tab-pane label="候补规则" name="waiting">
          <el-form label-position="top">
            <el-table 
              :data="ruleData.waiting_rules" 
              style="width: 100%"
              border
            >
              <el-table-column prop="id" label="规则ID" width="80" />
              <el-table-column prop="ruleName" label="规则名称" width="180" />
              <el-table-column prop="ruleValue" label="规则值">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.ruleValue" 
                    :min="0" 
                    :disabled="!isEditing"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="description" label="规则描述" />
              <el-table-column prop="createdAt" label="创建时间" width="180" />
              <el-table-column prop="updatedAt" label="更新时间" width="180" />
            </el-table>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.rule-management-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.action-buttons {
  margin-bottom: 20px;
}

.rule-card {
  margin-bottom: 20px;
}

.extra-time-list {
  margin-bottom: 15px;
}

.extra-time-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: flex-end;
}

.extra-time-item .el-input {
  flex: 1;
}

.refund-gradient-list {
  margin-bottom: 15px;
}

.refund-gradient-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.refund-gradient-item h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-weight: 600;
}

.slider-value {
  margin-left: 10px;
  font-weight: 500;
}
</style>