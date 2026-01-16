import { createRouter, createWebHistory } from 'vue-router'
import NasaGallery from '@/views/NasaGallery.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NasaGallery
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: NasaGallery
    },
    // Optional: Add a catch-all route for 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/'
    }
  ]
})

export default router
