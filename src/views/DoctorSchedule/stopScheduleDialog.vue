<script setup lang="ts">
import { ref, reactive,watch} from 'vue'
import { ElMessage } from 'element-plus'

// 父组件传入的 props
const props = defineProps<{
  modelValue: boolean
  schedule: any | null
}>()

// 定义两个Emits时间
const emit = defineEmits(['update:modelValue', 'submit'])

// 弹窗内部数据
const visible = ref(props.modelValue)

watch(() => props.modelValue, v => visible.value = v)
watch(visible, v => emit('update:modelValue', v)) //通知父组件弹窗状态变化 双向绑定

// 表单
const formRef = ref()
const form = reactive({
  reason: ''
})

// 校验规则
const rules = {
  reason: [
    { required: true, message: '请填写停诊原因', trigger: 'blur' }
  ]
}

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = () => {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return

    emit('submit', {
      schedule: props.schedule,
      reason: form.reason
    })

    visible.value = false
    form.reason = ''
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="停诊设置"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="mb-3">
      <p>医生：<b>{{ schedule?.doctorName }}</b></p>
      <p>时间：{{ schedule?.timeSlot }}</p>
      <p>诊室：{{ schedule?.roomNumber }}</p>
    </div>

    <!-- 停诊理由 -->
    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
            <!--将 <el-form> 组件实例绑定到 formRef 变量。这样就可以在 JavaScript 中通过 formRef.value 访问表单组件的方法-->
      <el-form-item label="停诊原因" prop="reason">
        <el-input
          type="textarea"
          v-model="form.reason"
          rows="4"
          placeholder="请输入停诊原因（必填）"
        />
      </el-form-item>

      <!-- 若未来需要更多字段可以继续添加 -->
      <!--
      <el-form-item label="类型">
        <el-select v-model="form.type">
          <el-option label="临时停诊" value="temporary"/>
          <el-option label="全天停诊" value="whole_day"/>
        </el-select>
      </el-form-item>
      -->
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="danger" @click="handleConfirm">确认停诊</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>
