<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="sidebar">
      <div class="logo-container">
        <h1 class="logo-text">红果园校医院管理系统</h1>
      </div>
      <el-menu
        :default-active="activePath"
        class="el-menu-vertical"
        router
        :collapse="isCollapse"
      >
        <!-- 菜单项 -->
        <el-sub-menu index="1">
          <template #title>
            <el-icon><Menu /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/home/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>数据中台</span>
          </el-menu-item>
          <el-menu-item index="/home/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>

        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Menu /></el-icon>
            <span>医生管理</span>
          </template>
          <el-menu-item index="/home/doctorQuery">
            <el-icon><User /></el-icon>
            <span>医生信息管理</span>
          </el-menu-item>
          <el-menu-item index="/home/doctorSchedule">
            <el-icon><User /></el-icon>
            <span>医生排班管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="3">
          <template #title>
            <el-icon><User /></el-icon>
            <span>患者管理</span>
          </template>
          <el-menu-item index="/home/patientManagement">
            <el-icon><User /></el-icon>
            <span>患者信息管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="4">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>配置中心</span>
          </template>
          <el-menu-item index="/settings/basic">
            <span>基本设置</span>
          </el-menu-item>
          <el-menu-item index="/settings/advanced">
            <span>高级设置</span>
          </el-menu-item>
          <el-menu-item index="/home/ruleManagement">
            <span>规则管理</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 更多菜单项可以根据需求添加 -->
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 头部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button @click="toggleSidebar" icon="Menu" circle></el-button>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar size="small" icon="User" />
              <span class="username">{{ username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Menu,
  Setting,
  User,
  DataLine,
  ArrowRight,
  ArrowLeft
} from '@element-plus/icons-vue'

// 组件注册
const components = {
  Menu,
  Setting,
  User,
  DataLine,
  ArrowRight,
  ArrowLeft
}

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)
const username = ref('管理员')

// 当前活跃的路径
const activePath = computed(() => {
  return route.path
})

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    sessionStorage.removeItem('isAuthenticated')
    ElMessage.success('退出成功！')
    router.push('/login')
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  color: #fff;
  overflow: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #243445;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.el-menu-vertical {
  height: calc(100vh - 60px);
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(252, 98, 98, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
}

.main-content {
  padding: 20px;
  background-color: #f0f2f5;
  overflow-y: auto;
}
</style>