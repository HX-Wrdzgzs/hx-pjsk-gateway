<template>
  <div class="min-h-screen bg-[#130f1c] text-white flex flex-col md:flex-row font-sans overflow-hidden">
    
    <aside class="w-full md:w-72 bg-[#241b30]/90 border-r border-[#e28cb0]/20 flex flex-col flex-shrink-0 z-20 backdrop-blur-xl transition-all h-auto md:h-screen sticky top-0">
      <div class="p-6 border-b border-white/5 flex items-center justify-between">
        <h1 class="text-xl font-black text-[#e28cb0] tracking-wide">Mizuki Gateway</h1>
      </div>

      <div class="p-6 border-b border-white/5 flex flex-col items-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#e28cb0]/10 to-transparent"></div>
        <img :src="`https://q1.qlogo.cn/g?b=qq&nk=${userQq}&s=640`" class="w-16 h-16 rounded-full border-2 border-[#e28cb0]/50 shadow-[0_0_10px_rgba(226,140,176,0.3)] z-10 bg-gray-800" alt="Avatar">
        <h3 class="mt-3 text-sm font-bold text-white z-10">{{ userName }}</h3>
        <span class="mt-1 text-[10px] text-gray-400 font-mono z-10">{{ userQq }}</span>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
        <div class="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 ml-2">功能菜单</div>
        
        <button 
          v-for="tab in menuTabs" 
          :key="tab.id"
          @click="switchTab(tab.id)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-left',
            activeTab === tab.id 
              ? 'bg-[#e28cb0]/15 text-[#e28cb0] border border-[#e28cb0]/30 shadow-[0_0_15px_rgba(226,140,176,0.1)]' 
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
          ]"
        >
          <span class="flex-1">{{ tab.name }}</span>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5 opacity-70">
            {{ tab.node.charAt(0).toUpperCase() }}
          </span>
        </button>
      </nav>

      <div class="p-4 border-t border-white/5 space-y-4">
        <div class="flex justify-around items-center text-xs font-mono bg-black/40 p-2 rounded-lg border border-white/5">
          <span class="flex items-center gap-1.5" :class="nodes.haruki ? 'text-green-400' : 'text-gray-500'">
            <div :class="['w-1.5 h-1.5 rounded-full', nodes.haruki ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500']"></div>
            HRK
          </span>
          <span class="flex items-center gap-1.5" :class="nodes.sakura ? 'text-green-400' : 'text-gray-500'">
            <div :class="['w-1.5 h-1.5 rounded-full', nodes.sakura ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500']"></div>
            SKR
          </span>
        </div>
        <button @click="logout" class="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 text-xs font-bold">
          注销登录
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-[#130f1c] relative">
      <header class="p-6 md:p-8 flex justify-between items-end border-b border-white/5 bg-[#130f1c]/80 backdrop-blur-md z-10 shrink-0">
        <div>
          <h2 class="text-2xl font-bold text-white">{{ currentTabData.name }}</h2>
          <p class="text-sm text-gray-400 mt-1 flex items-center gap-2">
            发送指令: <span class="font-mono text-[#e28cb0] bg-[#e28cb0]/10 px-1.5 py-0.5 rounded">{{ currentTabData.command }}</span>
          </p>
        </div>
        <button 
          @click="forceRefresh" 
          :disabled="isFetching" 
          class="text-xs px-4 py-2 bg-[#e28cb0]/10 text-[#e28cb0] border border-[#e28cb0]/30 rounded-lg hover:bg-[#e28cb0]/20 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="isFetching" class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isFetching ? '正在请求节点...' : '强制刷新数据' }}
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div class="bg-[#241b30] rounded-2xl border border-white/5 p-4 md:p-6 shadow-xl min-h-[500px] flex flex-col relative group">
          
          <div v-if="isFetching" class="flex-1 flex flex-col items-center justify-center text-[#e28cb0]/60">
            <svg class="animate-spin h-12 w-12 mb-6" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-mono tracking-widest animate-pulse">正在等待 {{ currentTabData.node }} 节点生成数据...</p>
          </div>

          <div v-else-if="pageData" class="flex-1 flex flex-col gap-6">
            <div v-if="pageData.images && pageData.images.length > 0" class="flex flex-col gap-4 items-center justify-center flex-1">
              <img 
                v-for="(img, idx) in pageData.images" 
                :key="idx" 
                :src="img" 
                class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg cursor-zoom-in hover:scale-[1.01] transition-transform duration-300"
                alt="Response Image"
                @click="openImage(img)"
              >
              <span class="text-xs text-gray-500 pointer-events-none">点击图片可放大查看原图</span>
            </div>
            
            <div v-if="pageData.text" class="bg-black/30 rounded-xl p-6 border border-white/5 overflow-x-auto">
              <pre class="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{{ pageData.text }}</pre>
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-500">
            <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-sm">暂无数据或节点获取失败</p>
            <p class="text-xs mt-2 opacity-50">如果持续失败，请尝试在群内使用指令确认机器人是否存活</p>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api'

const router = useRouter()
const userQq = ref(localStorage.getItem('pjsk_user_qq') || 'User')
const userName = ref(localStorage.getItem('pjsk_user_name') || userQq.value)
const nodes = ref({ haruki: false, sakura: false })

// 核心配置：可以在这里无限添加左侧边栏的菜单项
const menuTabs = [
  { id: 'profile', name: '个人档案', command: '/个人信息', node: 'Haruki' },
  { id: 'b30', name: 'Best 30 成绩', command: 'pjsk b30', node: 'Sakura' },
  // 以后如果要加功能，直接在这里加一行，前端自动生成按钮和路由逻辑
  // { id: 'search', name: '单曲查询', command: 'pjsk search', node: 'Sakura' },
]

const activeTab = ref(menuTabs[0].id)
const isFetching = ref(false)

// 数据缓存池：结构 { tabId: { data: null, timestamp: 0 } }
const cachePool = ref({})
const CACHE_TTL = 30 * 60 * 1000 // 30分钟

const currentTabData = computed(() => menuTabs.find(t => t.id === activeTab.value))
const pageData = computed(() => cachePool.value[activeTab.value]?.data || null)

let pollInterval = null

// 抓取QQ昵称
const fetchQqName = async () => {
  if (userName.value !== userQq.value) return 
  try {
    const res = await fetch(`https://api.uomg.com/api/qq.info?qq=${userQq.value}`)
    const data = await res.json()
    if (data.code === 1 && data.name) {
      userName.value = data.name
      localStorage.setItem('pjsk_user_name', data.name)
    }
  } catch (e) { console.warn("获取QQ昵称失败", e) }
}

// 核心：按需加载并缓存数据
const loadTabData = async (tabId, force = false) => {
  const tabConfig = menuTabs.find(t => t.id === tabId)
  if (!tabConfig) return

  // 1. 尝试从本地缓存池读取
  if (!force && cachePool.value[tabId]) {
    const cached = cachePool.value[tabId]
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return // 命中缓存，直接结束，UI通过 computed 自动更新
    }
  }

  // 2. 发起真实请求
  isFetching.value = true
  try {
    const res = await request.get(`/query?command=${encodeURIComponent(tabConfig.command)}`)
    if (res.code === 200) {
      // 写入内存缓存池
      cachePool.value[tabId] = {
        data: res.data,
        timestamp: Date.now()
      }
      // 序列化备份到 localStorage，防刷新丢失
      localStorage.setItem('pjsk_cache_pool', JSON.stringify(cachePool.value))
    } else {
      throw new Error(res.msg)
    }
  } catch (err) {
    console.error(`请求 ${tabConfig.name} 失败:`, err)
    // 失败时可选择清空当前tab的缓存
    cachePool.value[tabId] = null
  } finally {
    isFetching.value = false
  }
}

