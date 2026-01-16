<template>
  <div class="min-h-screen" style="background-color: #050505">
    <div v-if="isLoading" class="text-white text-center p-8">Loading NASA images...</div>

    <div v-else-if="error" class="error text-red-400 text-center p-8">Error: {{ error }}</div>

    <div v-else-if="filteredItems.length > 0">
      <NasaSlideshow :apod-items="filteredItems" />
    </div>

    <div v-else class="text-white text-center p-8">No images available</div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, computed } from 'vue'
  import useNasaAPI from '@/composables/useNasaAPI'
  import NasaSlideshow from '@/components/shared/NasaSlideshow.vue'
  import { type ApodItem } from '@/api/nasaService'

  const { loadGallery, gallery, isLoading, error, isVideo } = useNasaAPI()

  const filteredItems = computed(() => {
    return gallery.value.filter((item: ApodItem) => !isVideo(item))
  })

  onMounted(async () => {
    try {
      console.log('Loading gallery with 40 images...')
      await loadGallery(40)

      console.log('Gallery loaded:', {
        totalItems: gallery.value.length,
        filteredItems: filteredItems.value.length,
        sampleItem: filteredItems.value[0],
        hasImages: filteredItems.value.length > 0
      })
    } catch (err) {
      console.error('Error loading gallery:', err)
    }
  })
</script>
