<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>管理员登录</h2>
      </div>
      
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="password">密码</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              class="password-input"
            />
            <button
              type="button"
              class="toggle-password"
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
          <div v-if="errors.password" class="error-message">
            {{ errors.password }}
          </div>
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="login-button"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>确认登录</span>
        </button>
      </form>
      
      <div class="login-footer">
        <p>系统安全验证</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import axios from 'axios'
export default {
  name: 'LoginView',
  setup() {
    const loading = ref(false)
    const showPassword = ref(false)

    const loginForm = reactive({
      password: ''
    })

    const errors = reactive({
      password: ''
    })

    //密码有效验证函数
    const validateForm = () => {
      let isValid = true
      
      // 清空之前的错误
      errors.password = ''
      
      if (!loginForm.password.trim()) {
        errors.password = '请输入密码'
        isValid = false
      } else if (loginForm.password.length < 6) {
        errors.password = '密码长度至少6个字符'
        isValid = false
      } else if (loginForm.password.length > 20) {
        errors.password = '密码长度不能超过20个字符'
        isValid = false
      }
      
      return isValid
    }
    //更改密码可见性
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }
    //登陆函数
    const handleLogin = async () => {
      if (!validateForm()) return
      loading.value = true
      
      try {
        const response = await axios.post('/api/login', {
          password: loginForm.password
        });
        //剩余的成功处理逻辑
        alert('获取jwt成功')
        //从response的data里面读取jwt并做本地存储
        //跳转到home界面（要携带正确的jwt才能访问带动态信息的home，不然就是静态的home）
      } catch (error) {
        //错误处理逻辑
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      showPassword,
      loginForm,
      errors,
      validateForm,
      togglePasswordVisibility,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-card {
  width: 420px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #303133;
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin: 30px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-weight: 500;
  font-size: 14px;
}

.input-wrapper {
  position: relative;
  display: flex;
}

.password-input {
  flex: 1;
  padding: 12px 15px;
  padding-right: 80px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.password-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.toggle-password {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 8px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-left: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  transition: background-color 0.2s;
}

.toggle-password:hover {
  background: #e6e8f0;
}

.error-message {
  margin-top: 5px;
  font-size: 12px;
  color: #f56c6c;
}

.login-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.login-footer p {
  color: #c0c4cc;
  font-size: 12px;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    width: 90%;
    margin: 20px;
    padding: 30px 20px;
  }
  
  .password-input {
    padding-right: 70px;
  }
}
</style>



