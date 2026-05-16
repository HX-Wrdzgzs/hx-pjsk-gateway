<template>
  <div class="min-h-screen bg-[#fcf8fa] text-gray-800 flex items-center justify-center p-4 font-sans">
    <transition name="scale" appear>
      <div class="bg-white/80 p-8 rounded-3xl shadow-[0_8px_30px_rgb(226,140,176,0.15)] w-full max-w-md border border-[#e28cb0]/20 backdrop-blur-xl relative overflow-hidden">
        
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-[#e28cb0]/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-[#f4b8d0]/20 rounded-full blur-3xl"></div>

        <div class="mb-8 text-center relative z-10">
          <h1 class="text-3xl font-black tracking-tighter bg-gradient-to-r from-[#d4658b] to-[#e28cb0] bg-clip-text text-transparent">
            Mizuki PJSK 查分终端
          </h1>
          <p class="text-gray-500 mt-2 text-sm font-medium">网页端数据看板授权</p>
        </div>

        <div v-if="step === 1" class="relative z-10 space-y-5">
          <div class="text-center">
            <p class="text-sm text-gray-600 font-bold">请输入您的 QQ 账号进行验证或注册</p>
          </div>
          <div class="relative">
            <input 
              v-model="qqInput" 
              type="text" 
              placeholder="输入 QQ 账号" 
              @keyup.enter="handleNext"
              class="w-full bg-gray-50/50 border border-[#e28cb0]/30 rounded-xl px-4 py-3 text-gray-800 text-center focus:outline-none focus:border-[#d4658b] focus:ring-2 focus:ring-[#e28cb0]/30 transition-all font-mono text-lg shadow-inner"
            />
          </div>
          <button 
            @click="handleNext"
            class="w-full bg-gradient-to-r from-[#e28cb0] to-[#d4658b] text-white font-bold py-3 rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-md"
          >
            获取专属绑定码
          </button>
          
          <div class="mt-4 p-4 bg-[#fcecf3]/60 border border-[#e28cb0]/30 rounded-xl text-center shadow-sm">
            <p class="text-xs text-[#d4658b] font-medium leading-relaxed">
              * 首次使用终端需要完成 Bot 权限验证<br>
              请前往官方交流群验证授权：<span class="font-bold select-all text-[#c24b74] bg-white px-1.5 py-0.5 rounded ml-1 shadow-sm">1053964431</span>
            </p>
          </div>
        </div>

        <div v-if="step === 2" class="relative z-10 flex flex-col items-center">
          <div class="w-full bg-white/60 rounded-2xl p-6 border border-[#e28cb0]/20 mb-6 text-center shadow-sm">
            <div v-if="loading" class="animate-pulse flex flex-col items-center">
              <div class="h-6 w-24 bg-gray-200 rounded mb-3"></div>
              <div class="h-10 w-48 bg-gray-100 rounded-md"></div>
            </div>
            <div v-else>
              <span class="text-xs text-gray-500 font-bold block mb-2 tracking-widest uppercase">Verification Code</span>
              <div class="text-4xl font-mono font-black tracking-widest text-[#d4658b] mb-3 select-all cursor-pointer">
                {{ authCode }}
              </div>
              <p class="text-xs text-gray-500">请使用 QQ <span class="text-[#d4658b] font-mono">{{ qqInput }}</span> 向群内机器人发送该指令</p>
            </div>
          </div>

          <div class="flex items-center justify-center gap-3 py-2 border-t border-gray-100 pt-5 w-full">
            <div v-if="status === 'waiting'" class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></div>
              <span class="text-sm text-yellow-600 font-medium tracking-wide">等待机器人节点响应...</span>
            </div>
            <div v-if="status === 'success'" class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]"></div>
              <span class="text-sm text-green-500 font-bold tracking-wide">验证成功！正在进入系统...</span>
            </div>
            <div v-if="status === 'error'" class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
              <span class="text-sm text-red-500 font-medium">验证码已失效，请重试</span>
            </div>
          </div>
          
          <button v-if="status === 'waiting'" @click="step = 1" class="mt-4 text-xs text-gray-400 hover:text-[#d4658b] transition-colors underline underline-offset-4">
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

const step = ref(1);
const qqInput = ref('');
const authCode = ref('');
const loading = ref(true);
const status = ref('waiting'); 

let pollingInterval = null;

onMounted(() => {
  document.title = "Mizuki PJSK 查分终端 - 登录授权";
  if (localStorage.getItem('pjsk_token')) {
    router.push('/dashboard');
  }
});

const handleNext = () => {
  const qqPattern = /^[1-9][0-9]{4,10}$/;
  if (!qqPattern.test(qqInput.value.trim())) {
    alert("请输入正确的 QQ 账号（5-11位纯数字）");
    return;
  }
  step.value = 2;
  initAuth();
};

const initAuth = async () => {
  loading.value = true;
  status.value = 'waiting';
  try {
    const res = await request.get('/auth/code');
    authCode.value = res.data?.auth_code;
    loading.value = false;
    if (!authCode.value) throw new Error("获取失败");
    startPolling(authCode.value);
  } catch (err) {
    authCode.value = "获取失败";
    loading.value = false;
    status.value = 'error';
  }
};

const startPolling = (code) => {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    try {
      const res = await request.get(`/auth/status?code=${code}`);
      if (res.code === 200 && res.data?.token) {
        clearInterval(pollingInterval);
        status.value = 'success';
        localStorage.setItem('pjsk_token', res.data.token);
        localStorage.setItem('pjsk_user_qq', qqInput.value.trim());
        setTimeout(() => router.push('/dashboard'), 1500);
      } else if (res.code === 404) {
        clearInterval(pollingInterval);
        status.value = 'error';
      }
    } catch (e) {}
  }, 2000); 
};

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<style scoped>
.scale-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
</style>