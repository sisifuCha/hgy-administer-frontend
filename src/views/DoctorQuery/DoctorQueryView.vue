<script setup>
import { ref, onMounted,computed } from 'vue'
import {  getDoctorListWithFilter,getDepartmentOptions, getTitleOptions } from './api/doctorApi.js'

// 响应式数据
const doctorList = ref([])
const loading = ref(false)
const searchParams = ref([])
// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

//查询职称选项
const docTitleOptions = ref([])
const  departments=ref([])
const cascaderOptions = computed(() => {
  return [
    {
      value: 'depart',
      label:'按科室查询',
      children: departments.value.map(dept => ({
        value: dept.id,
        label: dept.name
      }))//这段代码的作用是将departments数组中的每个科室对象映射为一个新的对象，
         // 这个新对象包含两个属性：value和label。{ value: "DEP001", label: "内科" },
         //{ value: "DEP002", label: "外科" }
    },
    {
      value: 'title',
      label:'按职称查询',
      children: docTitleOptions.value.map(title => ({
        value: title.value,
        label: title.label
      }))
    }
  ]
})

//----------------------------方法--------------------------------//
// 初始化数据
onMounted(async () => {
  // 分别处理科室和职称数据的获取
  try {
    const deptData = await getDepartmentOptions()
    const allDepts = deptData.data || []
    departments.value = allDepts.slice(4)
  } catch (error) {
    console.error('获取科室选项失败', error)
    // 使用默认科室数据，确保页面能正常显示
    departments.value = [
      { id: 'DEP001', name: '内科' },
      { id: 'DEP002', name: '外科' },
      { id: 'DEP003', name: '儿科' },
      { id: 'DEP004', name: '妇产科' }
    ]
  }

  try {
    const titleData = await getTitleOptions()
    docTitleOptions.value = titleData || []
  } catch (error) {
    console.error('获取职称选项失败', error)
    // 使用默认职称数据，确保页面能正常显示
    docTitleOptions.value = [
      { value: 'zhuren', label: '主任医师' },
      { value: 'fuzhuren', label: '副主任医师' },
      { value: 'zhuzhi', label: '主治医师' },
      { value: 'zhuyuan', label: '住院医师' }
    ]
  }

  // 初始加载所有医生
  await queryDoctors()
})

// 使用模拟数据
const useMockData = () => {
  // 模拟数据 - 符合后端Doctor实体结构
  const mockDoctors = [
    {
      userId: '1',
      userName: '张医生',
      userGender: '男',
      userAccount: 'zhangyisheng',
      userEmail: 'zhang@example.com',
      userPassword: '123456',
      userPhone: '13800138001',
      titleId: '1',
      clinicId: '1',
      doctorStatus: '1',
      doctorDetails: '擅长内科常见疾病的诊断和治疗',
      doctorSpeciality: '内科',
      doctorDepartId: '101'
    },
    {
      userId: '2',
      userName: '李医生',
      userGender: '女',
      userAccount: 'liyi',
      userEmail: 'li@example.com',
      userPassword: '123456',
      userPhone: '13900139002',
      titleId: '2',
      clinicId: '1',
      doctorStatus: '1',
      doctorDetails: '擅长外科手术，具有丰富的临床经验',
      doctorSpeciality: '外科',
      doctorDepartId: '102'
    },
    {
      userId: '3',
      userName: '王医生',
      userGender: '男',
      userAccount: 'wangyi',
      userEmail: 'wang@example.com',
      userPassword: '123456',
      userPhone: '13700137003',
      titleId: '3',
      clinicId: '1',
      doctorStatus: '1',
      doctorDetails: '儿科专家，擅长儿童常见疾病治疗',
      doctorSpeciality: '儿科',
      doctorDepartId: '103'
    },
    {
      userId: '4',
      userName: '赵医生',
      userGender: '女',
      userAccount: 'zhaoyi',
      userEmail: 'zhao@example.com',
      userPassword: '123456',
      userPhone: '13600136004',
      titleId: '2',
      clinicId: '1',
      doctorStatus: '1',
      doctorDetails: '妇产科专家，擅长妇科疾病诊治',
      doctorSpeciality: '妇产科',
      doctorDepartId: '201'
    },
    {
      userId: '5',
      userName: '刘医生',
      userGender: '男',
      userAccount: 'liuyi',
      userEmail: 'liu@example.com',
      userPassword: '123456',
      userPhone: '13500135005',
      titleId: '1',
      clinicId: '1',
      doctorStatus: '0',
      doctorDetails: '眼科专家，擅长各类眼科疾病诊疗',
      doctorSpeciality: '眼科',
      doctorDepartId: '202'
    }
  ]

  // 应用过滤条件
  let filteredDoctors = [...mockDoctors]

//使用 searchParams 来过滤
  if (searchParams.value && searchParams.value.length === 2) {
    const filterName = searchParams.value[0]
    const filterValue = searchParams.value[1]

    if (filterName === 'depart') {
      filteredDoctors = filteredDoctors.filter(
        doctor => doctor.doctorDepartId === filterValue
      )
    } else if (filterName === 'title') {
      // **注意**: 你的 mock 数据中 titleId 是 '1', '2'
      // 但你的 docTitleOptions 的 value 是 '主任医师', '副主任医师'
      // 这两者不匹配。
      // 为了让 mock 能运行，我假设你的 titleId 和 docTitleOptions 的 value 是一致的。
      // 如果 titleId 存的是 '主任医师' 字符串:
      filteredDoctors = filteredDoctors.filter(
        // 假设 titleId 字段存的是职称字符串，而不是数字ID
        // 如果 titleId 存的是ID，你需要一个map来转换
        doctor => doctor.titleId === filterValue //
      )
    }
  }

  // 应用分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  doctorList.value = filteredDoctors.slice(start, end)
  total.value = filteredDoctors.length
}

