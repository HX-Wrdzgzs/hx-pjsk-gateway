<template>
  <div class="min-h-screen bg-[#130f1c] text-white flex flex-col font-sans">
    <header class="bg-[#241b30]/90 border-b border-[#e5729a]/20 p-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
      <h1 class="text-xl font-black text-[#e5729a] tracking-wide">
        PJSK WEB GATEWAY
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
        <button @click="logout" class="text-xs px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30 font-bold">
          注销登录
        </button>
      </div>
    </header>

    <main class="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      <div class="flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h2 class="text-2xl font-bold text-white">我的主页 (Profile)</h2>
          <p class="text-sm text-gray-400 mt-1">数据缓存有效期: 30 分钟</p>
        </div>
        <button @click="forceRefresh" :disabled="isFetching" class="text-xs px-3 py-1.5 bg-[#e5729a]/10 text-[#e5729a] border border-[#e5729a]/30 rounded hover:bg-[#e5729a]/20 transition-colors disabled:opacity-50">
          <span v-if="isFetching" class="animate-pulse">刷新中...</span>
          <span v-else>强制刷新</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <div class="md:col-span-4 bg-[#241b30] rounded-2xl border border-[#e5729a]/30 p-6 shadow-lg relative overflow-hidden flex flex-col">
          <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#e5729a]/20 to-transparent"></div>
          
          <div class="relative z-10 flex flex-col items-center mt-2 mb-6">
            <img :src="`https://q1.qlogo.cn/g?b=qq&nk=${userQq}&s=640`" class="w-20 h-20 rounded-full border-4 border-[#130f1c] shadow-[0_0_15px_rgba(229,114,154,0.4)] object-cover bg-gray-800" alt="Avatar">
            <h3 class="mt-3 text-lg font-bold text-white">{{ userQq }}</h3>
            <span class="px-2 py-0.5 mt-1 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">已绑定</span>
          </div>

          <div class="flex-1 bg-black/30 rounded-xl p-4 border border-white/5 overflow-y-auto">
            <div v-if="!profileData && isFetching" class="space-y-3 animate-pulse">
               <div class="h-4 bg-white/10 rounded w-3/4"></div>
               <div class="h-4 bg-white/10 rounded w-1/2"></div>
               <div class="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
            <div v-else-if="profileData" class="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {{ profileData.text }}
            </div>
            <div v-else class="text-xs text-red-400 text-center mt-4">
              暂无数据或获取失败
            </div>
          </div>
        </div>

        <div class="md:col-span-8 bg-[#241b30] rounded-2xl border border-white/5 p-6 flex flex-col shadow-lg">
          <h3 class="text-[#e5729a] font-bold mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            Best 39 (B39)
          </h3>
          
          <div class="flex-1 bg-black/40 rounded-xl border border-white/5 p-2 flex items-center justify-center min-h-[400px] overflow-hidden relative group">
            
            <div v-if="!b39Data && isFetching" class="flex flex-col items-center justify-center w-full h-full text-[#e5729a]/50">
              <svg class="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-sm font-mono tracking-widest animate-pulse">节点正在生成 B39 图像，请稍候...</p>
            </div>

            <template v-else-if="b39Data?.images?.length > 0">
              <img 
                :src="b39Data.images[0]" 
                class="w-full h-full object-contain rounded-lg cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]" 
                alt="B39 Image"
                @click="openImage(b39Data.images[0])"
              >
              <div class="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                点击放大查看
              </div>
            </template>
            
            <div v-else class="text-sm text-gray-500">
              未能获取到 B39 图像数据
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
const nodes = ref({ haruki: false, sakura: false })

// 预加载的数据状态
const profileData = ref(null)
const b39Data = ref(null)
const isFetching = ref(false)

let pollInterval = null
const CACHE_KEY = 'pjsk_dashboard_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 分钟 (毫秒)

// 初始化：检查缓存或请求数据
const initData = async (force = false) => {
  isFetching.value = true
  
  if (!force) {
    const cachedStr = localStorage.getItem(CACHE_KEY)
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr)
        // 检查缓存是否过期
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          profileData.value = cached.profile
          b39Data.value = cached.b39
          isFetching.value = false
          return // 命中缓存，直接结束
        }
      } catch (e) {
        console.error("Cache parsing error", e)
      }
    }
  }

  // 并发请求节点数据 (利用原来的底层 query 接口模拟预加载)
  try {
    const [resProfile, resB39] = await Promise.all([
      request.get(`/query?command=${encodeURIComponent('/个人信息')}`),
      request.get(`/query?command=${encodeURIComponent('/b39')}`)
    ])

    profileData.value = resProfile.code === 200 ? resProfile.data : null
    b39Data.value = resB39.code === 200 ? resB39.data : null

    // 写入缓存，加上当前时间戳
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      profile: profileData.value,
      b39: b39Data.value
    }))

  } catch (err) {
    console.error("预加载数据失败:", err)
  } finally {
    isFetching.value = false
  }
}

// 强制刷新 (无视缓存)
const forceRefresh = () => {
  profileData.value = null
  b39Data.value = null
  initData(true)
}

// 放大图片
const openImage = (url) => {
  window.open(url, '_blank')
}

// 获取红绿灯状态
const fetchStatus = async () => {
  try {
    const res = await request.get('/system/status')
    if (res.code === 200) nodes.value = res.data
  } catch (e) {
    nodes.value = { haruki: false, sakura: false }
  }
}

const logout = () => {
  localStorage.removeItem('pjsk_token')
  localStorage.removeItem('pjsk_user_qq')
  localStorage.removeItem(CACHE_KEY) // 退出时清空缓存
  router.push('/login')
}

onMounted(() => {
  fetchStatus()
  pollInterval = setInterval(fetchStatus, 5000) // 降低红绿灯轮询频率到5秒
  initData() // 挂载时触发预加载或读取缓存
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
</script>