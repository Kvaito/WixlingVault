import type { TileDef } from '../layers/PanoramaTiles'
import type { CharacterConfig } from '../entities/Character'
import type { StructureConfig } from '../entities/Structure'
import type { ArtifactConfig } from '../entities/Artifact'

/*
  SCENE CONFIG
  ============
  Все данные сцены в одном месте.
  При добавлении спрайтов — заменяем заглушки на реальные имена файлов,
  расширяем states/animations по необходимости.
*/

// ---------- Слои ----------

export const LAYER_CONFIG = {
  far: {
    scrollSpeed: 0.2,
    tileWidth: 1200,
    tileCount: 8,
  },
  mid: {
    scrollSpeed: 0.5,
  },
  near: {
    scrollSpeed: 1.0,
  },
} as const

// ---------- Тайлы панорамы (far-слой) ----------
// Каждый тайл — функция, рисующая на Graphics. Пока геометрия-заглушка.

export const TILE_DEFS: TileDef[] = [
  // Tile 0: ночное небо, луна, горы
  {
    draw(g, w, h) {
      // Небо
      g.rect(0, 0, w, h)
      g.fill({ color: 0x0a0a2e })

      // Звёзды (точки)
      g.circle(100, 60, 2)
      g.circle(250, 40, 1.5)
      g.circle(400, 90, 2)
      g.circle(550, 30, 1)
      g.circle(700, 70, 2.5)
      g.circle(850, 45, 1.5)
      g.circle(1000, 55, 2)
      g.fill({ color: 0xffffff })

      // Луна
      g.circle(200, 120, 40)
      g.fill({ color: 0xddd8c8 })

      // Далёкие горы
      g.poly([
        0, h, 0, h - 180,
        60, h - 220, 140, h - 170, 220, h - 260,
        300, h - 190, 380, h - 280, 460, h - 200,
        540, h - 250, 620, h - 180, 700, h - 240,
        780, h - 200, 860, h - 290, 940, h - 210,
        1020, h - 260, 1100, h - 190, w, h - 200,
        w, h,
      ])
      g.fill({ color: 0x1a1a3e })
    },
  },

  // Tile 1: вариация — другой силуэт гор, облака
  {
    draw(g, w, h) {
      g.rect(0, 0, w, h)
      g.fill({ color: 0x0a0a2e })

      g.circle(150, 80, 1.5)
      g.circle(350, 35, 2)
      g.circle(500, 65, 1)
      g.circle(650, 95, 2)
      g.circle(900, 50, 2.5)
      g.circle(1050, 75, 1.5)
      g.fill({ color: 0xffffff })

      // Полумесяц
      g.circle(800, 100, 35)
      g.fill({ color: 0xddd8c8 })
      g.circle(815, 90, 30)
      g.fill({ color: 0x0a0a2e })

      // Облака (эллипсы)
      g.ellipse(200, 130, 80, 20)
      g.fill({ color: 0x2a2a4e, alpha: 0.6 })
      g.ellipse(600, 110, 100, 25)
      g.fill({ color: 0x2a2a4e, alpha: 0.4 })

      // Горы другой формы
      g.poly([
        0, h, 0, h - 200,
        80, h - 240, 160, h - 180, 250, h - 300,
        340, h - 210, 430, h - 270, 520, h - 190,
        610, h - 250, 700, h - 220, 790, h - 280,
        880, h - 200, 970, h - 260, 1060, h - 190,
        w, h - 210, w, h,
      ])
      g.fill({ color: 0x18183a })
    },
  },

  // Tile 2: снова вариация с пиками и туманом
  {
    draw(g, w, h) {
      g.rect(0, 0, w, h)
      g.fill({ color: 0x0a0a2e })

      g.circle(80, 50, 1.5)
      g.circle(300, 70, 2)
      g.circle(480, 25, 1)
      g.circle(630, 55, 2.5)
      g.circle(780, 40, 1.5)
      g.circle(950, 80, 2)
      g.circle(1100, 45, 1)
      g.fill({ color: 0xffffff })

      // Туман внизу
      g.ellipse(400, h - 60, 500, 50)
      g.fill({ color: 0x1a2a4e, alpha: 0.3 })

      // Острые пики
      g.poly([
        0, h, 0, h - 160,
        50, h - 320, 100, h - 180, 170, h - 250,
        250, h - 290, 330, h - 170, 420, h - 340,
        510, h - 200, 600, h - 280, 690, h - 190,
        780, h - 310, 870, h - 210, 960, h - 260,
        1050, h - 180, w, h - 230, w, h,
      ])
      g.fill({ color: 0x202045 })
    },
  },

  // Tile 3: рассветная вариация
  {
    draw(g, w, h) {
      g.rect(0, 0, w, h)
      g.fill({ color: 0x0c0c30 })

      g.circle(120, 45, 2)
      g.circle(340, 85, 1.5)
      g.circle(560, 35, 2)
      g.circle(720, 70, 1)
      g.circle(940, 55, 2.5)
      g.fill({ color: 0xffffff })

      // Горизонт с лёгким свечением
      g.rect(0, h - 30, w, 30)
      g.fill({ color: 0x1a1030, alpha: 0.5 })

      // Пологие холмы
      g.poly([
        0, h, 0, h - 140,
        100, h - 160, 200, h - 120, 310, h - 180,
        420, h - 130, 530, h - 190, 640, h - 140,
        750, h - 170, 860, h - 130, 970, h - 190,
        1080, h - 140, w, h - 160, w, h,
      ])
      g.fill({ color: 0x1c1c40 })
    },
  },
]

