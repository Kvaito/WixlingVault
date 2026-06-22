import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { ParallaxLayer } from './layers/ParallaxLayer'
import { PanoramaTiles } from './layers/PanoramaTiles'
import { SceneEntity } from './entities/SceneEntity'
import { Character } from './entities/Character'
import { Structure } from './entities/Structure'
import { Artifact } from './entities/Artifact'
import type { LoreData } from './entities/SceneEntity'
import {
  LAYER_CONFIG,
  TILE_DEFS,
  MID_ENTITIES,
  NEAR_ENTITIES,
} from './data/scene-config'
import { SPRITE_REGISTRY } from './data/assets'
import { lerp } from './utils/lerp'

export type LoreCallback = (lore: LoreData, screenX: number, screenY: number) => void

/*
  SceneManager
  ============
  Центральный диспетчер сцены, связывающий слои, сущности, скролл и интерактив.

  Мир зациклен: все три слоя имеют общую логическую ширину WORLD_WIDTH = 9600.
  У каждого слоя своя пиксельная ширина = WORLD_WIDTH * scrollSpeed.
  При прокрутке контент (сегменты фона и сущности) бесшовно переносится с края на край,
  синхронно для всех слоёв — за счёт того, что все они завязаны на один sceneX.

  Порядок инициализации:
    1. Слои и панорама
    2. Сущности из конфига (включая отрисовку зданий внутри Structure)
    3. Сегментированные фоны mid и near
    4. Сборка сцены, обработчик клика, тикер
*/

// Общая логическая ширина мира — один полный цикл панорамы
const WORLD_WIDTH = 9600

export class SceneManager {
  app: Application

  farLayer: ParallaxLayer
  midLayer: ParallaxLayer
  nearLayer: ParallaxLayer

  panoramas: PanoramaTiles

  private targetX = 0
  private currentX = 0

  // Множитель скорости — меняется пользователем через SettingsPanel → Pinia-store
  private speedMultiplier = 1.0

  // Пиксельные ширины слоёв для wrapping'а
  private readonly midPixelWidth: number
  private readonly nearPixelWidth: number

  // Сегменты фона — оборачиваются в updateScroll как тайлы панорамы
  private midBgSegments: Container[] = []
  private nearBgSegments: Container[] = []

  // Сущности по слоям — тоже оборачиваются
  private midEntities: SceneEntity[] = []
  private nearEntities: SceneEntity[] = []

  // Колбэки для связи с Vue: показ/обновление/скрытие лора
  private onLore: LoreCallback | null = null
  private onLorePositionUpdate: ((x: number, y: number) => void) | null = null
  private onLoreHide: (() => void) | null = null

  // Активная сущность — чтобы попап следовал за ней при скролле
  private activeLoreEntity: SceneEntity | null = null
  private activeLoreLayer: ParallaxLayer | null = null

