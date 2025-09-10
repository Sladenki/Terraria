import { PIXEL } from './constants'
import { isSolidAtPixel } from './world'
import type { ImageMap, Player } from './types'
import type { ItemId } from './inventory'

export type Drop = {
  id: ItemId
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  age: number
}

export function spawnDrop(drops: Drop[], id: ItemId, worldX: number, worldY: number) {
  const size = Math.max(PIXEL - 6, 8)
  drops.push({
    id,
    x: worldX - size / 2,
    y: worldY - size / 2,
    vx: (Math.random() - 0.5) * 3,
    vy: -Math.random() * 3,
    w: size,
    h: size,
    age: 0,
  })
}

export function updateDrops(drops: Drop[], player: Player) {
  const gravity = 0.6
  const maxFall = 10
  const friction = 0.8
  const pickupRadius = PIXEL * 0.9
  const magnetRadius = PIXEL * 6

  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const d = drops[i]
    d.age += 1

    // magnet towards player when within range
    const pcx = player.x + player.w / 2
    const pcy = player.y + player.h / 2
    const dcx = d.x + d.w / 2
    const dcy = d.y + d.h / 2
    const dx = pcx - dcx
    const dy = pcy - dcy
    const dist = Math.hypot(dx, dy)
    if (dist < magnetRadius && dist > 0.001) {
      const ax = (dx / dist) * 0.7
      const ay = (dy / dist) * 0.7
      d.vx += ax
      d.vy += ay
    }

    // gravity
    d.vy = Math.min(d.vy + gravity, maxFall)

    // move X with collision (avoid infinite loop when vx == 0)
    const prevX = d.x
    d.x += d.vx
    if (collidesDrop(d)) {
      const sign = Math.sign(d.vx)
      if (sign === 0) {
        d.x = prevX
      } else {
        let attempts = 0
        while (collidesDrop(d) && attempts++ < PIXEL) d.x -= sign
      }
      d.vx = 0
    } else {
      d.vx *= friction
    }

    // move Y with collision (avoid infinite loop when vy == 0)
    const prevY = d.y
    d.y += d.vy
    if (collidesDrop(d)) {
      const sign = Math.sign(d.vy)
      if (sign === 0) {
        d.y = prevY
      } else {
        let attempts = 0
        while (collidesDrop(d) && attempts++ < PIXEL) d.y -= sign
      }
      d.vy = 0
    }

    // pickup
    if (dist < pickupRadius) {
      // signal pickup by removing; inventory addition handled by caller
      // We'll let caller handle inventory inside onPickup callback; here we just mark removal via return true
    }
  }
}

export function tryPickupDrops(drops: Drop[], player: Player, onPickup: (id: ItemId, count: number) => void) {
  const pickupRadius = PIXEL
  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const d = drops[i]
    const pcx = player.x + player.w / 2
    const pcy = player.y + player.h / 2
    const dcx = d.x + d.w / 2
    const dcy = d.y + d.h / 2
    const dist = Math.hypot(pcx - dcx, pcy - dcy)
    if (dist <= pickupRadius) {
      onPickup(d.id, 1)
      drops.splice(i, 1)
    }
  }
}

function collidesDrop(d: Drop): boolean {
  const l = d.x
  const r = d.x + d.w - 1
  const t = d.y
  const b = d.y + d.h - 1
  return (
    isSolidAtPixel(l, t) ||
    isSolidAtPixel(r, t) ||
    isSolidAtPixel(l, b) ||
    isSolidAtPixel(r, b)
  )
}

export function drawDrops(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, images: ImageMap, drops: Drop[]) {
  for (const d of drops) {
    const dx = Math.round(d.x - camera.x)
    const dy = Math.round(d.y - camera.y)
    // choose icon
    const img = d.id === 'dirt' ? images.dirt : d.id === 'wood' ? (images as any).wood ?? images.forest : (images as any).leaves ?? images.forest
    ctx.drawImage(img, 0, 0, img.naturalWidth || PIXEL, img.naturalHeight || PIXEL, dx, dy, d.w, d.h)
  }
}


