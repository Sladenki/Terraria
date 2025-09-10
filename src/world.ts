import { WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES, PIXEL, GROUND_Y, TILE, type TileId } from './constants'

export const world: TileId[][] = []

export function generateWorld(): void {
  for (let y = 0; y < WORLD_HEIGHT_TILES; y += 1) {
    const row: TileId[] = []
    for (let x = 0; x < WORLD_WIDTH_TILES; x += 1) {
      row.push(y >= GROUND_Y ? TILE.DIRT : TILE.EMPTY)
    }
    world.push(row)
  }
  spawnTrees()
}

export function tileAt(tileX: number, tileY: number): TileId {
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH_TILES || tileY >= WORLD_HEIGHT_TILES) return TILE.DIRT
  return world[tileY][tileX]
}

export function isSolidAtPixel(px: number, py: number): boolean {
  const tx = Math.floor(px / PIXEL)
  const ty = Math.floor(py / PIXEL)
  const t = tileAt(tx, ty)
  return t === TILE.DIRT || t === TILE.WOOD
}

export function setTile(tileX: number, tileY: number, id: TileId) {
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH_TILES || tileY >= WORLD_HEIGHT_TILES) return
  world[tileY][tileX] = id
}

function spawnTrees() {
  // Try to place trees at semi-random intervals
  for (let x = 3; x < WORLD_WIDTH_TILES - 3; x += 1) {
    if (Math.random() < 0.06) {
      const groundY = findGroundY(x)
      if (groundY !== null) {
        placeTreeAt(x, groundY)
        // skip a few tiles to avoid crowding
        x += 3
      }
    }
  }
}

function findGroundY(x: number): number | null {
  // Return first dirt tile from top where above is empty
  for (let y = 1; y < WORLD_HEIGHT_TILES; y += 1) {
    if (world[y][x] === TILE.DIRT && world[y - 1][x] === TILE.EMPTY) {
      return y
    }
  }
  return null
}

function placeTreeAt(x: number, groundY: number) {
  const trunkHeight = 4 + Math.floor(Math.random() * 3) // 4..6
  let topY = groundY - trunkHeight
  if (topY < 1) topY = 1
  // trunk
  for (let y = groundY - 1; y >= topY; y -= 1) {
    if (world[y][x] === TILE.EMPTY) setTile(x, y, TILE.WOOD)
  }
  // canopy (diamond-ish)
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (ax + ay <= 3) {
        const tx = x + dx
        const ty = topY + dy
        if (tx >= 0 && tx < WORLD_WIDTH_TILES && ty >= 0 && ty < WORLD_HEIGHT_TILES) {
          if (world[ty][tx] === TILE.EMPTY) setTile(tx, ty, TILE.LEAVES)
        }
      }
    }
  }
}


