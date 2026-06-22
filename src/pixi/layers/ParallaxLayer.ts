import { Container } from 'pixi.js'

export class ParallaxLayer {
  container: Container
  scrollSpeed: number
  entities: Container[] = []

  constructor(scrollSpeed: number) {
    this.container = new Container()
    this.scrollSpeed = scrollSpeed
    this.container.sortableChildren = true
  }

  addChild(child: Container): void {
    this.container.addChild(child)
    this.entities.push(child)
  }

  applyScroll(sceneX: number): void {
    this.container.x = sceneX * this.scrollSpeed
  }
}
