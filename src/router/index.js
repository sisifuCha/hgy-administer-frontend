import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import MainLayout from '../components/Layouts/MainLayout.vue'
import UserManagement from '../views/users/UserManagement.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/home',
    component: MainLayout,
    meta: { requiresAuth: true }, // 需要登录才能访问
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Dashboard.vue')
      },
      {
        path: 'dataCenter',
        name: 'DataCenter',
        component: () => import('../views/dataCenter/DataCenterView.vue')
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement
      },
      /* 暂时注释掉不存在的设置页面路由
      {
        path: 'settings/basic',
        name: 'BasicSettings',
        component: () => import('../views/settings/BasicSettings.vue')
      },
      {
        path: 'settings/advanced',
        name: 'AdvancedSettings',
        component: () => import('../views/settings/AdvancedSettings.vue')
      }
      */
      {        path: 'doctorQuery',
               name: 'DoctorQuery',
               component: () => import('@/views/DoctorQuery/DoctorQueryView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true'
    if (!isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
