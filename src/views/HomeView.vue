<template>
  <div class="home-container">
    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-content">
          <h1>欢迎来到主页</h1>
          <el-button type="danger" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="main-content">
        <el-card class="welcome-card">
          <template #header>
            <div class="card-header">
              <span>系统主页</span>
            </div>
          </template>
          
          <div class="welcome-content">
            <el-icon color="#67C23A" :size="64"><SuccessFilled /></el-icon>
            <h2>登录成功！</h2>
            <p>欢迎使用本系统，您已成功通过密码验证。</p>
            <p>当前时间：{{ currentTime }}</p>
          </div>

          <el-divider />

          <div class="system-info">
            <h3>系统信息</h3>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="在线用户" :value="1234" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="今日访问" :value="56" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="系统状态" value="正常" />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { SwitchButton, SuccessFilled } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

export default {
  name: 'Home',
  components: {
    SwitchButton,
    SuccessFilled
  },
  data() {
    return {
      currentTime: ''
    }
  },
  mounted() {
    this.updateTime()
    // 每秒更新一次时间
    this.timeInterval = setInterval(this.updateTime, 1000)
  },
  beforeUnmount() {
    // 清除定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  },
  methods: {
    updateTime() {
      this.currentTime = new Date().toLocaleString('zh-CN')
    },
    handleLogout() {
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除登录状态
        sessionStorage.removeItem('isAuthenticated')
        ElMessage.success('退出成功！')
        // 跳转到登录页
        this.$router.push('/login')
      }).catch(() => {
        // 用户取消操作
      })
    }
  }
}
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  color: #303133;
  margin: 0;
  font-size: 24px;
}

.main-content {
  padding: 40px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.welcome-card {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.welcome-content {
  text-align: center;
  padding: 40px 0;
}

.welcome-content h2 {
  color: #67C23A;
  margin: 20px 0 10px 0;
}

.welcome-content p {
  color: #606266;
  margin: 5px 0;
}

.system-info {
  margin-top: 20px;
}

.system-info h3 {
  color: #303133;
  margin-bottom: 20px;
}
</style>