// 点击侧边栏切换
const switchTab = (tabId) => {
  if (isFetching.value) return // 防止狂点
  activeTab.value = tabId
  loadTabData(tabId, false)
}

// 强制刷新当前页签
const forceRefresh = () => {
  loadTabData(activeTab.value, true)
}

const openImage = (url) => { window.open(url, '_blank') }

const fetchStatus = async () => {
  try {
    const res = await request.get('/system/status')
    if (res.code === 200) nodes.value = res.data
  } catch (e) {
    nodes.value = { haruki: false, sakura: false }
  }
}

const logout = () => {
  ['pjsk_token', 'pjsk_user_qq', 'pjsk_user_name', 'pjsk_cache_pool'].forEach(k => localStorage.removeItem(k))
  router.push('/login')
}

// 初始化
onMounted(() => {
  fetchQqName()
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 5000)

  // 恢复本地缓存池
  const savedCache = localStorage.getItem('pjsk_cache_pool')
  if (savedCache) {
    try {
      cachePool.value = JSON.parse(savedCache)
    } catch (e) {}
  }

  // 首次进入加载默认第一个Tab的数据
  loadTabData(activeTab.value, false)
})

onUnmounted(() => clearInterval(pollInterval))
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(226, 140, 176, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(226, 140, 176, 0.5); }
</style>