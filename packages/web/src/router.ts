import { createRouter, createWebHistory } from 'vue-router'
import { token } from './store'
import AppLayout from './layouts/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/LoginView.vue'),
    },
    {
      path: '',
      component: AppLayout,
      children: [
        {
          path: '/inbox/:id?',
          name: 'inbox',
          component: () => import('./views/InboxView.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          meta: { title: '设置' },
          component: () => import('./views/SettingsView.vue'),
        },
        {
          path: '/users',
          name: 'users',
          meta: { title: '用户管理' },
          component: () => import('./views/TodoView.vue'),
        },
        {
          path: '/accounts',
          name: 'accounts',
          meta: { title: '邮箱账号' },
          component: () => import('./views/TodoView.vue'),
        },
        {
          path: '',
          redirect: '/inbox',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/inbox',
    },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/login') {
    if (token.value) return next('/inbox')
    return next()
  }
  if (!token.value) return next('/login')
  next()
})

export default router
