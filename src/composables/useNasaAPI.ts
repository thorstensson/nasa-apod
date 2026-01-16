import { useNasaStore } from '@/stores/nasaStore'
import { type NasaItem } from '@/api/nasaService'

export default function useNasaAPI() {
  const nasaStore = useNasaStore()

  /**
   * Search for NASA images using the NASA API
   * This uses the service function and updates the store
   * Composable layer (UI) > Store layer (Logic / State) > Service layer (Pure API)
   */
  const searchImages = async (query: string): Promise<NasaItem[]> => {
    try {
      // Use the store's action which internally uses the service
      await nasaStore.fetchNasaImages(query)
      return nasaStore.nasaImages
    } catch (error) {
      console.error('Error in useNasaAPI searchImages:', error)
      throw error
    }
  }

  /**
   * Get Web-Optimized Image URL for Curtains.js
   * Uses large quality for good balance of quality and performance
   */
  const getHighResImage = async (nasaId: string): Promise<string> => {
    try {
      const response = await fetch(`https://images-api.nasa.gov/asset/${nasaId}`)
      if (!response.ok) return ''

      const data = await response.json()

      // Get all links from manifest
      const items = data.collection?.items || []
      const links: string[] = items.map((item: { href: string }) => item.href)

      // 1. Filter for web-compatible formats first (.jpg, .jpeg, .png, .webp)
      const webCompatibleLinks = links.filter((url) => {
        const lowerUrl = url.toLowerCase()
        return (
          lowerUrl.endsWith('.jpg') ||
          lowerUrl.endsWith('.jpeg') ||
          lowerUrl.endsWith('.png') ||
          lowerUrl.endsWith('.webp')
        )
      })

      // 2. Prioritize medium quality for web performance, then small, then others
      const optimizedImage =
        webCompatibleLinks.find((url) => url.includes('~medium')) ||
        webCompatibleLinks.find((url) => url.includes('~small')) ||
        webCompatibleLinks.find((url) => url.includes('~large')) ||
        webCompatibleLinks.find((url) => url.includes('~orig')) ||
        webCompatibleLinks[0] || // Fallback to the first available web-ready image
        ''

      // Debug logging to see what we found
      console.log(`NASA ID ${nasaId}:`, {
        totalLinks: links.length,
        webCompatibleLinks: webCompatibleLinks.length,
        selectedImage: optimizedImage,
        allLinks: links
      })

      return optimizedImage
    } catch (error) {
      console.error('Error fetching NASA asset:', error)
      return ''
    }
  }

  /**
   * Get the current NASA images from the store
   */
  const getNasaImages = (): NasaItem[] => {
    return nasaStore.nasaImages
  }

  /**
   * Check if images are currently loading
   */
  const isLoading = (): boolean => {
    return nasaStore.isLoading
  }

  /**
   * Get any error from the store
   */
  const getError = (): string | null => {
    return nasaStore.error
  }

  /**
   * Check if there are any images in the store
   */
  const hasImages = (): boolean => {
    return nasaStore.hasImages
  }

  /**
   * Get the total number of images
   */
  const getTotalImages = (): number => {
    return nasaStore.totalImages
  }

  /**
   * Clear the current images and error from the store
   */
  const clearResults = (): void => {
    nasaStore.nasaImages = []
    nasaStore.error = null
  }

  return {
    // Main search function
    searchImages,

    // High-res image function
    getHighResImage,

    // State accessors
    getNasaImages,
    isLoading,
    getError,
    hasImages,
    getTotalImages,

    // Utility functions
    clearResults,

    // Direct store access (if needed)
    nasaStore
  }
}
