<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 检查是否已登录，如果已登录则直接跳转到dashboard
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  if (isAuthenticated && router.currentRoute.value.path === '/') {
    router.push('/home/dashboard')
  }
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
  width: 100%;
}
</style>
