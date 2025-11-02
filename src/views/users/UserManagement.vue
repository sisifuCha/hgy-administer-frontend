<script setup lang="ts">
import { ref } from 'vue'

// 定义组件名称
const __name__ = 'UserManagement'

// 用户列表数据
const userList = ref([
  { id: 1, username: 'admin', email: 'admin@example.com', role: '管理员', status: 'active' },
  { id: 2, username: 'user1', email: 'user1@example.com', role: '普通用户', status: 'active' },
  { id: 3, username: 'user2', email: 'user2@example.com', role: '普通用户', status: 'disabled' }
])
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <el-button type="primary">添加用户</el-button>
      </div>
    </template>

    <el-table :data="userList" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="role" label="角色"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '活跃' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{row}">
          <el-button type="primary" link size="small">编辑</el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>

</style>
