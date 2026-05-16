import { createRouter, createWebHistory } from 'vue-router'
import { token } from './store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/LoginView.vue'),
    },
    {
      path: '/inbox/:id?',
      name: 'inbox',
      component: () => import('./views/InboxView.vue'),
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
