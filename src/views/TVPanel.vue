<template>

  <div class="tv-panel">
    <!-- Header Section -->
    <header class="panel-header">
      <div class="line-info">
        <h1>{{ lineNo }}</h1>
        <div class="current-time">{{ currentTime }}</div>
      </div>
      <div v-if="loading" class="loading-spinner"></div>
    </header>

    <!-- Error Message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Main Content -->
    <div class="tables-wrapper">
      <!-- Production Summary Table -->
      <section class="table-section">
        <h2>Current Production Status</h2>
        <div class="table-container">
          <table class="production-table summary-table">
            <thead>
              <tr>
                <th>PO No</th>
                <th>Order Qty</th>
                <th>Cut Qty</th>
                <th>Total Inline</th>
                <th class="highlight-column">Today Output</th>
                <th>Total Output</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="productionSummaries.length === 0">
                <td colspan="7" style="text-align: center; color: #888;">No data available</td>
              </tr>
              <tr v-for="summary in productionSummaries" :key="summary.jobNo">
                <td class="job-no">{{ summary.jobNo }}</td>
                <td>{{ formatNumber(summary.orderQty) }}</td>
                <td>{{ formatNumber(summary.cutQty) }}</td>
                <td>{{ formatNumber(summary.totalProcess3) }}</td>
                <td class="highlight-column">{{ formatNumber(summary.todayProcess5) }}</td>
                <td>{{ formatNumber(summary.totalProcess5) }}</td>
                <td>
                  <div class="progress-bar-wrapper">
                    <div class="progress-bar" 
                         :style="{ width: `${summary.pct}%` }"
                         :class="getProgressColor(summary.pct)">
                      {{ summary.pct }}%
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Daily Production Table -->
      <section class="table-section">
        <h2>Hourly Production</h2>
        <div class="table-container">
          <table class="production-table hourly-table">
            <thead>
              <tr>
                <th class="date-column">Date</th>
                <!-- <th v-for="hour in 10" :key="hour">{{ formatTimeRange(hour) }}</th> -->
                <th v-for="(hour,index) in hourArr" :key="index">{{ hour }}</th>
                <th class="total-column">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="daily in productionDailies" :key="daily.productDate">
                <td class="date-column">{{ formatDate(daily.productDate) }}</td>
                <td v-for="hour in 10" :key="hour" 
                    :class="getProductionClass(getHourlyProduction(daily, hour))">
                  {{ formatNumber(getHourlyProduction(daily, hour)) }}
                </td>
                <td class="total-column">{{ formatNumber(daily.totalQty) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
 
</template>

<script lang="ts">
import { defineComponent, onMounted, ref,onBeforeUnmount,watch } from 'vue';
import { useRoute } from 'vue-router';
//import {request} from '@/utils/aktApi'
import{get} from '@/utils/api';
// 增强类型定义
interface ProductionSummary {
  jobNo: string;
  orderQty: number;
  cutQty: number;
  totalProcess3: number;
  todayProcess5: number;
  totalProcess5: number;
  pct: number;
}

interface ProductionDaily {
  productDate: string;
  time1: number;
  time2: number;
  time3: number;
  time4: number;
  time5: number;
  time6: number;
  time7: number;
  time8: number;
  time9: number;
  time10: number;
  totalQty: number;
}

interface ProductionData {
  productionSummaries: ProductionSummary[];
  productionDailies: ProductionDaily[];
}

export default defineComponent({
  name: 'TVPanel',
  setup() {
    const route = useRoute();
    const productionSummaries = ref<ProductionSummary[]>([]);
    const productionDailies = ref<ProductionDaily[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const timer = ref<ReturnType<typeof setInterval> | null>(null);
    const retryCount=ref(0); // 重试次数
    const maxRetries=ref(3); // 最大重试次数
    const hourArr=ref<string[]>([]);
    const currentTime = ref(new Date().toLocaleTimeString());
    const lineNo=ref<string|null>("");
    // 工具函数：统一参数名称大小写
    const getQueryParam = (paramName: string): string | null => {
      const paramKeys = Object.keys(route.query);
      const key = paramKeys.find(k => k.toLowerCase() === paramName.toLowerCase());
      return key ? (route.query[key] as string) : null;
    };
    //从URL参数或localStorage获取macId
   
    const Macid = ref('20');
    const clearTimer = () => {
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
    };

    const formatMacid = (): string => {
      // Use Macid.value directly since it's a ref
      if (!Macid.value) return 'Line 1'; // Default value if empty

      // Remove all leading zeros and ensure at least "1"
      const formatted = Macid.value.replace(/^0+/, '') || '1';

      // Validate the result
      if (!/^\d+$/.test(formatted)) {
      console.warn(`Invalid Macid format: ${Macid.value}`);
      return 'Line 1';
    }

      return `Line ${formatted}`;
    };

    const getQueryString=(name:string):string=> {
      const url = window.location.href;
      // 构造正则表达式，匹配 ? 或 & 后面跟随的参数名称和其值
      const regex = new RegExp('[?&]' + name + '=([^&#]*)', 'i');
      const result = regex.exec(url);
      return result ? decodeURIComponent(result[1]) : '';
    };

    const fetchData = async (forceRefresh = false) => {
      if (loading.value && !forceRefresh) return;
      
      loading.value = true;
      error.value = null;
      try{
        const response = await get<ProductionData>('/TV/GetDailyProduction', { 
        Macid: Macid.value,
      });
    
        if (response.code === 200) {
          // 成功处理
          productionSummaries.value = response.data.productionSummaries;
          productionDailies.value = response.data.productionDailies;
        } else {

          // 业务错误处理
          error.value = response.message;
        }
        

      }catch(error){
        console.error('Error fetching data:', error);
      }finally{
        loading.value = false;
      }
      // try {
      //   const response = await request.get<ProductionData>('/TV/GetDailyProduction', { 
      //     Macid: Macid.value
      //   });
        
      //   if (!response) {
      //     throw new Error('No data received');
      //   }

      //   productionSummaries.value = response.productionSummaries || [];
      //   productionDailies.value = response.productionDailies || [];
      //   retryCount.value = 0; // 重置重试计数
      // } catch (err) {
      //   console.error('Error fetching data:', err);
      //   error.value = 'Failed to load production data. Please try again later.';
        
      //   // 重试机制
      //   if (retryCount.value < maxRetries.value) {
      //     retryCount.value++;
      //     setTimeout(() => fetchData(true), 1000 * retryCount.value);
      //   }
      // } finally {
      //   loading.value = false;
      // }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };
    // 监听URL参数变化
    watch(
      () => route.query,
      (newQuery) => {
        if(!newQuery){
          return;
        }
        //console.log('URL参数变化:', newQuery);
        const newMacId = getQueryParam('macid');
        if (newMacId) {
          Macid.value = newMacId as string;
          lineNo.value=formatMacid();
          localStorage.setItem('Macid', newMacId);
          fetchData(true); // 强制刷新数据
        }
      },{
        deep: true,
        immediate: true, // 立即执行一次
      }
    );

     // 添加WebSocket支持
     const initWebSocket = () => {
      const ws = new WebSocket(`ws://${window.location.host}/production-updates`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.Macid === Macid.value) {
          fetchData(true);
        }
      };

      ws.onerror = () => {
        setTimeout(initWebSocket, 5000); // 重连机制
      };
    };

    const formatDate = (dateString: string): string => {
      if (!dateString) return '-';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
      }
    };

    const formatNumber = (num: number): string => {
      return num.toLocaleString();
    };

    
    const formatTimeRange = (): void => {

      for (let i = 1; i < 11; i++) {
        const startHour = i + 6;
        const endHour = startHour + 1;
        const startTime = startHour.toString().padStart(2, '0');
        const endTime = endHour.toString().padStart(2, '0');
        if (i === 10) {
          hourArr.value.push(`${startTime}:00 After`);
          
        }else{
          hourArr.value.push(`${startTime}:00-${endTime}:00`);
        }
        
      }
      
    };

    const getProgressColor = (percentage: number): string => {
      if (percentage >= 90) return 'progress-excellent';
      if (percentage >= 70) return 'progress-good';
      return 'progress-normal';
    };

    const getProductionClass = (value: number): string => {
      if (value === 0) return 'production-zero';
      if (value > 1000) return 'production-high';
      if (value > 500) return 'production-medium';
      return '';
    };

    const getHourlyProduction = (daily: ProductionDaily, hour: number): number => {
      const timeKey = `time${hour}` as keyof ProductionDaily;
      return daily[timeKey] as number;
    };

    onMounted(() => {
      formatTimeRange();
      lineNo.value=formatMacid();
      Macid.value=getQueryString("MacId")===''?'02':getQueryString("MacId");
      const overlay = document.querySelector('.overlay');
      if (overlay instanceof HTMLElement) {
        overlay.style.display = 'none'; // 隐藏覆盖层
      }
      window.setInterval(() => {
        currentTime.value = new Date().toLocaleTimeString();
      }, 1000);
      fetchData();
      clearTimer(); // 确保没有遗留的timer
      timer.value = setInterval(fetchData, 60000);



      //initWebSocket(); // 初始化WebSocket
    });

    onBeforeUnmount(() => {
      clearTimer();
    });

    return {
      productionSummaries,
      productionDailies,
      formatDate,
      loading,
      error,
      clearTimer,
      fetchData,
      timer,
      Macid,
      retryCount,
      maxRetries,
      initWebSocket,
      productionData: {
        productionSummaries,
        productionDailies,
      },
      currentTime,
      formatNumber,
      formatTimeRange,
      getProgressColor,
      getProductionClass,
      getHourlyProduction,
      toggleFullscreen,
      formatMacid,
      getQueryParam,
      hourArr,
      lineNo,
      getQueryString,
    

    };
  },
});
</script>

<style scoped>
/* Reset basic styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.tv-panel {
  
  position: fixed; /* 使用固定定位避免滚动 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #1a1a1a;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体滚动 */
  z-index: 10; /* 确保在最上层 */
}

.panel-header {
  
  flex: 0 0 8vh; /* 固定高度 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2vw;
  background: rgba(42, 42, 42, 0.5);
  border-bottom: 2px solid #42b883;
}

.line-info {
  display: flex;
  align-items: center;
  gap: 2vw;
  height: 100%;
}

.line-info h1 {
  font-size: 3vw;
  color: #42b883;
  margin: 0; 
  padding: 0;
  line-height: 8vh;
}

.current-time {
  font-size: 1.8vw;
  color: #888;
  margin-left: 2vw;
}

.tables-wrapper {
  
  flex: 1; /* 自动占用剩余空间 */
  display: flex;
  flex-direction: column;
  gap: 2vh;
  padding: 1vh 2vw;
  overflow: hidden; /* 防止内容溢出 */

}

.table-section {
 
  position: relative; /* 为内部绝对定位提供参考 */
  height: 35%;
  overflow: hidden;
}

.table-section:first-child {
  height: 35%;
}

.table-section:last-child {
  height: 65%;
}

.table-section h2 {
  text-align: left;
  font-size: 2vw;
  color: #42b883;
  margin: 0;
  padding: 1vh 0;
  flex:none;
  height: 4vh;
  line-height: 4vh;
}

.table-container {
 
  position: absolute; /* 绝对定位确保填充父容器 */
  top: 5vh; /* 留出标题空间 */
  left: 0;
  right: 0;
  bottom: 0;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
}

.production-table {
  width: 100%;
  /* flex:1; */
  height: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.production-table thead {
  display: table;
  width: 100%;
  table-layout: fixed;
  /* height: 6vh;  */
}

.production-table tbody {
  display: block;
  overflow-y: auto; /* Enable vertical scrolling */
  height: calc(100% - 6vh); /* Take remaining space */
}

.production-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

/* 自定义滚动条样式 */
.production-table tbody::-webkit-scrollbar {
  width: 6px;
}

.production-table tbody::-webkit-scrollbar-track {
  background: rgba(66, 184, 131, 0.1);
}

.production-table tbody::-webkit-scrollbar-thumb {
  background: #42b883;
  border-radius: 3px;
}

.production-table th,
.production-table td {
  padding: 1vh 1vw;
  text-align: right;
  border-bottom: 1px solid #404040;
  font-size: 1.2vw;
  white-space: nowrap;  /* Prevent text wrapping */
  overflow: hidden;   /* Hide overflow */
  text-overflow: ellipsis;
}

.date-column {
  width: 8%;
}

.total-column {
  width: 8%;
}

.production-table th:not(.date-column):not(.total-column) {
  background: #333;
  color: #ddd;
  font-weight: normal;
  font-size: 1.1vw;
  text-align: center;
  padding: 1vh 0.5vw;
}

/* Center align time data cells */
.production-table td:not(.date-column):not(.total-column) {
  text-align: center; /* Center align the time data */
}

.summary-table th {
  background: #333;
  color: #ddd;
  font-weight: normal;
  font-size: 1.1vw;
  text-align: center;
  padding: 1vh 0.5vw;
  border-bottom: 2px solid #42b883; /* Add green underline */
}

/* Keep job number column left aligned */
.summary-table th:first-child {
  text-align: left;
}

/* Ensure highlight column stays consistent */
.summary-table th.highlight-column {
  color: #42b883;
  font-weight: bold;
  border-bottom: 2px solid #42b883;
}

/* Optimize column widths for Hourly Production */
.hourly-table .date-column {
  width: 10%;
  text-align: center !important;
}

.hourly-table .total-column {
  width: 8%;
  text-align: center !important;
  color: #42b883;
  font-weight: bold;
}

.hourly-table th:not(.date-column):not(.total-column) {
  width: calc(82% / 10); /* Distribute remaining width */
}

/* Style time columns */
.hourly-table th {
  background: #333;
  color: #ddd;
  font-weight: normal;
  font-size: 1.1vw;
  text-align: center;
  padding: 1vh 0.5vw;
  border-bottom: 2px solid #42b883;
}

.job-no {
  text-align: left;
  font-weight: bold;
  color: #42b883;
}

.highlight-column {
  color: #42b883;
  font-weight: bold;
}

.hourly-table td {
  font-size: 1.3vw;
  text-align: center;
  padding: 1.2vh 0.5vw;
}

.progress-bar-wrapper {
  width: 100%;
  background: #333;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 20px;
  line-height: 20px;
  text-align: center;
  color: white;
  transition: width 0.3s ease;
}

.progress-excellent { background: #42b883; }
.progress-good { background: #2f9df4; }
.progress-normal { background: #666; }

.production-high {
   color: #42b883; 
   font-weight: bold;
  }
.production-medium { color: #2f9df4; }
.production-zero { color: #666; }

/* Row hover effect */
.hourly-table tr:hover td {
  background: rgba(66, 184, 131, 0.1);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #42b883;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 全屏支持优化 */
:fullscreen .tv-panel {
  width: 100vw;
  height: 100vh;
}

:-webkit-full-screen .tv-panel {
  width: 100vw;
  height: 100vh;
}

:-moz-full-screen .tv-panel {
  width: 100vw;
  height: 100vh;
}



.error-banner {
  background: #ff4444;
  color: white;
  padding: 1vh 2vw;
  border-radius: 4px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
 
 .tv-panel {
   font-size: 2vw; /* Adjust font size for smaller screens */
   padding:0;
 }

 .panel-header {
   flex:0 0 10vh; /* Adjust header height */
   padding: 0 1vw;
 }

 .current-time {
   font-size: 2vw;
 }
 .line-info h1 {
   font-size: 4vw;
 }

 .table-section h2 {
   font-size: 3vw;
 }

 .table-section:first-child {
   height: 40%;
 }
 
 .table-section:last-child {
   height: 60%;
 }
 
 .hourly-table th {
   font-size: 1.2vw;
 }
 
 .hourly-table td {
   font-size: 1.4vw;
 }

 .production-table th,
 .production-table td {
   font-size: 2.5vw; /* 调整表格字体大小 */
   padding: 0.5vh 0.5vw;
 }

 .progress-bar {
   height: 15px; /* 调整进度条高度 */
   line-height: 15px;
 }
}

/* 添加全屏支持 */
@media screen and (display-mode: fullscreen) {
 .tv-panel {
   height: 100vh;
   width: 100vw;
 
 }
}

.about {
  text-align: center;
}
</style>