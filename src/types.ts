export type ImageMap = Record<string, HTMLImageElement>

export type Rect = {
  sx: number
  sy: number
  sw: number
  sh: number
}

export type Player = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  onGround: boolean
  coyote: number
  jumpBuffer: number
}