//点击查询按钮
const handleQuery = () => {
  currentPage.value = 1 // 重置为第一页
  queryDoctors()
}
// 查询医生列表
const queryDoctors = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const requestBody = {
      "filter_name": "",
      "filter_value": "",
      "page": currentPage.value,
      "num": pageSize.value
    }
    if ( searchParams.value&& searchParams.value.length===2){
      requestBody.filter_name=searchParams.value[0]
      requestBody.filter_value=searchParams.value[1]
    }

    // 调用API获取医生列表 - 调用后端的getDoctors接口
    const response = await getDoctorListWithFilter(requestBody)

    // 根据后端实际返回的数据结构调整访问方式
    // 后端返回的数据结构包含records和total字段
    doctorList.value = response.data.records || []
    total.value = response.data.total || 0
  } catch (error) {
    console.error('查询医生列表失败', error)
    // API调用失败时使用模拟数据
    //useMockData()
  } finally {
    loading.value = false
  }
}

// 处理查询按钮点击
const handleReset = () => {
  searchParams.value = []
  currentPage.value = 1 // 重置为第一页
  queryDoctors()
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  queryDoctors()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  queryDoctors()
}

</script>

<template>
  <div class="doctor-query-container">
    <h2>医生信息查询</h2>

    <!-- 查询条件区域 -->
    <div class="query-conditions">
      <el-row :gutter="20">
        <el-col :span="10">
          <el-form-item label="查询条件">
            <el-cascader
              v-model="searchParams"
              :options="cascaderOptions"
              placeholder="请选择科室或职称"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item >
            <el-button
              type="primary"
              @click="handleQuery"
              :loading="loading"
              style="margin-right: 10px"
            >查询
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 医生列表 -->
    <el-table
      :data="doctorList"
      style="width: 100%"
      v-loading="loading"
      stripe
    >
      <el-table-column prop="userAccount" label="工号" width="120"></el-table-column>
      <el-table-column prop="userName" label="姓名" width="120"></el-table-column>
      <el-table-column prop="userGender" label="性别" width="80">
        <template #default="{ row }">
          {{ row.userGender === '1' || row.userGender === '男' ? '男' : '女' }}
        </template>
      </el-table-column>
      <el-table-column prop="userPhone" label="电话" width="150"></el-table-column>
      <el-table-column prop="userEmail" label="邮箱"></el-table-column>
      <el-table-column prop="doctorSpeciality" label="专长"></el-table-column>
      <el-table-column prop="doctorStatus" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.doctorStatus === '1' ? 'success' : 'warning'">
            {{ row.doctorStatus === '1' ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.doctor-query-container {
  padding: 20px;
}

.query-conditions {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
