import { PIXEL, WORLD_HEIGHT_TILES, WORLD_WIDTH_TILES } from './constants'
import type { Player } from './types'

export type Camera = { x: number; y: number }

export function createCamera(): Camera {
  return { x: 0, y: 0 }
}

export function updateCamera(cam: Camera, canvas: HTMLCanvasElement, player: Player) {
  cam.x = player.x + player.w / 2 - canvas.width / 2
  cam.y = player.y + player.h / 2 - canvas.height / 2
  const worldWidthPx = WORLD_WIDTH_TILES * PIXEL
  const worldHeightPx = WORLD_HEIGHT_TILES * PIXEL
  cam.x = Math.max(0, Math.min(cam.x, worldWidthPx - canvas.width))
  cam.y = Math.max(0, Math.min(cam.y, worldHeightPx - canvas.height))
}


