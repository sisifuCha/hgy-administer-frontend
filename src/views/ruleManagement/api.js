import api from '../../utils/api'

// 候补规则管理相关API
export default {
    // 获取候补规则
    getWaitingRules() {
        return api.get('/admin/getWaitingRules')
    },

    // 修改候补规则值
    changeRuleValue(data) {
        return api.put('/admin/changeRuleValue', data)
    }
}