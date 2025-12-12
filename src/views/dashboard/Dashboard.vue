<script setup lang="ts">
// 定义组件名称
const __name__ = 'Dashboard'

// 导入必要的组件和API
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import api from '../../utils/api'
import { ArrowDownBold, ArrowUpBold, DocumentDownload } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 静态数据
const staticData = reactive({
  regis_count: 0, // 本周预约挂号人数
  visitor_count: 0, // 本周就诊人数
  dep_visitor_count: [], // 不同科室的就诊人数
  doc_visitor_count: [], // 不同医生就诊人数
  doc_schedule_count: [] // 不同医生排班量
})

// 实时数据
const hotData = reactive({
  register_num: 0, // 今日挂号人数
  visited_num: 0, // 今日已经就诊人数
  lining_num: 0 // 今日正在排队的患者人数
})

// 图表实例
const depChartRef = ref<HTMLElement | null>(null)
const docChartRef = ref<HTMLElement | null>(null)
const scheduleChartRef = ref<HTMLElement | null>(null)
let depChart: echarts.ECharts | null = null
let docChart: echarts.ECharts | null = null
let scheduleChart: echarts.ECharts | null = null

// 定时器
let hotDataTimer: number | null = null

// 获取静态数据
const getStaticData = async () => {
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    const data = await api.get('/admin/getStaticData')
    console.log('静态数据:', data)
    
    // 检查数据结构是否符合预期
    if (data && typeof data === 'object') {
      // 使用默认值，避免undefined错误
      staticData.regis_count = data.regis_count || 0
      staticData.visitor_count = data.visitor_count || 0
      staticData.dep_visitor_count = data.dep_visitor_count || []
      staticData.doc_visitor_count = data.doc_visitor_count || []
      staticData.doc_schedule_count = data.doc_schedule_count || []
      console.log('处理后的静态数据:', staticData)
      
      // 渲染图表
      renderDepChart()
      renderDocChart()
      renderScheduleChart()
    } else {
      console.error('数据结构不符合预期:', data)
      ElMessage.error('获取到的数据格式有误')
    }
    
    loading.close()
  } catch (error) {
    console.error('获取静态数据失败:', error)
    ElMessage.error('获取静态数据失败')
  }
}

// 获取实时数据
const getHotData = async () => {
  try {
    const data = await api.get('/admin/getHotData')
    hotData.register_num = data.register_num
    hotData.visited_num = data.visited_num
    hotData.lining_num = data.lining_num
  } catch (error) {
    console.error('获取实时数据失败:', error)
    // 实时数据获取失败不显示错误，避免频繁弹窗
  }
}

// 导出报表
const exportReport = async (type: string) => {
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '导出中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    // 这里可以根据需要添加筛选条件
    const params = {
      type
    }
    
    // 使用专门的download方法
    const response = await api.download('/admin/getCSV', params)
    
    // 处理文件下载
    // 检查response是否已经是Blob对象
    const blob = response instanceof Blob ? response : new Blob([response], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 设置文件名
    const fileNameMap: Record<string, string> = {
      'DOC': '医生信息表.csv',
      'PAT': '患者信息表.csv',
      'REG': '患者挂号记录表.csv',
      'SCH': '医生排班表.csv'
    }
    link.setAttribute('download', fileNameMap[type] || '报表.csv')
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('报表导出成功')
    loading.close()
  } catch (error) {
    console.error('导出报表失败:', error)
    ElMessage.error('导出报表失败')
  }
}

