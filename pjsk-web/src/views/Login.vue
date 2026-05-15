<template>
  <div class="min-h-screen bg-[#130f1c] text-white flex items-center justify-center p-4">
    <transition name="scale" appear>
      <div class="bg-[#241b30]/90 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[#d8a1c4]/20 backdrop-blur-xl relative overflow-hidden">
        
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-[#d8a1c4]/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-[#a379c9]/10 rounded-full blur-3xl"></div>

        <div class="mb-8 text-center relative z-10">
          <h1 class="text-3xl font-black tracking-tighter bg-gradient-to-r from-[#d8a1c4] to-[#a379c9] bg-clip-text text-transparent">
            PJSK WEB GATEWAY
          </h1>
          <p class="text-[#d8a1c4]/70 mt-2 text-sm font-medium">Mizuki Network Authentication</p>
        </div>

        <div v-if="step === 1" class="relative z-10 space-y-5">
          <div class="text-center">
            <p class="text-sm text-gray-300">请输入您的 QQ 账号进行验证或注册</p>
          </div>
          <div class="relative">
            <input 
              v-model="qqInput" 
              type="text" 
              placeholder="输入 QQ 账号" 
              @keyup.enter="handleNext"
              class="w-full bg-black/40 border border-[#d8a1c4]/30 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-[#d8a1c4] focus:ring-1 focus:ring-[#d8a1c4]/50 transition-all font-mono text-lg"
            />
          </div>
          <button 
            @click="handleNext"
            class="w-full bg-gradient-to-r from-[#d8a1c4] to-[#a379c9] text-[#130f1c] font-bold py-3 rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_15px_rgba(216,161,196,0.3)]"
          >
            登录 / 注册
          </button>
        </div>

        <div v-if="step === 2" class="relative z-10 flex flex-col items-center">
          <div class="w-full bg-black/40 rounded-2xl p-6 border border-[#d8a1c4]/15 mb-6 text-center shadow-inner">
            <div v-if="loading" class="animate-pulse flex flex-col items-center">
              <div class="h-6 w-24 bg-[#d8a1c4]/10 rounded mb-3"></div>
              <div class="h-10 w-48 bg-[#d8a1c4]/20 rounded-md"></div>
            </div>
            <div v-else>
              <span class="text-xs text-[#a379c9] font-bold block mb-2 tracking-widest uppercase">Verification Code</span>
              <div class="text-4xl font-mono font-black tracking-widest text-[#d8a1c4] mb-3 drop-shadow-[0_0_10px_rgba(216,161,196,0.4)] select-all cursor-pointer" title="点击可选中复制">
                {{ authCode }}
              </div>
              <p class="text-xs text-gray-400">请使用 QQ <span class="text-[#d8a1c4] font-mono">{{ qqInput }}</span> 向机器人发送该指令</p>
            </div>
          </div>

          <div class="w-full space-y-3 mb-6">
            <div class="bg-black/20 rounded-xl p-3 flex flex-col gap-2 border border-white/5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400 flex items-center gap-2">
                  <div :class="['w-2 h-2 rounded-full', nodes.haruki ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]']"></div>
                  Haruki 主干节点
                </span>
                <span :class="nodes.haruki ? 'text-green-400' : 'text-red-400'" class="font-mono font-bold">{{ nodes.haruki ? 'ONLINE' : 'OFFLINE' }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400 flex items-center gap-2">
                  <div :class="['w-2 h-2 rounded-full', nodes.sakura ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]']"></div>
                  Sakura 支线节点
                </span>
                <span :class="nodes.sakura ? 'text-green-400' : 'text-red-400'" class="font-mono font-bold">{{ nodes.sakura ? 'ONLINE' : 'OFFLINE' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-3 py-2 border-t border-[#d8a1c4]/15 pt-5 w-full">
            <div v-if="status === 'waiting'" class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-yellow-400/80 rounded-full animate-ping"></div>
              <span class="text-sm text-yellow-400/90 font-medium tracking-wide">正在等待机器人路由响应...</span>
            </div>
            <div v-if="status === 'success'" class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]"></div>
              <span class="text-sm text-green-400 font-bold tracking-wide">验证成功！正在进入系统...</span>
            </div>
            <div v-if="status === 'error'" class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
              <span class="text-sm text-red-400 font-medium">验证码已失效，请刷新页面重试</span>
            </div>
          </div>
          
          <button v-if="status === 'waiting'" @click="step = 1" class="mt-4 text-xs text-gray-500 hover:text-[#d8a1c4] transition-colors underline underline-offset-4">
            返回修改 QQ 账号
          </button>
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

// 状态管理
const step = ref(1);
const qqInput = ref('');
const authCode = ref('');
const loading = ref(true);
const status = ref('waiting'); // waiting, success, error
const nodes = ref({ haruki: false, sakura: false });

let pollingInterval = null;
let statusInterval = null;

// 点击下一步（获取验证码）
const handleNext = () => {
  const qqPattern = /^[1-9][0-9]{4,10}$/;
  if (!qqPattern.test(qqInput.value.trim())) {
    alert("请输入正确的 QQ 账号（5-11位纯数字）");
    return;
  }
  step.value = 2;
  initAuth();
};

// 获取验证码并开启轮询
const initAuth = async () => {
  loading.value = true;
  status.value = 'waiting';
  try {
    const res = await request.get('/auth/code');
    authCode.value = res.data?.auth_code;
    loading.value = false;

    if (!authCode.value) throw new Error("验证码获取失败");

    // 开始普通轮询，每 2 秒查一次后端
    startPolling(authCode.value);

  } catch (err) {
    console.error("Auth Init Error:", err);
    authCode.value = "获取失败";
    loading.value = false;
    status.value = 'error';
  }
};

// 稳定版轮询逻辑（替代 SSE）
const startPolling = (code) => {
  if (pollingInterval) clearInterval(pollingInterval);
  
  pollingInterval = setInterval(async () => {
    try {
      const res = await request.get(`/auth/status?code=${code}`);
      
      if (res.code === 200 && res.data?.token) {
        // 绑定成功
        clearInterval(pollingInterval);
        status.value = 'success';
        localStorage.setItem('pjsk_token', res.data.token);
        
        // 可选：将用户填写的 QQ 存入本地，后续展示用
        localStorage.setItem('pjsk_user_qq', qqInput.value.trim());
        
        setTimeout(() => router.push('/dashboard'), 1500);
      } else if (res.code === 404) {
        // 验证码过期或不存在
        clearInterval(pollingInterval);
        status.value = 'error';
      }
      // 如果 res.code 是 202，说明还在 pending，继续轮询
      
    } catch (e) {
      console.error("Polling Error:", e);
    }
  }, 2000); // 2000 毫秒 = 2 秒
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
  fetchNodeStatus();
  statusInterval = setInterval(fetchNodeStatus, 3000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
  if (statusInterval) clearInterval(statusInterval);
});
</script>

<style scoped>
.scale-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>