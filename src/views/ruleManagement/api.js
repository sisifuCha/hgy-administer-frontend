import api from '../../utils/api'

// 规则管理相关API
export default {
    // 获取规则设置
    getRule() {
        return api.get('/admin/getRule')
    },

    // 设置规则
    setRule(data) {
        return api.put('/admin/setRule', data)
    }
}