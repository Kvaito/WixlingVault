import { Container, type Texture, Sprite } from 'pixi.js'
import { SceneEntity, type LoreData } from './SceneEntity'

/*
  Character — композитный персонаж с системой анимаций частей.

  Структура:
    Character (Container)
      ├── body: Container      # Тело / основной спрайт
      └── parts: Container     # Части для покадровой анимации:
          ├── eyes: Container  # Моргание (blink)
          ├── hand: Container  # Взмах (wave)
          ├── mouth: Container # Разговор (talk)
          └── ...              # Любые именованные части

  Как будет работать анимация (когда дойдём):
    1. Каждая часть имеет массив текстур/кадров и интервал смены.
    2. ticker перебирает активные анимации и переключает кадры.
    3. Анимации могут быть циклическими (idle) или одноразовыми (click-reaction).
    4. Триггеры: idle всегда, hover при наведении, click при клике.
    5. Анимации не блокируют скролл и не мешают hit-детекту.

  Пример конфигурации анимаций (будет в scene-config.ts):
    animations: {
      eyes: { type: 'blink', frames: ['eyes_open', 'eyes_half', 'eyes_closed'], interval: 3000, loop: true },
      hand: { type: 'wave', frames: ['hand_down', 'hand_up'], interval: 2000, loop: true, trigger: 'hover' }
    }
*/

export interface PartConfig {
  sprite: string
  animations: string[]
}

export interface CharacterConfig {
  id: string
  x: number
  y: number
  sprite: string
  parts?: Record<string, PartConfig>
  lore?: LoreData | null
  zIndex?: number
  defaultState?: Record<string, unknown>
}

export class Character extends SceneEntity {
  body: Container
  parts: Container

  constructor(config: CharacterConfig) {
    super(config.id, 'character', config.lore ?? null)
    this.body = new Container()
    this.parts = new Container()
    this.addChild(this.body)
    this.addChild(this.parts)
    this.x = config.x
    this.y = config.y
    this.zIndex = config.zIndex ?? 0

    if (config.defaultState) {
      Object.entries(config.defaultState).forEach(([key, value]) => {
        this.setState(key, value)
      })
    }
  }

  setBodyTexture(texture: Texture, maxHeight: number): void {
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 1.0)
    if (sprite.height > maxHeight) {
      sprite.scale.set(maxHeight / sprite.height)
    }
    this.body.addChild(sprite)
  }

  override hitTest(localX: number, localY: number): boolean {
    if (this.body.children.length > 0) {
      const localBounds = this.body.getLocalBounds()
      const left = this.x + localBounds.minX
      const right = this.x + localBounds.maxX
      const top = this.y + localBounds.minY
      const bottom = this.y + localBounds.maxY
      return (
        localX >= left &&
        localX <= right &&
        localY >= top &&
        localY <= bottom
      )
    }
    return Math.abs(localX - this.x) < 45 && Math.abs(localY - this.y) < 120
  }
}
