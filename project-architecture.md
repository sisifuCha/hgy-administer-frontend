# 项目架构描述文档

## 1. 项目概述

本项目是一个基于 Vue 3 的医院管理系统前端，主要用于医院内部的医生排班、患者管理、用户管理等功能。

## 2. 技术栈

| 技术/框架 | 版本 | 用途 |
|---------|------|------|
| Vue.js | 3.5.22 | 前端框架 |
| Vue Router | 4.6.3 | 路由管理 |
| Element Plus | 2.11.5 | UI 组件库 |
| Axios | 1.13.1 | HTTP 请求库 |
| Vite | 7.1.7 | 构建工具 |
| TypeScript | - | 类型支持 |

## 3. 项目结构

```
 src/
    assets/          # 静态资源文件
    components/      # 通用组件
    router/          # 路由配置
    utils/           # 工具函数
    views/           # 页面组件
       dashboard/       # 仪表盘
       DoctorQuery/     # 医生查询
          api/         # 医生查询相关 API
       DoctorSchedule/  # 医生排班
          api/         # 医生排班相关 API
       patientManagement/ # 患者管理
          api/         # 患者管理相关 API
       users/           # 用户管理
    App.vue          # 根组件
    main.js/ts       # 入口文件
    style.css        # 全局样式
 index.html           # HTML 模板
 vite.config.js       # Vite 配置
 package.json         # 项目依赖
 tsconfig.json        # TypeScript 配置
```

## 4. 核心架构组件

### 4.1 入口文件 (main.js/ts)

项目的入口文件，负责初始化 Vue 应用，引入全局组件和样式。

主要功能：
- 创建 Vue 应用实例
- 配置 Element Plus 组件库
- 配置 Vue Router
- 挂载应用到 DOM

### 4.2 根组件 (App.vue)

应用的根组件，作为所有页面的容器。

主要功能：
- 定义应用的整体布局结构
- 包含路由出口，用于渲染当前路由对应的组件

### 4.3 路由配置 (router/index.js)

负责管理应用的所有路由。

主要功能：
- 定义路由映射关系
- 配置路由守卫进行登录验证
- 实现路由懒加载，优化性能

### 4.4 页面组件 (views/)

包含应用的所有页面组件，每个页面组件对应一个功能模块。

主要页面：
- **登录页面 (LoginView.vue)**：用户登录入口
- **仪表盘 (Dashboard.vue)**：系统概览信息
- **用户管理 (UserManagement.vue)**：管理系统用户
- **医生查询 (DoctorQueryView.vue)**：查询医生信息
- **医生排班 (DoctorSchedule.vue)**：管理医生排班
- **患者管理 (patientManagementView.vue)**：管理患者信息

### 4.5 API 模块

每个功能模块下都有独立的 API 目录，用于封装与后端的交互。

主要特点：
- 模块化设计，每个功能模块的 API 独立维护
- 封装了与后端的 HTTP 请求
- 统一处理请求和响应

## 5. 路由设计

### 5.1 路由结构

```
/
 /login                 # 登录页面
 /home                  # 主布局页面
     /dashboard         # 仪表盘
     /users             # 用户管理
     /doctorQuery       # 医生查询
     /doctorSchedule    # 医生排班
     /patientManagement # 患者管理
```

### 5.2 路由守卫

实现了登录验证功能，未登录用户将被重定向到登录页面。

```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    if (!isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})
```

## 6. 状态管理

项目目前未使用 Vuex 或 Pinia 等状态管理库，采用了以下方式管理状态：

- 组件内部状态：使用 `ref` 和 `reactive` 管理
- 跨组件通信：使用 props 和 emit
- 全局状态：使用 localStorage 存储登录状态

## 7. 构建与部署

- 开发环境：使用 Vite 提供的开发服务器
- 构建命令：`npm run build`
- 预览命令：`npm run preview`

## 8. 开发规范

- 使用 ES6+ 语法
- 组件采用单文件组件 (.vue) 格式
- 支持 TypeScript
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化

## 9. 依赖管理

使用 npm 管理项目依赖，主要依赖包括：

- Vue 3
- Vue Router 4
- Element Plus
- Axios
- Vite

## 10. 扩展建议

1. **引入状态管理库**：随着项目复杂度增加，建议引入 Pinia 或 Vuex 管理全局状态
2. **添加单元测试**：使用 Vitest 进行组件测试，提高代码质量
3. **优化性能**：实现组件懒加载、图片优化等性能优化措施
4. **添加国际化支持**：使用 vue-i18n 实现多语言支持
5. **增强安全性**：实现更完善的登录验证和权限控制机制

## 11. 总结

本项目是一个基于 Vue 3 的医院管理系统前端，采用了现代化的技术栈和模块化的架构设计。项目结构清晰，功能模块分明，便于维护和扩展。通过路由守卫实现了登录验证，确保了系统的安全性。每个功能模块都有独立的 API 封装，提高了代码的可维护性。
