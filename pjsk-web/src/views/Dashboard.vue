<template>
  <div class="min-h-screen bg-[#1a1525] text-white flex flex-col">
    <header class="bg-[#2d223c]/80 border-b border-[#d8a1c4]/20 p-4 flex justify-between items-center backdrop-blur-md">
      <h1 class="text-xl font-black bg-gradient-to-r from-[#d8a1c4] to-[#a379c9] bg-clip-text text-transparent">
        PJSK WEB GATEWAY
      </h1>
      
      <div class="flex items-center gap-6">
        <div class="flex gap-4">
          <div class="flex items-center gap-2">
            <div :class="['w-2.5 h-2.5 rounded-full', nodes.haruki ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]']"></div>
            <span class="text-xs text-gray-300">Haruki</span>
          </div>
          <div class="flex items-center gap-2">
            <div :class="['w-2.5 h-2.5 rounded-full', nodes.sakura ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]']"></div>
            <span class="text-xs text-gray-300">Sakura</span>
          </div>
        </div>
        
        <button @click="logout" class="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30">
          断开连接
        </button>
      </div>
    </header>

    <main class="flex-1 p-6 flex flex-col md:flex-row gap-6">
      <div class="w-full md:w-1/3 bg-[#2d223c]/40 rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
        <h2 class="text-sm text-[#d8a1c4] font-bold mb-2">指令下发 (CMD)</h2>
        <div class="flex gap-2">
          <input 
            v-model="cmdInput" 
            @keyup.enter="sendQuery" 
            type="text" 
            placeholder="输入指令, 例如: /b39 或 查房" 
            class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d8a1c4]/50 transition-colors"
          >
          <button 
            @click="sendQuery" 
            class="bg-[#d8a1c4] text-[#1a1525] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#e4b5d2] transition-colors"
          >
            发送
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          指令将由后端网关自动路由至 Haruki 或 Sakura 节点执行。
        </p>
      </div>

      <div class="w-full md:w-2/3 bg-black/20 rounded-2xl border border-white/5 p-5 flex flex-col">
         <h2 class="text-sm text-gray-400 font-bold mb-4">终端响应 (Terminal)</h2>
         <div class="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 overflow-y-auto">
            <div v-if="loading" class="text-[#d8a1c4] text-sm animate-pulse font-mono">
              [SYSTEM] 正在等待节点响应...
            </div>
            <pre v-else class="text-xs font-mono text-green-400 whitespace-pre-wrap">{{ resultData }}</pre>
         </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api'

const router = useRouter()
const nodes = ref({ haruki: false, sakura: false })
const cmdInput = ref('')
const resultData = ref('[SYSTEM] 终端就绪，等待输入指令...')
const loading = ref(false)
let pollInterval = null

// 轮询节点状态红绿灯
const fetchStatus = async () => {
  try {
    const res = await request.get('/system/status')
    if (res.code === 200) {
      nodes.value = res.data
    }
  } catch (e) {
    nodes.value = { haruki: false, sakura: false }
  }
}

// 下发查询指令
const sendQuery = async () => {
  if (!cmdInput.value.trim()) return
  loading.value = true
  try {
    const res = await request.get(`/query?command=${encodeURIComponent(cmdInput.value)}`)
    // 直接将后端返回的 JSON 格式化输出到面板上
    resultData.value = JSON.stringify(res, null, 2)
  } catch (e) {
    resultData.value = '[ERROR] 查询失败或节点离线\n' + (e.response?.data?.detail || e.message)
  } finally {
    loading.value = false
  }
}

// 登出并清理缓存
const logout = () => {
  localStorage.removeItem('pjsk_token')
  router.push('/login')
}

onMounted(() => {
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 3000) // 每3秒刷新红绿灯
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
</script>
