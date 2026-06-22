import { Container } from 'pixi.js'

export interface LoreData {
  title: string
  text: string
}

export interface EntityState {
  [key: string]: unknown
}

export interface StateVariant {
  [stateKey: string]: unknown
}

export class SceneEntity extends Container {
  entityId: string
  entityType: string
  lore: LoreData | null
  state: EntityState
  zIndex: number

  constructor(id: string, type: string, lore: LoreData | null) {
    super()
    this.entityId = id
    this.entityType = type
    this.lore = lore
    this.state = {}
    this.zIndex = 0
    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  setState(key: string, value: unknown): void {
    this.state[key] = value
    this.onStateChanged(key, value)
  }

  getState<T = unknown>(key: string): T | undefined {
    return this.state[key] as T | undefined
  }

  onStateChanged(_key: string, _value: unknown): void {
    // Override in subclasses to react to state changes (e.g. visual swap)
  }

  /*
    hitTest(localX, localY)
    Проверяет попадание клика по сущности.
    localX/localY — координаты клика в системе слоя-родителя
    (screenX - layerContainer.x, screenY).

    Используем позицию сущности и фиксированный радиус вместо getBounds(),
    потому что getBounds() возвращает глобальные координаты,
    а localX уже переведён в пространство слоя.
  */
  hitTest(localX: number, localY: number): boolean {
    const halfW = 45
    const halfH = 55
    return (
      Math.abs(localX - this.x) < halfW &&
      Math.abs(localY - this.y) < halfH
    )
  }
}
