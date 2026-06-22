<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

/*
  SettingsPanel
  =============
  Кнопка-шестерёнка в правом верхнем углу.
  По клику — выезжает панель с ползунком скорости прокрутки.

  Позиционирование: fixed, поверх canvas и попапов.
  Панель использует <Transition> для плавного появления/исчезновения.
*/

const settings = useSettingsStore()
const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function onSpeedInput(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  settings.setScrollSpeed(value)
}
</script>

<template>
  <div class="settings-root">
    <!-- Кнопка-триггер -->
    <button
      class="settings-trigger"
      @click="toggle"
      :aria-label="isOpen ? 'Закрыть настройки' : 'Открыть настройки'"
      :title="isOpen ? 'Закрыть настройки' : 'Настройки'"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </button>

    <!-- Выезжающая панель -->
    <Transition name="panel">
      <div v-if="isOpen" class="settings-panel">
        <h3 class="panel-title">Настройки</h3>

        <label class="slider-label">
          <span>Скорость прокрутки</span>
          <span class="slider-value">{{ settings.scrollSpeed.toFixed(2) }}×</span>
        </label>
        <input
          type="range"
          class="slider"
          min="0.25"
          max="3.0"
          step="0.05"
          :value="settings.scrollSpeed"
          @input="onSpeedInput"
        />
        <div class="slider-hints">
          <span>0.25×</span>
          <span>1×</span>
          <span>3×</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-root {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 200;
}

.settings-trigger {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(180, 160, 120, 0.35);
  background: rgba(10, 10, 30, 0.75);
  color: #b0a898;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: background 0.2s, color 0.2s, transform 0.3s;
  margin-left: auto;
}

.settings-trigger:hover {
  background: rgba(30, 30, 60, 0.85);
  color: #ccaa88;
  transform: rotate(45deg);
}

.settings-panel {
  position: absolute;
  top: 48px;
  right: 0;
  width: 260px;
  background: rgba(10, 10, 30, 0.92);
  border: 1px solid rgba(180, 160, 120, 0.35);
  border-radius: 8px;
  padding: 20px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.panel-title {
  font-size: 0.95rem;
  font-weight: 400;
  color: #ccaa88;
  margin: 0 0 18px;
  letter-spacing: 0.05em;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #b0a898;
  margin-bottom: 8px;
}

.slider-value {
  color: #ccaa88;
  font-variant-numeric: tabular-nums;
}

.slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(180, 160, 120, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ccaa88;
  border: 2px solid rgba(10, 10, 30, 0.8);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ccaa88;
  border: 2px solid rgba(10, 10, 30, 0.8);
  cursor: pointer;
}

.slider-hints {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #665544;
  margin-top: 4px;
}

/* Transition */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.panel-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
