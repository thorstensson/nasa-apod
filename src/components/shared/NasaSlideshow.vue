<template>
  <div class="slideshow-container fixed inset-0 w-screen h-screen overflow-hidden bg-black">
    <!-- WebGL Canvas -->
    <div id="canvas" class="absolute inset-0 w-full h-full z-10"></div>

    <!-- Texture Definition -->
    <div class="multi-textures absolute inset-0 w-full h-full z-20">
      <!-- Displacement texture (uses first image) -->
      <img
        v-if="imageUrls.length > 0"
        :src="imageUrls[0]"
        data-sampler="displacement"
        crossorigin="anonymous"
        class="hidden"
      />

      <!-- Only 2 additional image slots for active and next textures -->
      <img v-if="imageUrls.length > 0" :src="imageUrls[0]" crossorigin="anonymous" class="hidden" />
      <img v-if="imageUrls.length > 1" :src="imageUrls[1]" crossorigin="anonymous" class="hidden" />
    </div>

    <!-- Navigation -->
    <div class="slideshow-navigation fixed inset-0 pointer-events-none z-30">
      <!-- Previous Button -->
      <button
        @click="prevSlide"
        :disabled="imageUrls.length <= 1 || isChanging"
        class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-white"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <!-- Next Button -->
      <button
        @click="nextSlide"
        :disabled="imageUrls.length <= 1 || isChanging"
        class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-white"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Slide Counter -->
      <div
        class="absolute bottom-8 right-8 text-white text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
      >
        {{ currentSlideIndex + 1 }} / {{ imageUrls.length }}
      </div>

      <!-- Metadata Display -->
      <div
        v-if="currentMetadata"
        class="absolute bottom-8 left-8 max-w-md text-white bg-black/30 backdrop-blur-sm p-4 rounded-lg"
      >
        <h3 class="font-bold text-lg mb-2 truncate">{{ currentMetadata.title }}</h3>
        <div class="text-sm space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-gray-300">NASA ID:</span>
            <span class="font-medium">{{ currentMetadata.nasa_id }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-300">Date:</span>
            <span>{{ formatDate(currentMetadata.date_created) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-300">Photographer:</span>
            <span class="truncate">{{ currentMetadata.photographer }}</span>
          </div>
          <div v-if="currentMetadata.keywords && currentMetadata.keywords.length > 0" class="mt-2">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="keyword in currentMetadata.keywords.slice(0, 3)"
                :key="keyword"
                class="text-xs bg-white/20 px-2 py-1 rounded"
              >
                {{ keyword }}
              </span>
              <span v-if="currentMetadata.keywords.length > 3" class="text-xs text-gray-400">
                +{{ currentMetadata.keywords.length - 3 }} more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
  import { Curtains, Plane } from 'curtainsjs'

  // Props
  interface Props {
    imageUrls: string[]
    imageMetadata?: Array<{
      title: string
      nasa_id: string
      date_created: string
      description: string
      photographer: string
      keywords: string[]
    }>
  }

  const props = withDefaults(defineProps<Props>(), {
    imageMetadata: () => []
  })

  // State
  const curtains = ref<Curtains | null>(null)
  const multiTexturesPlane = ref<Plane | null>(null)
  const currentSlideIndex = ref(0)
  const isChanging = ref(false)

  // Texture references
  const activeTexture = ref<any | null>(null)
  const nextTexture = ref<any | null>(null)

  // Slideshow state matching the Curtains.js example
  const slideshowState = ref({
    activeTextureIndex: 1,
    nextTextureIndex: 2,
    maxTextures: 0,
    isChanging: false,
    transitionTimer: 0
  })

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Unknown date') return dateString
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Computed property for current metadata
  const currentMetadata = computed(() => {
    if (props.imageMetadata.length > 0 && props.imageMetadata[currentSlideIndex.value]) {
      return props.imageMetadata[currentSlideIndex.value]
    }
    return null
  })

  // Vertex shader from Curtains.js example
  const vertexShader = `
precision mediump float;

attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;
varying vec2 vActiveTextureCoord;
varying vec2 vNextTextureCoord;

uniform mat4 activeTexMatrix;
uniform mat4 nextTexMatrix;

uniform float uTransitionTimer;

void main() {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

  vTextureCoord = aTextureCoord;
  vActiveTextureCoord = (activeTexMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
  vNextTextureCoord = (nextTexMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;

  vVertexPosition = aVertexPosition;
}
`

  // Fragment shader from Curtains.js example
  const fragmentShader = `
precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;
varying vec2 vActiveTextureCoord;
varying vec2 vNextTextureCoord;

uniform float uTransitionTimer;

uniform sampler2D activeTex;
uniform sampler2D nextTex;
uniform sampler2D displacement;

void main() {
  vec4 displacementTexture = texture2D(displacement, vTextureCoord);

  vec2 firstDisplacementCoords = vActiveTextureCoord + displacementTexture.r * ((cos((uTransitionTimer + 90.0) / (90.0 / 3.141592)) + 1.0) / 1.25);
  vec4 firstDistortedColor = texture2D(activeTex, vec2(vActiveTextureCoord.x, firstDisplacementCoords.y));

  vec2 secondDisplacementCoords = vNextTextureCoord - displacementTexture.r * ((cos(uTransitionTimer / (90.0 / 3.141592)) + 1.0) / 1.25);
  vec4 secondDistortedColor = texture2D(nextTex, vec2(vNextTextureCoord.x, secondDisplacementCoords.y));

  vec4 finalColor = mix(firstDistortedColor, secondDistortedColor, 1.0 - ((cos(uTransitionTimer / (90.0 / 3.141592)) + 1.0) / 2.0));

  finalColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);

  gl_FragColor = finalColor;
}
`

  // Initialize Curtains.js slideshow
  const initSlideshow = () => {
    try {
      // Clean up existing instance
      if (curtains.value) {
        curtains.value.dispose()
        curtains.value = null
      }

      // Set up WebGL context
      const canvasContainer = document.getElementById('canvas')
      if (!canvasContainer) {
        throw new Error('Canvas container not found')
      }

      curtains.value = new Curtains({
        container: canvasContainer,
        watchScroll: false,
        pixelRatio: Math.min(1.5, window.devicePixelRatio)
      })

      // Handle errors
      curtains.value
        .onError(() => {
          document.body.classList.add('no-curtains', 'image-1')
        })
        .onContextLost(() => {
          curtains.value?.restoreContext()
        })

      // Disable drawing initially
      curtains.value.disableDrawing()

      // Setup plane parameters
      const params = {
        vertexShader,
        fragmentShader,
        uniforms: {
          transitionTimer: {
            name: 'uTransitionTimer',
            type: '1f',
            value: 0
          }
        }
      }

      // Get plane element
      const planeElement = document.querySelector('.multi-textures')
      if (!planeElement) {
        throw new Error('Plane element not found')
      }

      // Create plane
      multiTexturesPlane.value = new Plane(curtains.value, planeElement, params)

      // Update max textures
      slideshowState.value.maxTextures = props.imageUrls.length

      // Setup plane events
      multiTexturesPlane.value
        .onLoading((texture: any) => {
          texture.setMinFilter(curtains.value!.gl.LINEAR_MIPMAP_NEAREST)
        })
        .onReady(() => {
          const plane = multiTexturesPlane.value!

          // Create texture objects exactly like the original Curtains.js example
          const activeTex = plane.createTexture({
            sampler: 'activeTex',
            fromTexture: plane.textures[1]
          })

          const nextTex = plane.createTexture({
            sampler: 'nextTex',
            fromTexture: plane.textures[2]
          })

          // Sync state for the first transition
          slideshowState.value.activeTextureIndex = 1
          slideshowState.value.nextTextureIndex = 2

          // Store references to textures
          activeTexture.value = activeTex
          nextTexture.value = nextTex
        })
        .onRender(() => {
          // Update transition timer
          if (slideshowState.value.isChanging) {
            slideshowState.value.transitionTimer +=
              (90 - slideshowState.value.transitionTimer) * 0.04

            if (
              slideshowState.value.transitionTimer >= 88.5 &&
              slideshowState.value.transitionTimer !== 90
            ) {
              slideshowState.value.transitionTimer = 90
            }
          }

          // Update uniform
          if (multiTexturesPlane.value && multiTexturesPlane.value.uniforms.transitionTimer) {
            multiTexturesPlane.value.uniforms.transitionTimer.value =
              slideshowState.value.transitionTimer
          }
        })
    } catch (err) {
      console.error('Failed to initialize slideshow:', err)
    }
  }

  // Start transition
  const startTransition = (direction: 'next' | 'prev') => {
    if (!curtains.value || !multiTexturesPlane.value || slideshowState.value.isChanging) return

    curtains.value.enableDrawing()
    slideshowState.value.isChanging = true
    isChanging.value = true
    slideshowState.value.transitionTimer = 0

    // 1. Calculate the new target index
    const totalSlides = props.imageUrls.length
    let nextImageIndex

    if (direction === 'next') {
      nextImageIndex = (currentSlideIndex.value + 1) % totalSlides
    } else {
      nextImageIndex = (currentSlideIndex.value - 1 + totalSlides) % totalSlides
    }

    // 2. Load new image into next texture
    if (nextTexture.value && props.imageUrls[nextImageIndex]) {
      const nextImg = new Image()
      nextImg.crossOrigin = 'anonymous'
      nextImg.src = props.imageUrls[nextImageIndex]
      nextImg.onload = () => {
        nextTexture.value!.setSource(nextImg)
      }
    }

    // 3. Update UI State
    slideshowState.value.nextTextureIndex = nextImageIndex + 1 // +1 because index 0 is displacement
    currentSlideIndex.value = nextImageIndex

    // 4. Cleanup after animation
    setTimeout(() => {
      if (!curtains.value || !multiTexturesPlane.value) return

      curtains.value.disableDrawing()

      slideshowState.value.isChanging = false
      isChanging.value = false

      // Update active texture to the image that was just shown in nextTex
      if (activeTexture.value && props.imageUrls[slideshowState.value.nextTextureIndex - 1]) {
        const activeImg = new Image()
        activeImg.crossOrigin = 'anonymous'
        activeImg.src = props.imageUrls[slideshowState.value.nextTextureIndex - 1]
        activeImg.onload = () => {
          activeTexture.value!.setSource(activeImg)
        }
      }

      // Prepare for next transition
      slideshowState.value.activeTextureIndex = slideshowState.value.nextTextureIndex
      slideshowState.value.transitionTimer = 0
    }, 1700)
  }

  // Navigation functions
  const nextSlide = () => {
    startTransition('next')
  }

  const prevSlide = () => {
    startTransition('prev')
  }

  // Lifecycle hooks
  onMounted(() => {
    // Wait for next tick to ensure DOM is rendered
    setTimeout(() => {
      if (props.imageUrls.length > 0) {
        initSlideshow()
      }
    }, 100)
  })

  // Watch for image URL changes
  watch(
    () => props.imageUrls,
    (newUrls) => {
      if (newUrls.length > 0) {
        // Wait for next tick to ensure DOM is rendered
        setTimeout(() => {
          initSlideshow()
        }, 100)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (curtains.value) {
      curtains.value.dispose()
    }
  })
</script>
