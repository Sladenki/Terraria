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

// --- Physics tuning ---
export const PHYS = {
  gravity: 0.6,
  maxFallSpeed: 14,
  maxRunSpeed: 4.2,
  accelGround: 0.65,
  accelAir: 0.35,
  frictionGround: 0.65,
  jumpSpeed: 11,
  jumpCutMultiplier: 0.5, // when releasing jump early
  coyoteFrames: 6,
  jumpBufferFrames: 8,
} as const


