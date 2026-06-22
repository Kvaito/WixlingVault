<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePixiApp, useLorePopup } from '../composables/usePixiApp'
import { useSceneScroll } from '../composables/useSceneScroll'
import { useSettingsStore } from '../stores/settings'
import LorePopup from './LorePopup.vue'
import SettingsPanel from './SettingsPanel.vue'

/*
  PixiStage
  =========
  Корневой компонент сцены. Порядок инициализации:

  1. onMounted → mountCanvas(шаблонный <canvas>)
     PixiJS создаёт свой canvas и заменяет наш через replaceWith().
     canvasRef теперь указывает на пиксийный canvas.

  2. watch(isReady) → setLoreCallback + setLorePositionCallback + bindEvents
     Слушатели скролла вешаются только на реальный PixiJS-канвас.
     Колбэк позиции позволяет попапу следовать за сущностью при скролле.

  3. watch(settingsStore.scrollSpeed) → sceneManager.setSpeedMultiplier
     Пользовательский ползунок меняет скорость через Pinia-стор.

  4. onUnmounted → unbindEvents + destroyApp
     Чистая зачистка.
*/

const { canvasRef, app, sceneManager, isReady, mountCanvas } = usePixiApp()
const { lore, lorePosition, isLoreVisible, showLore, updateLorePosition, hideLore } = useLorePopup()
const settingsStore = useSettingsStore()

const localCanvasRef = ref<HTMLCanvasElement | null>(null)

/*
  Скролл-композабл создаётся сразу, но обработчики вешаются позже —
  когда PixiJS-канвас будет готов.
*/
const { bindEvents, unbindEvents } = useSceneScroll({
  onTargetChange: (x) => {
    sceneManager.value?.setTargetX(x)
  },
  getTargetX: () => sceneManager.value?.getTargetX() ?? 0,
})

// Ждём готовности PixiJS, затем активируем лор и скролл
watch(isReady, (ready) => {
  if (!ready) return
  const sm = sceneManager.value!

  // Показ лора
  sm.setLoreCallback((data, x, y) => showLore(data, x, y))

  // Слежение попапа за сущностью при скролле
  sm.setLorePositionCallback((x, y) => updateLorePosition(x, y))

  // Авто-скрытие попапа, когда сущность полностью ушла за экран
  sm.setLoreHideCallback(() => hideLore())

  // Скорость из стора (начальное значение)
  sm.setSpeedMultiplier(settingsStore.scrollSpeed)

  // Вешаем события скролла на готовый PixiJS-канвас
  if (app.value) {
    bindEvents(app.value.canvas as HTMLCanvasElement)
  }
})

// Пользователь меняет скорость → сцена реагирует
watch(() => settingsStore.scrollSpeed, (v) => {
  sceneManager.value?.setSpeedMultiplier(v)
})

// Монтируем PixiJS: передаём шаблонный <canvas>, он будет заменён
onMounted(() => {
  if (localCanvasRef.value) {
    mountCanvas(localCanvasRef.value)
  }
})

// Зачистка при размонтировании
onUnmounted(() => {
  unbindEvents()
})

function onCloseLore() {
  sceneManager.value?.hideLore()
  hideLore()
}
</script>

<template>
  <div class="pixi-stage">
    <canvas ref="localCanvasRef" class="pixi-canvas" />

    <Transition name="lore">
      <LorePopup
        v-if="isLoreVisible"
        :title="lore?.title ?? ''"
        :text="lore?.text ?? ''"
        :x="lorePosition.x"
        :y="lorePosition.y"
        @close="onCloseLore"
      />
    </Transition>

    <SettingsPanel />

    <div v-if="!isReady" class="loading-overlay">
      <span class="loading-text">Загрузка мира...</span>
    </div>
  </div>
</template>

<style scoped>
.pixi-stage {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #050510;
}

.pixi-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #050510;
  z-index: 5;
}

.loading-text {
  color: #aaa;
  font-size: 1.2rem;
  letter-spacing: 0.15em;
}

.lore-enter-active,
.lore-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.lore-enter-from,
.lore-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}
</style>
