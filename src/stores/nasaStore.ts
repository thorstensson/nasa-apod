import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { searchNasaImages, type NasaItem } from '@/api/nasaService'

export const useNasaStore = defineStore('nasa', () => {
  // --- STATE ---
  const nasaImages = ref<NasaItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // --- GETTERS ---
  const hasImages = computed(() => nasaImages.value.length > 0)
  const totalImages = computed(() => nasaImages.value.length)

  // --- ACTIONS ---
  async function fetchNasaImages(query: string) {
    isLoading.value = true
    error.value = null

    try {
      const images = await searchNasaImages(query)
      nasaImages.value = images
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch NASA images'
      console.error('Error fetching NASA images:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    nasaImages,
    isLoading,
    error,
    hasImages,
    totalImages,
    fetchNasaImages
  }
})
