<template>
  <div class="min-h-screen bg-[#1a1525] text-white flex items-center justify-center p-4">
    <transition name="scale" appear>
      <div class="bg-[#2d223c]/80 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[#d8a1c4]/20 backdrop-blur-xl relative overflow-hidden">
        
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#d8a1c4]/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-[#a379c9]/10 rounded-full blur-3xl"></div>

        <div class="mb-8 text-center relative z-10">
          <h1 class="text-3xl font-black tracking-tighter bg-gradient-to-r from-[#d8a1c4] to-[#a379c9] bg-clip-text text-transparent">
            PJSK WEB GATEWAY
          </h1>
          <p class="text-[#d8a1c4]/60 mt-2 text-sm font-medium">Mizuki Network Authentication</p>
        </div>

        <div class="bg-black/30 rounded-2xl p-6 border border-[#d8a1c4]/10 mb-6 relative overflow-hidden group text-center z-10">
          <div v-if="loading" class="animate-pulse flex flex-col items-center">
            <div class="h-8 w-32 bg-[#d8a1c4]/10 rounded-lg mb-2"></div>
            <div class="h-4 w-48 bg-[#d8a1c4]/5 rounded-md"></div>
          </div>
          
          <div v-else>
            <span class="text-xs text-[#a379c9] font-mono block mb-2 tracking-widest uppercase">Verification Code</span>
            <div class="text-4xl font-mono font-bold tracking-widest text-[#d8a1c4] mb-3 drop-shadow-[0_0_15px_rgba(216,161,196,0.3)]">
              {{ authCode }}
            </div>
            <p class="text-xs text-gray-400">请向机器人发送该指令以绑定 Web Session</p>
          </div>
        </div>

        <div class="space-y-3 mb-6 z-10">
          <div class="bg-black/20 rounded-xl p-3 flex flex-col gap-2 border border-white/5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400 flex items-center gap-2">
                <div :class="['w-1.5 h-1.5 rounded-full', nodes.haruki ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]']"></div>
                Haruki 主干节点
              </span>
              <span :class="nodes.haruki ? 'text-green-400' : 'text-red-400'" class="font-mono">{{ nodes.haruki ? 'ONLINE' : 'OFFLINE' }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400 flex items-center gap-2">
                <div :class="['w-1.5 h-1.5 rounded-full', nodes.sakura ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]']"></div>
                Sakura 支线节点
              </span>
              <span :class="nodes.sakura ? 'text-green-400' : 'text-red-400'" class="font-mono">{{ nodes.sakura ? 'ONLINE' : 'OFFLINE' }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-3 py-2 border-t border-[#d8a1c4]/10 pt-4 z-10">
          <div v-if="status === 'waiting'" class="flex items-center gap-2">
            <div class="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <span class="text-sm text-yellow-400/80 font-medium tracking-wide">正在等待机器人路由响应...</span>
          </div>
          <div v-if="status === 'success'" class="flex items-center gap-2">
            <div class="w-2 h-2 bg-[#d8a1c4] rounded-full drop-shadow-[0_0_8px_rgba(216,161,196,1)]"></div>
            <span class="text-sm text-[#d8a1c4] font-medium">验证成功，正在同步数据...</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../api';

const router = useRouter();
const authCode = ref('');
const loading = ref(true);
const status = ref('waiting');
const nodes = ref({ haruki: false, sakura: false });

let sseSource = null;
let statusInterval = null;

// 获取验证码与 SSE 监听
const initAuth = async () => {
  try {
    const res = await request.get('/auth/code');
    // 根据后端返回的数据结构提取验证码
    authCode.value = res.data?.auth_code;
    loading.value = false;

    if (!authCode.value) {
      throw new Error("验证码获取失败");
    }

    const sessionId = authCode.value; 

    // SSE 地址处理
    const apiBase = import.meta.env.DEV ? '' : 'https://api-pjsk.mizuki.top';
    sseSource = new EventSource(`${apiBase}/api/auth/status?code=${sessionId}`);

    sseSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.code === 200) {
        status.value = 'success';
        localStorage.setItem('pjsk_token', data.data.token);
        sseSource.close();
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    };

    sseSource.onerror = () => sseSource.close();
  } catch (err) {
    console.error("Auth Init Error:", err);
    authCode.value = "获取失败";
    loading.value = false;
  }
};

// 获取红绿灯状态
const fetchNodeStatus = async () => {
  try {
    const res = await request.get('/system/status');
    if (res.code === 200 && res.data) {
      nodes.value = res.data;
    }
  } catch (e) {
    nodes.value = { haruki: false, sakura: false };
  }
};

onMounted(() => {
  initAuth();
  fetchNodeStatus();
  statusInterval = setInterval(fetchNodeStatus, 3000);
});

onUnmounted(() => {
  if (sseSource) sseSource.close();
  if (statusInterval) clearInterval(statusInterval);
});
</script>

<style scoped>
.scale-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>