<template>
  <div class="min-h-screen bg-[#130f1c] text-white flex flex-col font-sans">
    
    <header class="bg-[#241b30]/90 border-b border-[#e28cb0]/20 p-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
      <h1 class="text-xl font-black text-[#e28cb0] tracking-wide">
        Mizuki Web Gateway
      </h1>
      <div class="flex items-center gap-4">
        <div class="hidden md:flex items-center gap-3 mr-4 text-xs font-mono">
          <span class="flex items-center gap-1 text-gray-400">
            <div :class="['w-1.5 h-1.5 rounded-full', nodes.haruki ? 'bg-green-400' : 'bg-red-500']"></div> H-Node
          </span>
          <span class="flex items-center gap-1 text-gray-400">
            <div :class="['w-1.5 h-1.5 rounded-full', nodes.sakura ? 'bg-green-400' : 'bg-red-500']"></div> S-Node
          </span>
        </div>
        <button @click="logout" class="text-xs px-4 py-2 bg-[#e28cb0]/10 text-[#e28cb0] hover:bg-[#e28cb0]/20 rounded-lg transition-colors border border-[#e28cb0]/30 font-bold">
          注销登录
        </button>
      </div>
    </header>

    <main class="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div class="flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h2 class="text-2xl font-bold text-white">综合数据面板</h2>
          <p class="text-sm text-gray-400 mt-1">本地缓存有效期: 30 分钟</p>
        </div>
        <button @click="forceRefresh" :disabled="isFetching" class="text-xs px-3 py-1.5 bg-[#e28cb0]/10 text-[#e28cb0] border border-[#e28cb0]/30 rounded hover:bg-[#e28cb0]/20 transition-colors disabled:opacity-50">
          <span v-if="isFetching" class="animate-pulse">数据并发拉取中...</span>
          <span v-else>强制刷新</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <div class="md:col-span-4 bg-[#241b30] rounded-2xl border border-[#e28cb0]/30 p-6 shadow-lg relative overflow-hidden flex flex-col">
          <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#e28cb0]/20 to-transparent"></div>
          <div class="absolute top-4 right-4 text-[10px] font-mono text-gray-500 border border-gray-600/50 px-2 py-1 rounded bg-black/50 backdrop-blur-sm z-20">
            Haruki Node
          </div>
          
          <div class="relative z-10 flex flex-col items-center mt-2 mb-6">
            <img :src="`https://q1.qlogo.cn/g?b=qq&nk=${userQq}&s=640`" class="w-20 h-20 rounded-full border-4 border-[#130f1c] shadow-[0_0_15px_rgba(226,140,176,0.3)] object-cover bg-gray-800" alt="Avatar">
            <h3 class="mt-3 text-lg font-bold text-white">{{ userName }}</h3>
            <span class="px-2 py-0.5 mt-1 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 font-mono">{{ userQq }}</span>
          </div>

          <div class="flex-1 bg-black/30 rounded-xl p-4 border border-white/5 overflow-y-auto min-h-[150px]">
            <div v-if="!profileData && isFetching" class="space-y-3 animate-pulse">
               <div class="h-4 bg-[#e28cb0]/20 rounded w-3/4"></div>
               <div class="h-4 bg-[#e28cb0]/10 rounded w-1/2"></div>
               <div class="h-4 bg-[#e28cb0]/10 rounded w-5/6"></div>
            </div>
            <div v-else-if="profileData" class="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {{ profileData.text }}
            </div>
            <div v-else class="text-xs text-red-400/80 text-center mt-6">
              [获取失败] 节点无响应
            </div>
          </div>
        </div>

        <div class="md:col-span-8 bg-[#241b30] rounded-2xl border border-white/5 p-6 flex flex-col shadow-lg relative">
          <div class="absolute top-6 right-6 text-[10px] font-mono text-gray-500 border border-gray-600/50 px-2 py-1 rounded bg-black/50 z-20">
            Sakura Node
          </div>
          <h3 class="text-[#e28cb0] font-bold mb-4 flex items-center gap-2">
            Best 39 (B39)
          </h3>
          
          <div class="flex-1 bg-black/40 rounded-xl border border-white/5 p-2 flex items-center justify-center min-h-[400px] overflow-hidden relative group">
            
            <div v-if="!b39Data && isFetching" class="flex flex-col items-center justify-center w-full h-full text-[#e28cb0]/50">
              <svg class="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-sm font-mono tracking-widest animate-pulse">Sakura 节点生图并渲染中...</p>
            </div>

            <template v-else-if="b39Data?.images?.length > 0">
              <img 
                :src="b39Data.images[0]" 
                class="w-full h-full object-contain rounded-lg cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]" 
                alt="B39 Image"
                @click="openImage(b39Data.images[0])"
              >
            </template>
            
            <div v-else class="text-sm text-gray-500">
              [获取失败] 无法加载图像数据
            </div>
          </div>
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
const userQq = ref(localStorage.getItem('pjsk_user_qq') || 'User')
const userName = ref(localStorage.getItem('pjsk_user_name') || userQq.value)
const nodes = ref({ haruki: false, sakura: false })

const profileData = ref(null)
const b39Data = ref(null)
const isFetching = ref(false)

let pollInterval = null
const CACHE_KEY = 'pjsk_dashboard_cache'
const CACHE_TTL = 30 * 60 * 1000 

const fetchQqName = async () => {
  if (userName.value !== userQq.value) return 
  try {
    const res = await fetch(`https://api.uomg.com/api/qq.info?qq=${userQq.value}`)
    const data = await res.json()
    if (data.code === 1 && data.name) {
      userName.value = data.name
      localStorage.setItem('pjsk_user_name', data.name)
    }
  } catch (e) {
    console.warn("获取QQ昵称失败", e)
  }
}

const initData = async (force = false) => {
  isFetching.value = true
  fetchQqName()
  
  if (!force) {
    const cachedStr = localStorage.getItem(CACHE_KEY)
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr)
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          profileData.value = cached.profile
          b39Data.value = cached.b39
          isFetching.value = false
          return 
        }
      } catch (e) {}
    }
  }

  try {
    // 【并发黑科技】同时抛出两个请求，后端依靠 task_id 独立处理
    const [resProfile, resB39] = await Promise.all([
      request.get(`/query?command=${encodeURIComponent('/个人信息')}`),
      request.get(`/query?command=${encodeURIComponent('/b39')}`)
    ])

    profileData.value = resProfile.code === 200 ? resProfile.data : null
    b39Data.value = resB39.code === 200 ? resB39.data : null

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      profile: profileData.value,
      b39: b39Data.value
    }))

  } catch (err) {
    console.error("请求失败:", err)
  } finally {
    isFetching.value = false
  }
}

const forceRefresh = () => {
  profileData.value = null
  b39Data.value = null
  initData(true)
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
  ['pjsk_token', 'pjsk_user_qq', 'pjsk_user_name', CACHE_KEY].forEach(k => localStorage.removeItem(k))
  router.push('/login')
}

onMounted(() => {
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 5000)
  initData() 
})
onUnmounted(() => clearInterval(pollInterval))
</script>