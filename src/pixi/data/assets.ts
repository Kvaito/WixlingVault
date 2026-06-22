import vensyImage from '../../assets/characters/VensyCharacter.png'

/*
  Asset Registry
  ==============
  Маппинг spriteName → URL (через Vite-импорты).

  Каждая новая картинка добавляется сюда:
    1. import image from 'путь'
    2. запись 'sprite_name': image

  SceneManager использует этот реестр, чтобы превратить имя спрайта из конфига
  в реальный PixiJS Sprite.
*/
export const SPRITE_REGISTRY: Record<string, string> = {
  vensy_body: vensyImage,
}

console.log('[assets] Sprite registry loaded:', JSON.stringify(SPRITE_REGISTRY, null, 2))
