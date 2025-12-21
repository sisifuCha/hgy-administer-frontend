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
    },

    // 获取候补规则
    getWaitingRules() {
        return api.get('/admin/getWaitingRules')
    },

    // 修改候补规则值
    changeRuleValue(data) {
        return api.put('/admin/changeRuleValue', data)
    }
}