import { Assets, type Texture } from 'pixi.js'
import vensyImage from '../../assets/characters/VensyCharacter.png'

/*
  Asset Registry
  ==============
  Маппинг spriteName → URL (через Vite-импорты).

  Каждая новая картинка добавляется сюда:
    1. import image from 'путь'
    2. запись 'sprite_name': image

  preloadTextures() загружает все текстуры через PixiJS Assets.load()
  и возвращает маппинг spriteName → Texture.
*/

export const SPRITE_REGISTRY: Record<string, string> = {
  vensy_body: vensyImage,
}

export async function preloadTextures(): Promise<Record<string, Texture>> {
  const entries = Object.entries(SPRITE_REGISTRY)
  const textures = await Promise.all(
    entries.map(async ([name, url]) => {
      const texture = await Assets.load(url)
      return [name, texture] as const
    }),
  )
  return Object.fromEntries(textures)
}
