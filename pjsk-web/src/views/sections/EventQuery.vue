<template>
  <div class="flex flex-col h-full">
    <!-- 查询控制区 -->
    <div class="flex items-center gap-3 mb-5">
      <div class="relative flex-1">
        <input
          v-model="eventInput"
          type="text"
          placeholder="输入活动编号（留空查当前活动）…"
          class="w-full bg-gray-50/50 border border-[#e28cb0]/30 rounded-xl px-4 py-3 pl-10 text-gray-800 text-sm focus:outline-none focus:border-[#d4658b] focus:ring-2 focus:ring-[#e28cb0]/30 transition-all font-sans shadow-inner"
          @keyup.enter="handleQuery"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <button
        @click="handleQuery"
        :disabled="isFetching"
        class="px-5 py-3 bg-gradient-to-r from-[#e28cb0] to-[#d4658b] text-white font-bold rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-md whitespace-nowrap text-sm"
      >
        查询
      </button>
    </div>

    <!-- 快捷操作 -->
    <div class="flex flex-wrap gap-1.5 mb-4">
      <span class="text-[10px] text-gray-400 font-medium mr-1 self-center">快捷：</span>
      <button
        v-for="quick in quickActions"
        :key="quick.label"
        @click="eventInput = quick.value; handleQuery()"
        class="text-[11px] px-2.5 py-1 rounded-full bg-[#fcecf3]/60 text-[#d4658b] border border-[#e28cb0]/20 hover:bg-[#fcecf3] transition-colors"
      >
        {{ quick.label }}
      </button>
    </div>

    <!-- 加载态 -->
    <div v-if="isFetching" class="flex-1 flex flex-col items-center justify-center text-[#e28cb0]">
      <svg class="animate-spin h-8 w-8 mb-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p class="text-xs font-mono tracking-widest animate-pulse">正在获取活动信息…</p>
    </div>

    <!-- 结果展示 -->
    <div v-else-if="result" class="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <!-- 图片 -->
      <div v-if="result.images && result.images.length" class="flex flex-col gap-4 items-center">
        <img
          v-for="(img, idx) in result.images"
          :key="idx"
          :src="img"
          class="max-w-full max-h-[55vh] object-contain rounded-xl shadow-md cursor-zoom-in hover:shadow-lg transition-all duration-300 border border-gray-50"
          alt="活动信息图"
          @click="openImage(img)"
        />
      </div>
      <!-- 文本 -->
      <div v-if="result.text" class="bg-gray-50 rounded-xl p-4 border border-gray-100 overflow-x-auto">
        <pre class="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">{{ result.text }}</pre>
      </div>
    </div>

    <!-- 空态 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400">
      <svg class="w-12 h-12 mb-4 opacity-30 text-[#d4658b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
      <p class="text-sm font-bold text-gray-600">点击「查询」查看当前活动</p>
      <p class="text-[10px] mt-2 text-gray-400 text-center px-4">也可输入活动编号查询往期活动，例如：<span class="font-mono text-[#d4658b]">86</span>、<span class="font-mono text-[#d4658b]">-1</span></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../../api'

const props = defineProps({
  serverPrefix: { type: String, default: '' }
})

const eventInput = ref('')
const isFetching = ref(false)
const result = ref(null)

const quickActions = [
  { label: '📅 当前活动', value: '' },
  { label: '📅 上期活动', value: '-1' },
  { label: '📋 活动列表', value: 'list' },
]

function buildCommand(input) {
  const trimmed = input.trim()
  if (!trimmed) return `${props.serverPrefix}活动`
  if (trimmed === 'list') return `${props.serverPrefix}findevent`
  return `${props.serverPrefix}活动 ${trimmed}`
}

async function handleQuery() {
  isFetching.value = true
  result.value = null

  try {
    const cmd = buildCommand(eventInput.value)
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
