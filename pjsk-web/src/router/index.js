import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue') // 路由懒加载，提升性能
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
