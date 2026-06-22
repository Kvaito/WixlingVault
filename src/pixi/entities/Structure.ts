import { Container } from 'pixi.js'
import { SceneEntity, type LoreData } from './SceneEntity'

/*
  Structure — статичный объект сцены: здания, башни, мосты, колонны.

  В отличие от Character:
    - Нет системы анимаций частей (статика).
    - Может иметь лор (кликабелен).
    - Может занимать большую площадь (широкий хитбокс).
    - Может быть многослойным: фасад, окна, двери — но без анимации,
      только статичные наложенные спрайты.

  При необходимости добавить анимируемые элементы (флаги на ветру, дым из труб)
  — либо наследовать от Character, либо добавить поле animationsParts
  по аналогии с Character.parts.

  Состояния:
    - default: обычный вид
    - destroyed / repaired / lit / ... — меняется спрайт или tint
*/

export interface StructureConfig {
  id: string
  x: number
  y: number
  sprite: string
  lore?: LoreData | null
  zIndex?: number
  width?: number
  height?: number
  defaultState?: Record<string, unknown>
}

export class Structure extends SceneEntity {
  visual: Container

  constructor(config: StructureConfig) {
    super(config.id, 'structure', config.lore ?? null)
    this.visual = new Container()
    this.addChild(this.visual)
    this.x = config.x
    this.y = config.y
    this.zIndex = config.zIndex ?? 0

    if (config.width && config.height) {
      this.hitArea = {
        contains: (x: number, y: number) =>
          x >= 0 && x <= config.width! && y >= 0 && y <= config.height!
      }
    }

    if (config.defaultState) {
      Object.entries(config.defaultState).forEach(([key, value]) => {
        this.setState(key, value)
      })
    }
  }
}