// 渲染科室就诊人数图表
const renderDepChart = () => {
  if (!depChartRef.value) return

  if (!depChart) {
    depChart = echarts.init(depChartRef.value)
  }
    console.log('dep_visitor_count:', staticData.dep_visitor_count)
  const option = {
    title: {
      text: '科室就诊人数统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '就诊人数',
        type: 'pie',
        radius: '50%',
        data: staticData.dep_visitor_count.map(item => ({
          name: item.dep_name,
          value: item.count
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  depChart.setOption(option)
}

// 渲染医生就诊人数图表
const renderDocChart = () => {
  if (!docChartRef.value) return
  
  if (!docChart) {
    docChart = echarts.init(docChartRef.value)
  }
  
  const option = {
    title: {
      text: '医生就诊人数统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: staticData.doc_visitor_count.map(item => item.doc_name),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '就诊人数',
        type: 'bar',
        data: staticData.doc_visitor_count.map(item => item.count),
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  }
  
  docChart.setOption(option)
}

// 渲染医生排班量图表
const renderScheduleChart = () => {
  if (!scheduleChartRef.value) return
  console.log('doc_schedule_count:', staticData.doc_schedule_count)
  if (!scheduleChart) {
    scheduleChart = echarts.init(scheduleChartRef.value)
  }
  
  const option = {
    title: {
      text: '医生排班量统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: staticData.doc_schedule_count.map(item => item.doc_name),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '排班量',
        type: 'line',
        data: staticData.doc_schedule_count.map(item => parseInt(item.count)),
        smooth: true,
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  }
  
  scheduleChart.setOption(option)
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  depChart?.resize()
  docChart?.resize()
  scheduleChart?.resize()
}

// 组件挂载时执行
onMounted(() => {
  // 获取数据
  getStaticData()
  getHotData()
  
  // 设置定时器，每30秒更新一次实时数据
  hotDataTimer = window.setInterval(getHotData, 30000)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时执行
onUnmounted(() => {
  // 清除定时器
  if (hotDataTimer) {
    window.clearInterval(hotDataTimer)
  }
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁图表实例
  depChart?.dispose()
  docChart?.dispose()
  scheduleChart?.dispose()
})
</script>

<template>
  <el-card class="dashboard-card">
    <template #header>
      <div class="card-header">
        <span>数据中台</span>
        <div>
          <el-button type="primary" icon="DocumentDownload" @click="exportReport('DOC')">
            导出医生信息
          </el-button>
          <el-button type="primary" icon="DocumentDownload" @click="exportReport('PAT')">
            导出患者信息
          </el-button>
          <el-button type="primary" icon="DocumentDownload" @click="exportReport('REG')">
            导出挂号记录
          </el-button>
          <el-button type="primary" icon="DocumentDownload" @click="exportReport('SCH')">
            导出医生排班
          </el-button>
        </div>
      </div>
    </template>

    <div class="dashboard-content">
      <h2>欢迎使用医院管理系统</h2>
      <p>这是您的数据中台，展示关键业务指标。</p>

      <el-divider />
      <!-- 实时数据统计 -->
      <h3>今日实时数据</h3>
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover" class="real-time-card">
              <div class="stat-item">
                <div class="stat-value">{{ hotData.register_num }}</div>
                <div class="stat-label">今日挂号人数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="real-time-card">
              <div class="stat-item">
                <div class="stat-value">{{ hotData.visited_num }}</div>
                <div class="stat-label">今日已就诊人数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="real-time-card">
              <div class="stat-item">
                <div class="stat-value">{{ hotData.lining_num }}</div>
                <div class="stat-label">今日排队人数</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      <!-- 静态数据统计 -->
      <h3>本周数据统计</h3>
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ staticData.regis_count }}</div>
                <div class="stat-label">本周预约挂号人数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ staticData.visitor_count }}</div>
                <div class="stat-label">本周就诊人数</div>
              </div>
            </el-card>
          </el-col>
          <!-- <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ staticData.dep_visitor_count.length }}</div>
                <div class="stat-label">涉及科室数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-value">{{ staticData.doc_visitor_count.length }}</div>
                <div class="stat-label">接诊医生数</div>
              </div>
            </el-card>
          </el-col> -->
        </el-row>
      </div>
      <!-- 图表展示 -->
      <div class="charts-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <div ref="depChartRef" class="chart-item"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <div ref="docChartRef" class="chart-item"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card shadow="hover">
              <div ref="scheduleChartRef" class="chart-item"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

    </div>
  </el-card>
</template>



<style scoped>
.dashboard-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.card-header button {
  margin-left: 10px;
}

.dashboard-content {
  padding: 20px 0;
}

.dashboard-content h3 {
  margin: 20px 0 10px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stats-container {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 实时数据卡片样式 */
.real-time-card {
  border-left: 4px solid #1890ff;
}

/* 图表容器样式 */
.charts-container {
  margin-top: 20px;
}

.chart-item {
  width: 100%;
  height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-header button {
    margin-left: 0;
    margin-top: 10px;
  }
  
  .chart-item {
    height: 300px;
  }
}
</style>