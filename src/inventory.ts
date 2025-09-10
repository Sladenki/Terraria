import { PIXEL, TILE_SIZE } from './constants'
import type { ImageMap } from './types'

export type ItemId = 'dirt' | 'wood' | 'leaves'
export type InventorySlot = { id: ItemId | null; count: number }

export function createHotbar(): InventorySlot[] {
  return [
    { id: 'dirt', count: 50 },
    { id: null, count: 0 },
    { id: null, count: 0 },
    { id: null, count: 0 },
    { id: null, count: 0 },
  ]
}

export function addToInventory(hotbar: InventorySlot[], id: ItemId, amount: number) {
  for (const slot of hotbar) {
    if (slot.id === id) {
      slot.count += amount
      return
    }
  }
  for (const slot of hotbar) {
    if (!slot.id) {
      slot.id = id
      slot.count = amount
      return
    }
  }
}

export function consumeFromSelected(hotbar: InventorySlot[], selected: number, id: ItemId, amount: number): boolean {
  const slot = hotbar[selected]
  if (slot.id !== id || slot.count < amount) return false
  slot.count -= amount
  if (slot.count === 0) slot.id = null
  return true
}

export function drawHotbar(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, hotbar: InventorySlot[], selected: number, images: ImageMap) {
  const boxSize = PIXEL * 2
  const spacing = PIXEL
  const totalWidth = hotbar.length * boxSize + (hotbar.length - 1) * spacing
  const startX = Math.round((canvas.width - totalWidth) / 2)
  const y = canvas.height - boxSize - spacing
  for (let i = 0; i < hotbar.length; i += 1) {
    const x = startX + i * (boxSize + spacing)
    ctx.fillStyle = i === selected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)'
    ctx.fillRect(x, y, boxSize, boxSize)
    ctx.strokeStyle = i === selected ? '#ffffff' : 'rgba(255,255,255,0.4)'
    ctx.lineWidth = i === selected ? 3 : 2
    ctx.strokeRect(x + 1, y + 1, boxSize - 2, boxSize - 2)
    const slot = hotbar[i]
    if (slot.id && slot.count > 0) {
      const pad = 6
      const img = slot.id === 'dirt' ? images.dirt : slot.id === 'wood' ? (images as any).wood ?? images.forest : (images as any).leaves ?? images.forest
      ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE, x + pad, y + pad, boxSize - pad * 2, boxSize - pad * 2)
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.floor(boxSize / 3)}px monospace`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(String(slot.count), x + boxSize - 6, y + boxSize - 6)
    }
  }
}


