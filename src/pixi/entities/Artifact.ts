import { Container } from 'pixi.js'
import { SceneEntity, type LoreData } from './SceneEntity'

/*
  Artifact — интерактивный предмет/осколок на сцене.

  Особенности:
    - Малый размер, точечный хитбокс.
    - Может светиться / пульсировать для привлечения внимания.
    - Состояния меняют визуал навсегда:
        activated: false → true (осколок загорелся)
        collected: false → true (исчезает со сцены или меняет слой)
    - Может быть частью цепочки: активация одного артефакта
      разблокирует другой (реализуется через глобальный state в SceneManager).

  Пример конфигурации (scene-config.ts):
    {
      id: 'shard_forest',
      type: 'artifact',
      x: 1400,
      y: 500,
      sprite: 'shard_forest',
      lore: { title: 'Осколок Леса', text: '...' },
      defaultState: { activated: false },
      states: {
        activated: { sprite: 'shard_forest_glow', glow: true }
      }
    }

  Визуальные эффекты (на будущее):
    - glow: пульсирующая аура (Graphics.circle + alpha-анимация в ticker)
    - float: парение вверх-вниз (sin-анимация y в ticker)
    - sparkle: частицы вокруг (ParticleContainer)
*/

export interface ArtifactStateConfig {
  sprite?: string
  glow?: boolean
  float?: boolean
  visible?: boolean
  [key: string]: unknown
}

export interface ArtifactConfig {
  id: string
  x: number
  y: number
  sprite: string
  lore?: LoreData | null
  zIndex?: number
  defaultState?: Record<string, unknown>
  states?: Record<string, ArtifactStateConfig>
}

export class Artifact extends SceneEntity {
  visual: Container
  states: Record<string, ArtifactStateConfig>

  constructor(config: ArtifactConfig) {
    super(config.id, 'artifact', config.lore ?? null)
    this.visual = new Container()
    this.states = config.states ?? {}
    this.addChild(this.visual)
    this.x = config.x
    this.y = config.y
    this.zIndex = config.zIndex ?? 0

    if (config.defaultState) {
      Object.entries(config.defaultState).forEach(([key, value]) => {
        this.setState(key, value)
      })
    }
  }

  onStateChanged(key: string, value: unknown): void {
    // When state changes, look up the matching state config and apply visual changes
    const stateConfig = this.states[String(value)]
    if (stateConfig) {
      this.applyStateConfig(stateConfig)
    }
  }

  private applyStateConfig(config: ArtifactStateConfig): void {
    if (config.visible === false) {
      this.visible = false
    }
    // glow, float etc. — will be handled by SceneManager ticker later
  }
}
