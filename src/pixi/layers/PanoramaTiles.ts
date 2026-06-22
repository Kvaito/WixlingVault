import { Container, Graphics } from 'pixi.js'

export interface TileDef {
  draw: (g: Graphics, width: number, height: number) => void
}

export class PanoramaTiles {
  container: Container
  private tiles: Container[]
  private tileWidth: number
  private tileCount: number
  private totalWidth: number

  constructor(tileWidth: number, tileCount: number, tileDefs: TileDef[], height: number) {
    this.tileWidth = tileWidth
    this.tileCount = tileCount
    this.totalWidth = tileWidth * tileCount
    this.container = new Container()
    this.tiles = []

    for (let i = 0; i < tileCount; i++) {
      const tileContainer = new Container()
      tileContainer.x = i * tileWidth

      const g = new Graphics()
      tileDefs[i % tileDefs.length].draw(g, tileWidth, height)
      tileContainer.addChild(g)

      this.container.addChild(tileContainer)
      this.tiles.push(tileContainer)
    }
  }

  update(containerX: number, screenWidth: number): void {
    for (const tile of this.tiles) {
      const screenX = containerX + tile.x

      if (screenX < -this.tileWidth - screenWidth) {
        tile.x += this.totalWidth
      } else if (screenX > screenWidth + this.tileWidth) {
        tile.x -= this.totalWidth
      }
    }
  }
}
