<script setup lang="ts">
// 定义组件名称
const __name__ = 'RuleManagement'

// 导入必要的组件和API
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from './api'

// 定义候补规则类型
interface WaitingRule {
  id: number;
  ruleName: string;
  ruleValue: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 候补规则数据
const waitingRules = ref<WaitingRule[]>([])

// 加载状态
const loading = ref(false)
// 保存按钮加载状态
const saveLoading = ref(false)
// 表单是否可编辑
const isEditing = ref(false)

// 获取候补规则数据
const getWaitingRulesData = async () => {
  try {
    loading.value = true
    const response = await api.getWaitingRules()
    waitingRules.value = response.data.rules || []
    ElMessage.success('候补规则数据加载成功')
  } catch (error) {
    console.error('获取候补规则数据失败:', error)
    ElMessage.error('获取候补规则数据失败')
  } finally {
    loading.value = false
  }
}

// 保存候补规则数据
const saveWaitingRules = async () => {
  try {
    // 验证表单数据
    if (!validateWaitingRules()) {
      return
    }
    
    saveLoading.value = true
    
    // 构建请求数据
    const newValues: Record<string, number> = {}
    waitingRules.value.forEach(rule => {
      newValues[rule.id.toString()] = rule.ruleValue
    })
    
    await api.changeRuleValue({ newValues })
    
    ElMessage.success('候补规则保存成功')
    isEditing.value = false
  } catch (error) {
    console.error('保存候补规则数据失败:', error)
    ElMessage.error('保存候补规则数据失败')
  } finally {
    saveLoading.value = false
  }
}

// 验证候补规则
const validateWaitingRules = (): boolean => {
  for (const rule of waitingRules.value) {
    if (rule.ruleValue < 0) {
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
    getWaitingRulesData()
  }).catch(() => {
    // 取消操作
  })
}

// 页面加载时获取规则数据
onMounted(() => {
  getWaitingRulesData()
})
</script>

<template>
  <div class="rule-management-container">
    <h2 class="page-title">候补规则管理</h2>
    
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
        @click="saveWaitingRules"
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
    
    <!-- 候补规则表格 -->
    <el-card class="rule-card" shadow="hover">
      <el-table 
        :data="waitingRules" 
        style="width: 100%"
        border
        v-loading="loading"
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
</style>