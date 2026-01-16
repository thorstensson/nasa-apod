<template>
  <div class="min-h-screen" style="background-color: #050505">
    <!-- Error state -->
    <div
      v-if="getError()"
      class="error text-red-400 text-center p-8"
      style="background-color: #050505"
    >
      Error: {{ getError() }}
    </div>

    <!-- Slideshow -->
    <div v-if="hasImages() && !loadingHighRes && imageUrls.length > 0">
      <NasaSlideshow :image-urls="imageUrls" :image-metadata="imageMetadata" />
    </div>

    <!-- No results -->
    <div
      v-if="!hasImages() && !isLoading() && !getError()"
      class="text-white text-center p-8"
      style="background-color: #050505"
    >
      No NASA images found.
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import useNasaAPI from '@/composables/useNasaAPI'
  import NasaSlideshow from '@/components/shared/NasaSlideshow.vue'

  // Destructure needed methods from composable
  const { searchImages, getHighResImage, hasImages, isLoading, getError } = useNasaAPI()

  const highResTextures = ref<Record<string, string>>({})
  const nasaItems = ref<any[]>([])
  const loadingHighRes = ref(false)

  // Compute image URLs for slideshow - ensure they stay in sync with metadata order
  const imageUrls = computed(() => {
    // Build array in same order as nasaItems to keep sync with metadata
    const urls: string[] = []
    for (const item of nasaItems.value) {
      const id = item.data?.[0]?.nasa_id
      if (id && highResTextures.value[id]) {
        urls.push(highResTextures.value[id])
      }
    }
    return urls
  })

  // Compute metadata for slideshow
  const imageMetadata = computed(() => {
    return nasaItems.value.map((item) => ({
      title: item.data?.[0]?.title || 'Untitled',
      nasa_id: item.data?.[0]?.nasa_id || 'Unknown ID',
      date_created: item.data?.[0]?.date_created || 'Unknown date',
      description: item.data?.[0]?.description || 'No description available',
      photographer: item.data?.[0]?.photographer || 'NASA',
      keywords: item.data?.[0]?.keywords || []
    }))
  })

  onMounted(async () => {
    try {
      // Search for images
      const items = await searchImages('Images of landing on the moon')
      nasaItems.value = items

      // Load high-res textures for each item IN ORDER to maintain sync
      loadingHighRes.value = true
      for (const item of items) {
        const id = item.data?.[0]?.nasa_id
        if (!id) continue
        const highResUrl = await getHighResImage(id)
        if (highResUrl) {
          highResTextures.value[id] = highResUrl
        }
      }

      // Console log for debugging sync
      console.log('NASA Gallery - Loaded data:', {
        totalItems: items.length,
        loadedTextures: Object.keys(highResTextures.value).length,
        imageUrls: imageUrls.value,
        metadataCount: imageMetadata.value.length,
        syncCheck: items.map((item, index) => ({
          index,
          nasa_id: item.data?.[0]?.nasa_id,
          title: item.data?.[0]?.title,
          hasTexture: !!highResTextures.value[item.data?.[0]?.nasa_id || ''],
          imageUrl: imageUrls.value[index] ? 'Loaded' : 'Missing',
          metadataTitle: imageMetadata.value[index]?.title
        }))
      })
    } catch (error) {
      console.error('Error loading NASA images:', error)
    } finally {
      loadingHighRes.value = false
      console.log('NASA Gallery - Loading complete:', {
        hasImages: hasImages(),
        imageCount: imageUrls.value.length,
        metadataCount: imageMetadata.value.length,
        areArraysSameLength: imageUrls.value.length === imageMetadata.value.length
      })
    }
  })
</script>
