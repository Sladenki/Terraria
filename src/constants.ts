export const TILE_SIZE = 16
export const SCALE = 2
export const PIXEL = TILE_SIZE * SCALE

export const WORLD_WIDTH_TILES = 100
export const WORLD_HEIGHT_TILES = 50
export const GROUND_Y = 36

export const REACH_TILES = 6

export const TILE = {
  EMPTY: 0,
  DIRT: 1,
  WOOD: 2,
  LEAVES: 3,
} as const
export type TileId = typeof TILE[keyof typeof TILE]


