import { PIXEL, TILE_SIZE } from './constants'
import { tileAt } from './world'
import type { ImageMap, Player, Rect } from './types'
import { drawHotbar, InventorySlot } from './inventory'

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  camera: { x: number; y: number },
  images: ImageMap,
  player: Player,
  characterFrame: Rect | null,
  hover: { tileX: number | null; tileY: number | null },
  hotbar: InventorySlot[],
  selectedSlot: number,
) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#202830'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const startTileX = Math.floor(camera.x / PIXEL)
  const startTileY = Math.floor(camera.y / PIXEL)
  const tilesX = Math.ceil(canvas.width / PIXEL) + 1
  const tilesY = Math.ceil(canvas.height / PIXEL) + 1

  for (let ty = 0; ty < tilesY; ty += 1) {
    for (let tx = 0; tx < tilesX; tx += 1) {
      const worldTX = startTileX + tx
      const worldTY = startTileY + ty
      if (tileAt(worldTX, worldTY) === 1) {
        const dx = (worldTX * PIXEL) - camera.x
        const dy = (worldTY * PIXEL) - camera.y
        ctx.drawImage(images.dirt, 0, 0, TILE_SIZE, TILE_SIZE, Math.round(dx), Math.round(dy), PIXEL, PIXEL)
      }
    }
  }

  const px = Math.round(player.x - camera.x)
  const py = Math.round(player.y - camera.y)
  ctx.fillStyle = '#e74c3c'
  ctx.fillRect(px, py, PIXEL, PIXEL)
  if (characterFrame) {
    ctx.drawImage(
      images.character,
      characterFrame.sx,
      characterFrame.sy,
      characterFrame.sw,
      characterFrame.sh,
      px,
      py,
      PIXEL,
      PIXEL,
    )
  } else {
    ctx.drawImage(images.character, 0, 0, TILE_SIZE, TILE_SIZE, px, py, PIXEL, PIXEL)
  }

  drawHotbar(ctx, canvas, hotbar, selectedSlot, images)
}

export function drawTileHighlight(
  ctx: CanvasRenderingContext2D,
  camera: { x: number; y: number },
  hover: { tileX: number | null; tileY: number | null },
  color: string,
) {
  const tx = hover.tileX
  const ty = hover.tileY
  if (tx === null || ty === null) return
  const dx = Math.round(tx * PIXEL - camera.x)
  const dy = Math.round(ty * PIXEL - camera.y)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(dx + 1, dy + 1, PIXEL - 2, PIXEL - 2)
}


