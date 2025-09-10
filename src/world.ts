import { WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES, PIXEL } from './constants'

export const world: number[][] = []

export function generateWorld(): void {
  const groundHeightTiles = 36
  for (let y = 0; y < WORLD_HEIGHT_TILES; y += 1) {
    const row: number[] = []
    for (let x = 0; x < WORLD_WIDTH_TILES; x += 1) {
      row.push(y >= groundHeightTiles ? 1 : 0)
    }
    world.push(row)
  }
}

export function tileAt(tileX: number, tileY: number): number {
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH_TILES || tileY >= WORLD_HEIGHT_TILES) return 1
  return world[tileY][tileX]
}

export function isSolidAtPixel(px: number, py: number): boolean {
  const tx = Math.floor(px / PIXEL)
  const ty = Math.floor(py / PIXEL)
  return tileAt(tx, ty) === 1
}


