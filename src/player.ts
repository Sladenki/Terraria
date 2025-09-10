import { PHYS, PIXEL } from './constants'
import type { Player } from './types'
import { isSolidAtPixel } from './world'

export const player: Player = {
  x: 10 * PIXEL,
  y: 30 * PIXEL,
  vx: 0,
  vy: 0,
  w: PIXEL,
  h: PIXEL,
  onGround: false,
  coyote: 0,
  jumpBuffer: 0,
}

export function moveAndCollide(p: Player, input: Record<string, boolean>) {
  // horizontal acceleration/friction
  const wantLeft = input['KeyA'] || input['ArrowLeft']
  const wantRight = input['KeyD'] || input['ArrowRight']
  const onGround = p.onGround
  const accel = onGround ? PHYS.accelGround : PHYS.accelAir
  const maxSpeed = PHYS.maxRunSpeed
  if (wantLeft && !wantRight) p.vx = Math.max(p.vx - accel, -maxSpeed)
  else if (wantRight && !wantLeft) p.vx = Math.min(p.vx + accel, maxSpeed)
  else if (onGround) p.vx *= (1 - PHYS.frictionGround)

  // coyote time and jump buffer
  if (onGround) p.coyote = PHYS.coyoteFrames
  else p.coyote = Math.max(0, p.coyote - 1)
  if (pressedJump(input)) p.jumpBuffer = PHYS.jumpBufferFrames
  else p.jumpBuffer = Math.max(0, p.jumpBuffer - 1)

  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -PHYS.jumpSpeed
    p.onGround = false
    p.jumpBuffer = 0
  }

  // variable jump height: cut velocity when releasing jump
  if (releasedJump(input) && p.vy < 0) p.vy *= PHYS.jumpCutMultiplier

  // gravity
  p.vy = Math.min(p.vy + PHYS.gravity, PHYS.maxFallSpeed)

  p.x += p.vx
  if (collidesWithWorld(p)) {
    const sign = Math.sign(p.vx)
    while (collidesWithWorld(p)) p.x -= sign
    p.vx = 0
  }

  p.y += p.vy
  p.onGround = false
  if (collidesWithWorld(p)) {
    const sign = Math.sign(p.vy)
    while (collidesWithWorld(p)) p.y -= sign
    if (sign > 0) p.onGround = true
    p.vy = 0
  }
}

function collidesWithWorld(p: Player): boolean {
  const left = p.x
  const right = p.x + p.w - 1
  const top = p.y
  const bottom = p.y + p.h - 1
  return (
    isSolidAtPixel(left, top) ||
    isSolidAtPixel(right, top) ||
    isSolidAtPixel(left, bottom) ||
    isSolidAtPixel(right, bottom)
  )
}

function pressedJump(input: Record<string, boolean>): boolean {
  // We'll treat any of these keys as jump; actual edge detection is handled via buffering each frame from caller
  return !!(input['Space'] || input['KeyW'] || input['ArrowUp'])
}

function releasedJump(input: Record<string, boolean>): boolean {
  // In this simple scheme, we can't detect edges perfectly without storing previous input.
  // Approximate: if jump not currently held, consider it released.
  return !(input['Space'] || input['KeyW'] || input['ArrowUp'])
}


