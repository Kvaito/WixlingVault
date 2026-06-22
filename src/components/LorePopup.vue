<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  title: string
  text: string
  x: number
  y: number
}>()

const emit = defineEmits<{
  close: []
}>()

const popupRef = ref<HTMLElement | null>(null)

/*
  Позиция попапа следует за сущностью без ограничений по краям экрана.
  Если сущность уходит за пределы видимости — попап уходит вместе с ней.
  SceneManager сам скроет попап, когда сущность полностью покинет вьюпорт.
*/
const popupStyle = computed(() => {
  const ph = 200

  const left = props.x + 30
  const top = props.y - ph / 2

  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    ref="popupRef"
    class="lore-popup"
    :style="popupStyle"
    @click.stop
  >
    <button class="lore-close" @click="emit('close')" aria-label="Закрыть">&#10005;</button>
    <h3 class="lore-title">{{ title }}</h3>
    <p class="lore-text">{{ text }}</p>
  </div>
</template>

<style scoped>
.lore-popup {
  position: fixed;
  width: 340px;
  max-width: calc(100vw - 40px);
  background: rgba(10, 10, 30, 0.92);
  border: 1px solid rgba(180, 160, 120, 0.4);
  border-radius: 8px;
  padding: 20px 24px;
  z-index: 100;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  color: #d8d0c0;
  font-family: 'Georgia', serif;
  user-select: text;
  cursor: auto;
}

.lore-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  color: #887766;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.lore-close:hover {
  color: #ccaa88;
}

.lore-title {
  font-size: 1.1rem;
  font-weight: 400;
  margin: 0 0 10px;
  color: #ccaa88;
  letter-spacing: 0.04em;
}

.lore-text {
  font-size: 0.9rem;
  line-height: 1.7;
  margin: 0;
  color: #b0a898;
}
</style>
