import { ref } from 'vue'

/*
  useSceneScroll
  ==============
  Управление скроллом сцены через несколько источников ввода:
    - Drag (pointerdown/move/up)
    - Колёсико мыши (wheel)
    - Клавиши-стрелки (автоповтор через setInterval)
    - Тач (один палец)

  Устройство:
    Композабл не вешает события сам — он экспортирует bindEvents(canvas)
    и unbindEvents(). Вызывающая сторона (PixiStage.vue) сама решает,
    когда canvas готов и когда произошёл маунт.
    Это нужно потому, что PixiJS создаёт свой canvas асинхронно,
    и подменяет им шаблонный <canvas> через replaceWith().
*/

export interface UseSceneScrollOptions {
  onTargetChange: (targetX: number) => void
  getTargetX: () => number
}

export function useSceneScroll(options: UseSceneScrollOptions) {
  const targetX = ref(0)

  // ------ Состояние ------

  let canvas: HTMLCanvasElement | null = null
  let isDragging = false
  let dragStartX = 0
  let dragStartTarget = 0

  // ------ Pointer / Drag ------

  function onPointerDown(e: PointerEvent) {
    isDragging = true
    dragStartX = e.clientX
    dragStartTarget = options.getTargetX()
    canvas?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return
    const dx = e.clientX - dragStartX
    targetX.value = dragStartTarget - dx
    options.onTargetChange(targetX.value)
  }

  function onPointerUp(_e: PointerEvent) {
    isDragging = false
    dragStartTarget = targetX.value
  }

  // ------ Wheel ------

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    // Горизонтальный скролл если есть, иначе вертикальный переводим в X
    const dx = e.deltaX !== 0 ? e.deltaX : e.deltaY
    targetX.value = options.getTargetX() - dx
    options.onTargetChange(targetX.value)
  }

  // ------ Keyboard ------

  const keysDown = new Set<string>()
  let kbInterval: ReturnType<typeof setInterval> | null = null

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      keysDown.add(e.key)
      if (!kbInterval) {
        kbInterval = setInterval(() => {
          let dx = 0
          if (keysDown.has('ArrowLeft')) dx += 8
          if (keysDown.has('ArrowRight')) dx -= 8
          if (dx !== 0) {
            targetX.value = options.getTargetX() + dx
            options.onTargetChange(targetX.value)
          }
        }, 16)
      }
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keysDown.delete(e.key)
    if (keysDown.size === 0 && kbInterval) {
      clearInterval(kbInterval)
      kbInterval = null
    }
  }

  // ------ Touch gestures ------

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      isDragging = true
      dragStartX = e.touches[0].clientX
      dragStartTarget = options.getTargetX()
    } else if (e.touches.length === 2) {
      // Pinch — не используется (панорама только горизонтальная), отменяем drag
      isDragging = false
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStartX
    targetX.value = dragStartTarget - dx
    options.onTargetChange(targetX.value)
  }

  function onTouchEnd(_e: TouchEvent) {
    isDragging = false
    dragStartTarget = targetX.value
  }

  // ------ Публичное API ------

  /*
    bindEvents(el)
    Вешает все обработчики на переданный canvas.
    Вызывать один раз, когда PixiJS-канвас готов.
  */
  function bindEvents(el: HTMLCanvasElement): void {
    canvas = el

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointerleave', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }

  /*
    unbindEvents()
    Снимает все обработчики. Вызывать при размонтировании компонента.
  */
  function unbindEvents(): void {
    if (!canvas) return

    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerUp)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)

    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)

    if (kbInterval) {
      clearInterval(kbInterval)
      kbInterval = null
    }

    canvas = null
  }

  return { targetX, bindEvents, unbindEvents }
}
