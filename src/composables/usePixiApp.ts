import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { Application } from 'pixi.js'
import { createApp, destroyApp } from '../pixi/app'
import { SceneManager } from '../pixi/SceneManager'
import type { LoreData } from '../pixi/entities/SceneEntity'

export interface UsePixiAppReturn {
  canvasRef: Ref<HTMLCanvasElement | null>
  app: Ref<Application | null>
  sceneManager: Ref<SceneManager | null>
  isReady: Ref<boolean>
  mountCanvas: (canvas: HTMLCanvasElement) => void
}

export function usePixiApp(): UsePixiAppReturn {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const app = ref<Application | null>(null)
  const sceneManager = ref<SceneManager | null>(null)
  const isReady = ref(false)

  async function mountCanvas(canvas: HTMLCanvasElement) {
    canvasRef.value = canvas
    const pixiApp = await createApp()

    canvas.replaceWith(pixiApp.canvas)
    canvasRef.value = pixiApp.canvas as HTMLCanvasElement

    app.value = pixiApp
    const sm = await SceneManager.create(pixiApp)
    sceneManager.value = sm
    isReady.value = true
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    destroyApp()
    app.value = null
    sceneManager.value = null
    isReady.value = false
  })

  function handleResize() {
    if (sceneManager.value) {
      sceneManager.value.resize(window.innerWidth, window.innerHeight)
    }
  }

  return { canvasRef, app, sceneManager, isReady, mountCanvas }
}

export function useLorePopup() {
  const lore = ref<LoreData | null>(null)
  const lorePosition = ref({ x: 0, y: 0 })
  const isLoreVisible = ref(false)

  function showLore(data: LoreData, screenX: number, screenY: number) {
    lore.value = data
    lorePosition.value = { x: screenX, y: screenY }
    isLoreVisible.value = true
  }

  /*
    updateLorePosition
    Вызывается каждый кадр тикера, пока попап открыт.
    Позволяет попапу следовать за сущностью при скролле.
  */
  function updateLorePosition(screenX: number, screenY: number) {
    lorePosition.value = { x: screenX, y: screenY }
  }

  function hideLore() {
    isLoreVisible.value = false
    lore.value = null
  }

  return { lore, lorePosition, isLoreVisible, showLore, updateLorePosition, hideLore }
}
