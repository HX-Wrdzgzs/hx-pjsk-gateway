<template>
  <div class="flex flex-col h-full">
    <!-- 控制面板 -->
    <div class="bg-gradient-to-br from-[#fcecf3]/40 to-white rounded-2xl border border-[#e28cb0]/20 p-5 mb-5 shadow-sm">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- 卡池编号 -->
        <div class="flex-1">
          <label class="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1.5">卡池编号</label>
          <div class="relative">
            <input
              v-model="poolId"
              type="text"
              placeholder="输入卡池编号，如 114"
              class="w-full bg-white/60 border border-[#e28cb0]/30 rounded-xl px-4 py-3 pl-10 text-gray-800 text-sm focus:outline-none focus:border-[#d4658b] focus:ring-2 focus:ring-[#e28cb0]/30 transition-all font-mono shadow-inner"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p class="text-[10px] text-gray-400 mt-1 ml-1">通过 <span class="font-mono text-[#d4658b]">cardinfo</span> 查看当期卡池编号</p>
        </div>

        <!-- 抽卡次数 -->
        <div>
          <label class="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1.5">抽数</label>
          <div class="flex gap-1.5">
            <button
              v-for="n in pullOptions"
              :key="n.value"
              @click="pullCount = n.value"
              :class="[
                'px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border',
                pullCount === n.value
                  ? 'bg-[#d4658b] text-white border-[#d4658b] shadow-md'
                  : 'bg-white/60 text-gray-600 border-gray-200 hover:border-[#e28cb0]/40 hover:bg-[#fcecf3]/30'
              ]"
            >
              {{ n.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 选项 -->
      <div class="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="reverseMode"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-[#d4658b] focus:ring-[#e28cb0]/30 cursor-pointer accent-[#d4658b]"
          />
          <span class="text-xs text-gray-600 font-medium">反抽卡（反转 ★2/★4 概率）</span>
        </label>
        <button
          @click="lookupPool"
          :disabled="isFetching || !poolId.trim()"
          class="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          查卡池信息
        </button>
      </div>

      <!-- 抽卡按钮 -->
      <button
        @click="handleGacha"
        :disabled="isFetching || !poolId.trim()"
        class="mt-4 w-full py-3.5 bg-gradient-to-r from-[#e28cb0] via-[#d4658b] to-[#c24b74] text-white font-black text-lg rounded-xl hover:opacity-90 hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-lg tracking-wider"
      >
        <span v-if="isFetching" class="animate-pulse">✨ 祈祷中…</span>
        <span v-else>✨ {{ pullCount }} 连抽卡</span>
      </button>
    </div>

    <!-- 加载态 -->
    <div v-if="isFetching" class="flex-1 flex flex-col items-center justify-center text-[#e28cb0]">
      <svg class="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p class="text-sm font-mono tracking-widest animate-pulse">✨ 正在召唤卡牌…</p>
    </div>

    <!-- 结果展示 -->
    <div v-else-if="result" class="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <div v-if="result.images && result.images.length" class="flex flex-col gap-4 items-center">
        <img
          v-for="(img, idx) in result.images"
          :key="idx"
          :src="img"
          class="max-w-full max-h-[55vh] object-contain rounded-xl shadow-md cursor-zoom-in hover:shadow-lg transition-all duration-300 border border-gray-50"
          alt="抽卡结果"
          @click="openImage(img)"
        />
      </div>
      <div v-if="result.text" class="bg-gray-50 rounded-xl p-4 border border-gray-100 overflow-x-auto">
        <pre class="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">{{ result.text }}</pre>
      </div>
    </div>

    <!-- 空态 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400">
      <svg class="w-16 h-16 mb-4 opacity-20 text-[#d4658b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <p class="text-sm font-bold text-gray-600">输入卡池编号开始抽卡</p>
      <p class="text-[10px] mt-2 text-gray-400 text-center px-4">
        先用 <span class="font-mono text-[#d4658b]">cardinfo + 卡编号</span> 查看卡池编号<br/>
        例如：<span class="font-mono text-[#d4658b]">114</span> 号卡池
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../../api'

const props = defineProps({
  serverPrefix: { type: String, default: '' }
})

const poolId = ref('')
const pullCount = ref(10)
const reverseMode = ref(false)
const isFetching = ref(false)
const result = ref(null)

const pullOptions = [
  { label: '1抽', value: 1 },
  { label: '10连', value: 10 },
  { label: '30连', value: 30 },
  { label: '50连', value: 50 },
  { label: '100连', value: 100 },
]

function buildGachaCommand() {
  const pool = poolId.value.trim()
  if (reverseMode.value) {
    return `${props.serverPrefix}pjsk反抽卡${pool}`
  }
  if (pullCount.value === 10) {
    return `${props.serverPrefix}pjsk抽卡${pool}`
  }
  return `${props.serverPrefix}pjsk${pullCount.value}连${pool}`
}

function buildPoolInfoCommand() {
  return `${props.serverPrefix}cardinfo ${poolId.value.trim()}`
}

async function handleGacha() {
  if (!poolId.value.trim()) return

  isFetching.value = true
  result.value = null

  try {
    const cmd = buildGachaCommand()
    const res = await request.get(`/query?command=${encodeURIComponent(cmd)}`)
    if (res.code === 200) {
      result.value = res.data
    } else {
      result.value = { text: `抽卡失败：${res.msg || '未知错误'}` }
    }
  } catch (err) {
    result.value = { text: `网络错误：${err.message}` }
  } finally {
    isFetching.value = false
  }
}

async function lookupPool() {
  if (!poolId.value.trim()) return

  isFetching.value = true
  result.value = null

  try {
    const cmd = buildPoolInfoCommand()
    const res = await request.get(`/query?command=${encodeURIComponent(cmd)}`)
    if (res.code === 200) {
      result.value = res.data
    } else {
      result.value = { text: `查询失败：${res.msg || '未知错误'}` }
    }
  } catch (err) {
    result.value = { text: `网络错误：${err.message}` }
  } finally {
    isFetching.value = false
  }
}

function openImage(url) {
  if (url.startsWith('data:image')) {
    const newWin = window.open('')
    newWin.document.title = '图片预览 - Mizuki PJSK 终端'
    newWin.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#fcf8fa;height:100vh;"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;box-shadow:0 10px 30px rgba(226,140,176,0.15);border-radius:12px;"></body>`)
    newWin.document.close()
  } else {
    window.open(url, '_blank')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(226, 140, 176, 0.3); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(226, 140, 176, 0.6); }
</style>