// ---------- Персонажи (mid-слой) ----------

export const CHARACTER_CONFIGS: CharacterConfig[] = [
  {
    id: 'keeper',
    x: 1800,
    y: 520,
    sprite: 'keeper_body',
    zIndex: 10,
    lore: {
      title: 'Хранитель',
      text: 'Страж порога между мирами. Никто не помнит, когда он занял свой пост — кажется, он стоял здесь всегда.',
    },
    parts: {
      eyes: { sprite: 'keeper_eyes', animations: ['blink'] },
      hand: { sprite: 'keeper_hand', animations: ['idle', 'wave'] },
    },
    defaultState: { met: false },
  },
  {
    id: 'wanderer',
    x: 3200,
    y: 480,
    sprite: 'wanderer_body',
    zIndex: 8,
    lore: {
      title: 'Странник',
      text: 'Безымянный путник, пересекающий осколки миров в поисках утраченной мелодии. Говорят, его плащ соткан из тишины.',
    },
    defaultState: { met: false },
  },
]

// ---------- Здания (mid-слой) ----------

export const STRUCTURE_CONFIGS: StructureConfig[] = [
  {
    id: 'tower_watch',
    x: 600,
    y: 380,
    sprite: 'tower_watch',
    zIndex: 3,
    width: 80,
    height: 320,
    lore: {
      title: 'Дозорная башня',
      text: 'Одна из четырёх башен, отмечающих границы Воксленда. В ясные ночи с её вершины видно мерцание соседнего фрагмента.',
    },
  },
  {
    id: 'arch_gate',
    x: 2400,
    y: 440,
    sprite: 'arch_gate',
    zIndex: 4,
    width: 120,
    height: 260,
    lore: {
      title: 'Арка Забвения',
      text: 'Пройдя под этой аркой, путник на мгновение забывает своё имя. Одни возвращаются просветлёнными, другие — потерянными навсегда.',
    },
  },
  {
    id: 'shrine_small',
    x: 4200,
    y: 500,
    sprite: 'shrine_small',
    zIndex: 2,
    width: 50,
    height: 100,
    lore: {
      title: 'Малый храм',
      text: 'Заброшенное святилище, посвящённое давно забытому божеству. Цветы у его подножия никогда не вянут.',
    },
  },
]

// ---------- Артефакты (mid-слой) ----------

export const ARTIFACT_CONFIGS_MID: ArtifactConfig[] = [
  {
    id: 'shard_forest',
    x: 1100,
    y: 580,
    sprite: 'shard_forest',
    zIndex: 15,
    lore: {
      title: 'Осколок Леса',
      text: 'Фрагмент древнего леса, застывший во времени. Внутри ещё колышутся кроны — достаточно поднести ухо, чтобы услышать шёпот листвы.',
    },
    defaultState: { activated: false },
    states: {
      activated: { glow: true },
    },
  },
  {
    id: 'shard_crystal',
    x: 3600,
    y: 600,
    sprite: 'shard_crystal',
    zIndex: 12,
    lore: {
      title: 'Кристалл Памяти',
      text: 'Гранёный осколок чистой энергии. Говорят, внутри хранится воспоминание первого творца этой вселенной — того, кто произнёс первое слово.',
    },
    defaultState: { activated: false },
    states: {
      activated: { glow: true, float: true },
    },
  },
]

// ---------- Артефакты (near-слой, ближе к экрану) ----------

export const ARTIFACT_CONFIGS_NEAR: ArtifactConfig[] = [
  {
    id: 'shard_melody',
    x: 800,
    y: 300,
    sprite: 'shard_melody',
    zIndex: 20,
    lore: {
      title: 'Осколок Мелодии',
      text: 'Крошечный светящийся фрагмент. Если долго смотреть на него, в голове начинает звучать нота — у каждого своя.',
    },
    defaultState: { activated: false },
    states: {
      activated: { glow: true },
    },
  },
  {
    id: 'shard_door',
    x: 2800,
    y: 250,
    sprite: 'shard_door',
    zIndex: 25,
    lore: {
      title: 'Щепка Двери',
      text: 'Осколок портала, ведущего в никуда — или куда угодно, если знать нужную частоту. Пока молчит.',
    },
    defaultState: { activated: false },
    states: {
      activated: { glow: true, visible: false },
    },
  },
]

// ---------- Сущности near-слоя ----------

export const CHARACTER_CONFIGS_NEAR: CharacterConfig[] = [
  {
    id: 'musician',
    x: 1500,
    y: 200,
    sprite: 'musician_body',
    zIndex: 30,
    lore: {
      title: 'Музыкант',
      text: 'Единственный, кто слышит мелодию осколков целиком. Его инструмент собран из фрагментов разных миров — каждая струна звучит голосом утраченного.',
    },
    defaultState: { playing: false, met: false },
  },
]

// ---------- Сводный экспорт ----------

export const FAR_ENTITIES: [] = []
export const MID_ENTITIES = [...CHARACTER_CONFIGS, ...STRUCTURE_CONFIGS, ...ARTIFACT_CONFIGS_MID]
export const NEAR_ENTITIES = [...ARTIFACT_CONFIGS_NEAR, ...CHARACTER_CONFIGS_NEAR]
