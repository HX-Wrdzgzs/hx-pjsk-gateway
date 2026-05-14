import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue') 
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 路由守卫：没鉴权 Token 不给进主控台
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('pjsk_token');
    if (to.name !== 'Login' && !token) {
        next({ name: 'Login' });
    } else {
        next();
    }
});

export default router;
