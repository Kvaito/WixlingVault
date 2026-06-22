import { defineStore } from 'pinia'
import { ref } from 'vue'

/*
  Settings Store
  ==============
  Центральное хранилище пользовательских настроек.

  Сейчас:
    scrollSpeed — множитель скорости прокрутки сцены (0.25–3.0, по умолчанию 1.0)

  В будущем сюда лягут:
    - язык интерфейса
    - тема оформления
    - громкость (если будет звук)
    - любые пользовательские предпочтения

  Pinia выбран потому что:
    - реактивность из коробки
    - devtools-интеграция
    - не нужно прокидывать пропсы через всё дерево
*/

export const useSettingsStore = defineStore('settings', () => {
  const scrollSpeed = ref(1.0)

  function setScrollSpeed(value: number): void {
    scrollSpeed.value = Math.max(0.25, Math.min(3.0, value))
  }

  return { scrollSpeed, setScrollSpeed }
})
