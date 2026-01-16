export interface NasaItemData {
  nasa_id: string
  title: string
  description: string
  date_created: string
  center?: string
  keywords?: string[]
}

export interface NasaLink {
  href: string // The direct image URL (thumbnail)
  rel: string
  render?: string
}

export interface NasaItem {
  href: string // The link to the asset manifest
  data: NasaItemData[]
  links: NasaLink[]
}

export interface NasaResponse {
  collection: {
    version: string
    href: string
    items: NasaItem[]
    metadata: {
      total_hits: number
    }
  }
}

const BASE_URL = 'https://images-api.nasa.gov/search'

export const searchNasaImages = async (query: string): Promise<NasaItem[]> => {
  const params = new URLSearchParams({
    q: query,
    media_type: 'image'
  })

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`)

    // Extra safety check
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: NasaResponse = await response.json()
    return result.collection.items
  } catch (error) {
    console.error('Error fetching NASA data:', error)
    throw error
  }
}
