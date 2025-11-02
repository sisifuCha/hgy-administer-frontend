<script setup lang="ts">
// 定义组件名称
const __name__ = 'Dashboard'
</script>

<template>
  <el-card class="dashboard-card">
    <template #header>
      <div class="card-header">
        <span>仪表盘</span>
      </div>
    </template>

    <div class="dashboard-content">
      <h2>欢迎使用管理系统</h2>
      <p>这是您的数据中台，展示关键业务指标。</p>

      <el-divider />

      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">1,234</div>
                <div class="stat-label">总用户数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">56</div>
                <div class="stat-label">今日新增</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">99.8%</div>
                <div class="stat-label">系统可用性</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">¥12,543</div>
                <div class="stat-label">总收入</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 可以添加图表、表格等更多内容 -->
    </div>
  </el-card>
</template>



<style scoped>
.dashboard-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-content {
  padding: 20px 0;
}

.stats-container {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}
</style>
