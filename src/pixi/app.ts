import { Application } from 'pixi.js'

let appInstance: Application | null = null

export async function createApp(): Promise<Application> {
  if (appInstance) {
    return appInstance
  }

  const app = new Application()

  await app.init({
    resizeTo: window,
    background: '#050510',
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    hello: false,
  })

  app.canvas.style.position = 'absolute'
  app.canvas.style.top = '0'
  app.canvas.style.left = '0'
  app.canvas.style.display = 'block'

  appInstance = app
  return app
}

export function getApp(): Application | null {
  return appInstance
}

export function destroyApp(): void {
  if (appInstance) {
    appInstance.destroy(true, { children: true })
    appInstance = null
  }
}
