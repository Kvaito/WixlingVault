import { Application, Container, Graphics, type Texture } from 'pixi.js'
import { ParallaxLayer } from './layers/ParallaxLayer'
import { PanoramaTiles } from './layers/PanoramaTiles'
import { SceneEntity } from './entities/SceneEntity'
import { Character } from './entities/Character'
import type { LoreData } from './entities/SceneEntity'
import {
  LAYER_CONFIG,
  TILE_DEFS,
  MID_ENTITIES,
  NEAR_ENTITIES,
} from './data/scene-config'
import { preloadTextures } from './data/assets'
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
    1. Предзагрузка текстур через Assets.load()
    2. Слои и панорама
    3. Сущности из конфига с загруженными текстурами
    4. Сегментированные фоны mid и near
    5. Сборка сцены, обработчик клика, тикер
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

  private constructor(app: Application) {
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
  }

  static async create(app: Application): Promise<SceneManager> {
    const sm = new SceneManager(app)

    const textures = await preloadTextures()

    sm.buildMidBackground(app.screen.height)
    sm.buildNearBackground(app.screen.height)

    sm.populateEntities(textures)

    app.stage.addChild(sm.farLayer.container)
    app.stage.addChild(sm.midLayer.container)
    app.stage.addChild(sm.nearLayer.container)

    app.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = app.canvas.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      sm.handleClick(screenX, screenY)
    })

    app.ticker.add(() => {
      sm.updateScroll()
    })

    return sm
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
      const localX = screenX - layer.container.x

      const entities = layer === this.nearLayer ? this.nearEntities : this.midEntities
      for (const entity of entities) {
        if (entity.hitTest(localX, screenY)) {
          if (entity.lore && this.onLore) {
            this.onLore(entity.lore, screenX, screenY)
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

  private populateEntities(textures: Record<string, Texture>): void {
    const maxHeight = this.app.screen.height * 0.8

    for (const config of MID_ENTITIES) {
      const entity = new Character(config)
      const texture = textures[config.sprite]
      if (texture) {
        entity.setBodyTexture(texture, maxHeight)
      }
      this.midLayer.container.addChild(entity)
      this.midEntities.push(entity)
    }

    for (const config of NEAR_ENTITIES) {
      const entity = new Character(config)
      const texture = textures[config.sprite]
      if (texture) {
        entity.setBodyTexture(texture, maxHeight)
      }
      this.nearLayer.container.addChild(entity)
      this.nearEntities.push(entity)
    }
  }
}
