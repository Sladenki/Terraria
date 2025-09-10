import { PIXEL, REACH_TILES, WORLD_HEIGHT_TILES, WORLD_WIDTH_TILES, TILE } from './constants'
import { tileAt, setTile } from './world'
import type { Player } from './types'
import { consumeFromSelected } from './inventory'
import type { InventorySlot } from './inventory'

export type HoverState = { x: number; y: number; tileX: number | null; tileY: number | null }

export function createHover(): HoverState {
  return { x: 0, y: 0, tileX: null, tileY: null }
}

export function bindMouse(
  canvas: HTMLCanvasElement,
  camera: { x: number; y: number },
  hover: HoverState,
  player: Player,
  hotbar: InventorySlot[],
  selectedRef: { value: number },
  emitDrop: (id: 'dirt' | 'wood' | 'leaves', worldX: number, worldY: number) => void,
) {
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    hover.x = mx
    hover.y = my
    const worldX = mx + camera.x
    const worldY = my + camera.y
    hover.tileX = Math.floor(worldX / PIXEL)
    hover.tileY = Math.floor(worldY / PIXEL)
  })

  canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  canvas.addEventListener('mousedown', (e) => {
    if (hover.tileX === null || hover.tileY === null) return
    const tx = hover.tileX
    const ty = hover.tileY
    if (!withinReach(player, tx, ty)) return

    if (e.button === 0) {
      const t = tileAt(tx, ty)
      if (t !== TILE.EMPTY) {
        const wx = tx * PIXEL + PIXEL / 2
        const wy = ty * PIXEL + PIXEL / 2
        if (t === TILE.DIRT) emitDrop('dirt', wx, wy)
        if (t === TILE.WOOD) emitDrop('wood', wx, wy)
        if (t === TILE.LEAVES) emitDrop('leaves', wx, wy)
        setTile(tx, ty, TILE.EMPTY)
      }
    } else if (e.button === 2) {
      if (canPlaceAt(player, tx, ty)) {
        // place item from selected slot priority: dirt -> wood -> leaves based on slot
        const id = hotbar[selectedRef.value].id
        if (id === 'dirt' && consumeFromSelected(hotbar, selectedRef.value, 'dirt', 1)) setTile(tx, ty, TILE.DIRT)
        else if (id === 'wood' && consumeFromSelected(hotbar, selectedRef.value, 'wood', 1)) setTile(tx, ty, TILE.WOOD)
        else if (id === 'leaves' && consumeFromSelected(hotbar, selectedRef.value, 'leaves', 1)) setTile(tx, ty, TILE.LEAVES)
      }
    }
  })

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    if (e.deltaY > 0) selectedRef.value = (selectedRef.value + 1) % hotbar.length
    else if (e.deltaY < 0) selectedRef.value = (selectedRef.value - 1 + hotbar.length) % hotbar.length
  }, { passive: false })
}

export function withinReach(player: Player, tileX: number, tileY: number): boolean {
  const pcx = player.x + player.w / 2
  const pcy = player.y + player.h / 2
  const tcx = tileX * PIXEL + PIXEL / 2
  const tcy = tileY * PIXEL + PIXEL / 2
  const dx = (tcx - pcx) / PIXEL
  const dy = (tcy - pcy) / PIXEL
  return Math.hypot(dx, dy) <= REACH_TILES
}

export function canPlaceAt(player: Player, tileX: number, tileY: number): boolean {
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH_TILES || tileY >= WORLD_HEIGHT_TILES) return false
  if (tileAt(tileX, tileY) !== 0) return false
  const tileLeft = tileX * PIXEL
  const tileTop = tileY * PIXEL
  const tileRight = tileLeft + PIXEL
  const tileBottom = tileTop + PIXEL
  const pLeft = player.x
  const pTop = player.y
  const pRight = player.x + player.w
  const pBottom = player.y + player.h
  const intersect = !(tileRight <= pLeft || tileLeft >= pRight || tileBottom <= pTop || tileTop >= pBottom)
  return !intersect
}


