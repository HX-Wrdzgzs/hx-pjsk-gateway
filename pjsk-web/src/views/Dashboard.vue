<template>
  <div class="min-h-screen bg-[#fcf8fa] text-gray-800 flex flex-col md:flex-row font-sans overflow-hidden">
    
    <aside class="w-full md:w-72 bg-white/80 border-r border-[#e28cb0]/20 flex flex-col flex-shrink-0 z-20 backdrop-blur-xl transition-all h-auto md:h-screen sticky top-0 shadow-[4px_0_24px_rgb(226,140,176,0.05)]">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h1 class="text-xl font-black text-[#d4658b] tracking-wide">Mizuki PJSK 终端</h1>
      </div>

      <div class="p-6 border-b border-gray-100 flex flex-col items-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#fcecf3] to-transparent"></div>
        <img :src="`https://q1.qlogo.cn/g?b=qq&nk=${userQq}&s=640`" class="w-16 h-16 rounded-full border-2 border-white shadow-md z-10 bg-gray-100 object-cover" alt="Avatar">
        <h3 class="mt-3 text-base font-bold text-gray-800 z-10 truncate w-full text-center">{{ userName || '未知名玩家' }}</h3>
        <span class="mt-2 px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-600 border border-green-200 font-mono z-10 shadow-sm">
          {{ userQq }}
        </span>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
        <div class="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2 ml-2">查分与功能</div>
        
        <button 
          v-for="tab in menuTabs" 
          :key="tab.id"
          @click="switchTab(tab.id)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold text-left',
            activeTab === tab.id 
              ? 'bg-[#fcecf3] text-[#d4658b] border border-[#e28cb0]/30 shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50 border border-transparent'
          ]"
        >
          <span class="flex-1">{{ tab.name }}</span>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-400">
            {{ tab.node.charAt(0).toUpperCase() }}
          </span>
        </button>
      </nav>

      <div class="p-4 border-t border-gray-100 space-y-4">
        <div class="flex justify-around items-center text-xs font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">
          <span class="flex items-center gap-1.5" :class="nodes.haruki ? 'text-green-500' : 'text-gray-400'">
            <div :class="['w-1.5 h-1.5 rounded-full', nodes.haruki ? 'bg-green-400' : 'bg-red-400']"></div> HRK
          </span>
          <span class="flex items-center gap-1.5" :class="nodes.sakura ? 'text-green-500' : 'text-gray-400'">
            <div :class="['w-1.5 h-1.5 rounded-full', nodes.sakura ? 'bg-green-400' : 'bg-red-400']"></div> SKR
          </span>
        </div>
        <button @click="logout" class="w-full py-2.5 rounded-lg bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200 text-xs font-bold shadow-sm">
          注销登录
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative">
      <header class="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 bg-white/50 backdrop-blur-md z-10 shrink-0">
        <div>
          <h2 class="text-2xl font-black text-gray-800">{{ currentTabData.name }}</h2>
          <div class="flex items-center gap-3 mt-2">
            <p class="text-sm text-gray-500 flex items-center gap-2">
              下发指令: <span class="font-mono text-[#d4658b] bg-[#fcecf3] px-2 py-0.5 rounded border border-[#e28cb0]/20">{{ actualCommand }}</span>
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <select 
            v-model="currentServer" 
            @change="handleServerChange"
            class="text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#d4658b] cursor-pointer shadow-sm flex-1 md:flex-none"
            :disabled="isFetching"
          >
            <option value="">日服 (默认)</option>
            <option value="cn">国服 (CN)</option>
            <option value="tw">台服 (TW)</option>
            <option value="en">国际服 (EN)</option>
          </select>

          <button 
            @click="forceRefresh" 
            :disabled="isFetching" 
            class="text-xs px-4 py-2 bg-white text-[#d4658b] border border-[#e28cb0]/30 rounded-lg hover:bg-[#fcecf3] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <span v-if="isFetching" class="animate-pulse">请求中...</span>
            <span v-else>刷新数据</span>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div class="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-xl min-h-[500px] flex flex-col relative group">
          
          <div v-if="isFetching" class="flex-1 flex flex-col items-center justify-center text-[#e28cb0]">
            <svg class="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-mono tracking-widest animate-pulse">正在等待 {{ currentTabData.node }} 节点拉取数据...</p>
          </div>

          <div v-else-if="pageData && (pageData.images?.length > 0 || pageData.text)" class="flex-1 flex flex-col gap-6">
            <div v-if="pageData.images && pageData.images.length > 0" class="flex flex-col gap-4 items-center justify-center flex-1">
              <img 
                v-for="(img, idx) in pageData.images" 
                :key="idx" 
                :src="img" 
                class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md cursor-zoom-in hover:shadow-lg transition-all duration-300 border border-gray-50"
                alt="Response Image"
                @click="openImage(img)"
              >
            </div>
            <div v-if="pageData.text" class="bg-gray-50 rounded-xl p-6 border border-gray-100 overflow-x-auto">
              <pre class="text-sm text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">{{ pageData.text }}</pre>
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg class="w-16 h-16 mb-4 opacity-30 text-[#d4658b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-base font-bold text-gray-600">未找到该玩家信息</p>
            <p class="text-xs mt-2 text-gray-400">请检查当前选择的服区 [ {{ currentServer === '' ? '日服' : currentServer.toUpperCase() }} ] 是否已在群内完成绑定</p>
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
const userName = ref(localStorage.getItem('pjsk_user_name') || '')
const nodes = ref({ haruki: false, sakura: false })