  constructor(app: Application) {
    this.app = app

    this.midPixelWidth = WORLD_WIDTH * LAYER_CONFIG.mid.scrollSpeed   // 4800
    this.nearPixelWidth = WORLD_WIDTH * LAYER_CONFIG.near.scrollSpeed  // 9600

    // --- Создание слоёв ---

    this.farLayer = new ParallaxLayer(LAYER_CONFIG.far.scrollSpeed)
    this.midLayer = new ParallaxLayer(LAYER_CONFIG.mid.scrollSpeed)
    this.nearLayer = new ParallaxLayer(LAYER_CONFIG.near.scrollSpeed)

    // --- Панорама на far-слое (уже зациклена через PanoramaTiles) ---

    this.panoramas = new PanoramaTiles(
      LAYER_CONFIG.far.tileWidth,
      LAYER_CONFIG.far.tileCount,
      TILE_DEFS,
      app.screen.height,
    )
    this.farLayer.container.addChild(this.panoramas.container)

    // --- Сущности создаются ДО фонов, чтобы здания отрисовались внутри своих Structure ---

    this.populateEntities()

    // --- Сегментированные фоны для mid и near (зацикленные) ---

    this.buildMidBackground(app.screen.height)
    this.buildNearBackground(app.screen.height)

    // --- Сборка сцены ---

    app.stage.addChild(this.farLayer.container)
    app.stage.addChild(this.midLayer.container)
    app.stage.addChild(this.nearLayer.container)

    // --- Обработка кликов ---

    app.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = app.canvas.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      this.handleClick(screenX, screenY)
    })

    // --- Тикер ---

    app.ticker.add(() => {
      this.updateScroll()
    })
  }

  // ------ Публичные методы ------

  setLoreCallback(cb: LoreCallback): void {
    this.onLore = cb
  }

  setLorePositionCallback(cb: ((x: number, y: number) => void) | null): void {
    this.onLorePositionUpdate = cb
  }

  setTargetX(x: number): void {
    this.targetX = x
  }

  getTargetX(): number {
    return this.targetX
  }

  setSpeedMultiplier(v: number): void {
    this.speedMultiplier = v
  }

  /*
    hideLore
    Сбрасывает отслеживание активной сущности.
    Вызывается из Vue при закрытии попапа.
  */
  setLoreHideCallback(cb: (() => void) | null): void {
    this.onLoreHide = cb
  }

  hideLore(): void {
    this.activeLoreEntity = null
    this.activeLoreLayer = null
    this.onLorePositionUpdate = null
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height)

    // Пересоздать сегментированные фоны под новый размер
    this.destroySegments(this.midLayer, this.midBgSegments)
    this.destroySegments(this.nearLayer, this.nearBgSegments)
    this.midBgSegments = []
    this.nearBgSegments = []
    this.buildMidBackground(height)
    this.buildNearBackground(height)
  }

  destroy(): void {
    this.app.ticker.remove(this.updateScroll)
    this.app.stage.removeChildren()
  }

  // ------ Прокрутка ------

  private updateScroll = (): void => {
    // Плавный скролл с учётом пользовательского множителя скорости
    this.currentX = lerp(this.currentX, this.targetX * this.speedMultiplier, 0.08)

    this.farLayer.applyScroll(this.currentX)
    this.midLayer.applyScroll(this.currentX)
    this.nearLayer.applyScroll(this.currentX)

    // Far-слой: обновляем тайлы панорамы (их собственный wrapping)
    this.panoramas.update(this.farLayer.container.x, this.app.screen.width)

    // Mid-слой: оборачиваем сегменты фона и сущности
    this.wrapContent(this.midLayer.container, this.midBgSegments, this.midPixelWidth)
    this.wrapContent(this.midLayer.container, this.midEntities, this.midPixelWidth)

    // Near-слой: оборачиваем сегменты фона и сущности
    this.wrapContent(this.nearLayer.container, this.nearBgSegments, this.nearPixelWidth)
    this.wrapContent(this.nearLayer.container, this.nearEntities, this.nearPixelWidth)

    // Сортировка сущностей по zIndex
    this.sortLayerEntities(this.midLayer)
    this.sortLayerEntities(this.nearLayer)

    // Попап следует за активной сущностью при скролле
    if (this.activeLoreEntity && this.activeLoreLayer && this.onLorePositionUpdate) {
      const screenX = this.activeLoreLayer.container.x + this.activeLoreEntity.x
      const screenY = this.activeLoreEntity.y
      this.onLorePositionUpdate(screenX, screenY)

      // Если сущность полностью ушла за экран — скрыть попап
      const margin = 80
      if (screenX < -margin || screenX > this.app.screen.width + margin) {
        this.activeLoreEntity = null
        this.activeLoreLayer = null
        if (this.onLoreHide) {
          this.onLoreHide()
        }
      }
    }
  }

  /*
    wrapContent
    Переносит дочерние контейнеры с края на край, когда они выходят за экран.
    Механика идентична PanoramaTiles: если screenX < -margin → ребёнок прыгает вправо,
    если screenX > screenWidth + margin → прыгает влево.
    Величина прыжка = полная пиксельная ширина слоя (pixelWidth).
  */
  private wrapContent(
    layerContainer: Container,
    children: Container[],
    pixelWidth: number,
  ): void {
    const screenWidth = this.app.screen.width
    const margin = 400 // запас, чтобы не было видно прыжка

    for (const child of children) {
      // Экранная позиция ребёнка = позиция контейнера слоя + локальная позиция ребёнка
      const screenX = layerContainer.x + child.x

      if (screenX < -margin - screenWidth) {
        child.x += pixelWidth
      } else if (screenX > screenWidth + margin) {
        child.x -= pixelWidth
      }
    }
  }

  // ------ Сегментированные фоны ------

  /*
    buildMidBackground
    Создаёт 4 сегмента по 1200px, вместе покрывают midPixelWidth = 4800px.
    Каждый сегмент рисует землю, дорогу и деревья от своего worldOffset.
    При wrapping'е сегменты циклически переставляются — создаётся эффект бесконечного мира.
  */
  private buildMidBackground(screenHeight: number): void {
    const segments = 4
    const segWidth = this.midPixelWidth / segments // 1200
    const h = screenHeight

    for (let i = 0; i < segments; i++) {
      const seg = new Container()
      seg.x = i * segWidth
      const worldOffset = i * segWidth // начало сегмента в логических координатах mid-слоя

      const g = new Graphics()

      // Земля
      g.rect(0, h * 0.55, segWidth, h * 0.45)
      g.fill({ color: 0x1a3a1a })

      // Дорога
      g.rect(0, h * 0.65, segWidth, 12)
      g.fill({ color: 0x4a3a2a })

      // Деревья на линии горизонта — позиция зависит от worldOffset для непрерывности
      for (let x = 0; x <= segWidth; x += 60) {
        const treeWorldX = worldOffset + x
        const variation = (treeWorldX % 120 === 0) ? 40 : 25
        g.poly([x, h * 0.55, x - 15, h * 0.55 + variation, x + 15, h * 0.55 + variation])
        g.fill({ color: 0x0d3d0d })
      }

      seg.addChild(g)
      this.midLayer.container.addChild(seg)
      this.midBgSegments.push(seg)
    }
  }

  /*
    buildNearBackground
    Создаёт 8 сегментов по 1200px, покрывают nearPixelWidth = 9600px.
    Ближняя земля темнее, с кустами на переднем плане.
  */
  private buildNearBackground(screenHeight: number): void {
    const segments = 8
    const segWidth = this.nearPixelWidth / segments // 1200
    const h = screenHeight

    for (let i = 0; i < segments; i++) {
      const seg = new Container()
      seg.x = i * segWidth
      const worldOffset = i * segWidth

      const g = new Graphics()

      // Ближняя земля (темнее)
      g.rect(0, h * 0.7, segWidth, h * 0.3)
      g.fill({ color: 0x0f2f0f })

      // Кусты
      for (let x = 0; x <= segWidth; x += 200) {
        const bushWorldX = worldOffset + x
        const r = 30 + (bushWorldX % 40)
        g.ellipse(x, h * 0.7 + 10, r, 20)
        g.fill({ color: 0x0a250a })
      }

      seg.addChild(g)
      this.nearLayer.container.addChild(seg)
      this.nearBgSegments.push(seg)
    }
  }

  private destroySegments(layer: ParallaxLayer, segments: Container[]): void {
    for (const seg of segments) {
      layer.container.removeChild(seg)
      seg.destroy({ children: true })
    }
  }

  // ------ Клики ------

  private handleClick(screenX: number, screenY: number): void {
    for (const layer of [this.nearLayer, this.midLayer]) {
      // Переводим экранные координаты в локальные координаты слоя
      const localX = screenX - layer.container.x

      const entities = layer === this.nearLayer ? this.nearEntities : this.midEntities
      for (const entity of entities) {
        if (entity.hitTest(localX, screenY)) {
          if (entity.lore && this.onLore) {
            this.onLore(entity.lore, screenX, screenY)
            // Запоминаем сущность и её слой — чтобы попап следовал за ней при скролле
            this.activeLoreEntity = entity
            this.activeLoreLayer = layer
          }
          return
        }
      }
    }
  }

  // ------ Сущности ------

  private sortLayerEntities(layer: ParallaxLayer): void {
    layer.container.sortChildren()
  }

  /*
    populateEntities
    Создаёт сущности из конфига. Вызывается ДО построения фонов,
    чтобы здания могли получить свою графику прямо внутри Structure.
  */
  private populateEntities(): void {
    for (const config of MID_ENTITIES) {
      let entity: SceneEntity | null = null

      if ('parts' in config && config.parts) {
        entity = new Character(config as Parameters<typeof Character.prototype.constructor>[0])
      } else if ('width' in config && config.width) {
        entity = new Structure(config as Parameters<typeof Structure.prototype.constructor>[0])
      } else if ('states' in config) {
        entity = new Artifact(config as Parameters<typeof Artifact.prototype.constructor>[0])
      }

      if (entity) {
        this.resolveSpriteUrl(entity, config)
        this.drawEntityPlaceholder(entity)
        this.midLayer.container.addChild(entity)
        this.midEntities.push(entity)
      }
    }

    for (const config of NEAR_ENTITIES) {
      let entity: SceneEntity | null = null

      if ('parts' in config && config.parts) {
        entity = new Character(config as Parameters<typeof Character.prototype.constructor>[0])
      } else if ('states' in config) {
        entity = new Artifact(config as Parameters<typeof Artifact.prototype.constructor>[0])
      }

      if (entity) {
        this.resolveSpriteUrl(entity, config)
        this.drawEntityPlaceholder(entity)
        this.nearLayer.container.addChild(entity)
        this.nearEntities.push(entity)
      }
    }
  }

  /*
    resolveSpriteUrl
    Для сущностей со спрайтом (Character, Artifact, Structure) —
    находит URL в SPRITE_REGISTRY по имени спрайта из конфига.
  */
  private resolveSpriteUrl(entity: SceneEntity, config: Record<string, unknown>): void {
    if (entity instanceof Character) {
      const spriteName = config.sprite as string | undefined
      console.log(`[SceneManager] resolveSpriteUrl: entity=${entity.entityId} spriteName=${spriteName}`)
      if (spriteName) {
        const url = SPRITE_REGISTRY[spriteName]
        entity.spriteUrl = url ?? null
        console.log(`[SceneManager] resolveSpriteUrl: URL found = ${url ? 'YES' : 'NO'} → ${url}`)
      }
    }
  }

  private drawEntityPlaceholder(entity: SceneEntity): void {
    // Персонаж с реальной картинкой — создаём Sprite
    if (entity instanceof Character && entity.spriteUrl) {
      console.log(`[SceneManager] drawEntityPlaceholder: Character '${entity.entityId}' → Sprite.from(${entity.spriteUrl})`)

      const sprite = Sprite.from(entity.spriteUrl)

      console.log(`[SceneManager] Sprite raw size: ${sprite.width}×${sprite.height}`)

      sprite.anchor.set(0.5, 1.0)  // Якорь внизу по центру — ноги персонажа на entity.y

      // Автоскейл: персонаж занимает не более 80% высоты экрана
      const maxHeight = this.app.screen.height * 0.8
      if (sprite.height > maxHeight) {
        const s = maxHeight / sprite.height
        sprite.scale.set(s)
        console.log(`[SceneManager] Scaled: factor=${s.toFixed(3)} → ${Math.round(sprite.width)}×${Math.round(sprite.height)}`)
      }

      console.log(`[SceneManager] Entity position: x=${entity.x} y=${entity.y}`)
      console.log(`[SceneManager] Screen: ${this.app.screen.width}×${this.app.screen.height}`)

      entity.body.addChild(sprite)
      return
    }

    // Заглушки Graphics для сущностей без картинок
    const g = new Graphics()

    if (entity instanceof Character) {
      g.ellipse(0, 0, 18, 30)
      g.fill({ color: 0x5577aa })
      g.circle(0, -25, 10)
      g.fill({ color: 0xddaa88 })
    } else if (entity instanceof Structure) {
      const bw = 80
      const bh = 320
      g.rect(0, -bh, bw, bh)
      g.fill({ color: 0x4a3020 })
      g.rect(4, -bh + 4, bw - 8, bh - 8)
      g.fill({ color: 0x5a4030 })
      for (let wy = -bh + 20; wy < -20; wy += 40) {
        g.rect(bw / 2 - 6, wy, 12, 16)
        g.fill({ color: 0xaaa060 })
      }
    } else if (entity instanceof Artifact) {
      g.poly([0, -15, 12, 5, -2, 20, -12, 5])
      g.fill({ color: 0x44aacc })
      g.circle(0, 0, 4)
      g.fill({ color: 0xffffff })
    }

    entity.addChild(g)
  }
}
