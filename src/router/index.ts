import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import TVPanel from '../views/TVPanel.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'TVPanel',
    component: TVPanel
  },
  {
    path: '/tv/:Macid',
    name: 'TVPanelWithId',
    component: TVPanel
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router