// 核心菜单表：可以随时加新指令
const menuTabs = [
  { id: 'profile', name: '个人档案', command: '/个人信息', node: 'Haruki' },
  { id: 'b30', name: 'Best 30 成绩', command: 'pjsk b30', node: 'Sakura' },
]

const activeTab = ref(menuTabs[0].id)
const currentServer = ref('') // 值域: '', 'cn', 'tw', 'en'
const isFetching = ref(false)

const cachePool = ref({})
const CACHE_TTL = 30 * 60 * 1000 

const currentTabData = computed(() => menuTabs.find(t => t.id === activeTab.value))

// 智能拼接指令（核心逻辑）
const actualCommand = computed(() => {
  const cmd = currentTabData.value.command;
  const svr = currentServer.value;
  if (!svr) return cmd; // 默认服区，原样输出
  
  if (cmd.startsWith('/')) {
    // 带有斜杠的，插入到斜杠后：/个人信息 -> /cn个人信息
    return `/${svr}${cmd.slice(1)}`;
  } else {
    // 不带斜杠的，直接加在最前面：pjsk b30 -> cnpjsk b30
    return `${svr}${cmd}`;
  }
})

const currentCacheKey = computed(() => `${activeTab.value}_${currentServer.value}`)
const pageData = computed(() => cachePool.value[currentCacheKey.value]?.data || null)

let pollInterval = null

const fetchQqName = async () => {
  try {
    const res = await fetch(`https://api.uomg.com/api/qq.info?qq=${userQq.value}`)
    const data = await res.json()
    if (data.code === 1 && data.name) {
      userName.value = data.name
      localStorage.setItem('pjsk_user_name', data.name)
    }
  } catch (e) {}
}

const loadTabData = async (force = false) => {
  const cacheKey = currentCacheKey.value

  if (!force && cachePool.value[cacheKey]) {
    if (Date.now() - cachePool.value[cacheKey].timestamp < CACHE_TTL) return 
  }

  isFetching.value = true
  try {
    const res = await request.get(`/query?command=${encodeURIComponent(actualCommand.value)}`)
    if (res.code === 200) {
      cachePool.value[cacheKey] = { data: res.data, timestamp: Date.now() }
      localStorage.setItem('pjsk_cache_pool', JSON.stringify(cachePool.value))
    } else {
      throw new Error(res.msg)
    }
  } catch (err) {
    cachePool.value[cacheKey] = null
  } finally {
    isFetching.value = false
  }
}

const switchTab = (tabId) => {
  if (isFetching.value) return 
  activeTab.value = tabId
  loadTabData(false)
}

const handleServerChange = () => {
  loadTabData(false)
}

const forceRefresh = () => loadTabData(true)

const openImage = (url) => { 
  if (url.startsWith('data:image')) {
    const newWin = window.open('');
    newWin.document.title = '图片预览 - Mizuki PJSK 终端';
    newWin.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#fcf8fa;height:100vh;"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;box-shadow:0 10px 30px rgba(226,140,176,0.15);border-radius:12px;"></body>`);
    newWin.document.close();
  } else {
    window.open(url, '_blank');
  }
}

const fetchStatus = async () => {
  try {
    const res = await request.get('/system/status')
    if (res.code === 200) nodes.value = res.data
  } catch (e) { nodes.value = { haruki: false, sakura: false } }
}

const logout = () => {
  ['pjsk_token', 'pjsk_user_qq', 'pjsk_user_name', 'pjsk_cache_pool'].forEach(k => localStorage.removeItem(k))
  router.push('/login')
}

onMounted(() => {
  // 修改网页顶部的标签名称
  document.title = "Mizuki PJSK 查分终端"
  
  fetchQqName()
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 5000)

  const savedCache = localStorage.getItem('pjsk_cache_pool')
  if (savedCache) {
    try { cachePool.value = JSON.parse(savedCache) } catch (e) {}
  }
  loadTabData(false)
})

onUnmounted(() => clearInterval(pollInterval))
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(226, 140, 176, 0.3); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(226, 140, 176, 0.6); }
</style>