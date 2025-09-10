import { PIXEL } from './constants'
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
}

export function moveAndCollide(p: Player, input: Record<string, boolean>) {
  const speed = 3
  const gravity = 0.6
  const maxFall = 12
  const jumpSpeed = 10

  let desiredVX = 0
  if (input['KeyA'] || input['ArrowLeft']) desiredVX -= speed
  if (input['KeyD'] || input['ArrowRight']) desiredVX += speed
  p.vx = desiredVX

  if ((input['Space'] || input['KeyW'] || input['ArrowUp']) && p.onGround) {
    p.vy = -jumpSpeed
    p.onGround = false
  }

  p.vy = Math.min(p.vy + gravity, maxFall)

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


