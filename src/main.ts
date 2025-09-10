import { PIXEL, TILE_SIZE } from './constants'
import { assetsToLoad, findFirstOpaqueTile, loadImages, extractForestVariants } from './assets'
import { generateWorld } from './world'
import type { Rect, ImageMap } from './types'
import { player, moveAndCollide } from './player'
import { createCamera, updateCamera } from './camera'
import { createHotbar } from './inventory'
import { createInput } from './input'
import { bindMouse, canPlaceAt, createHover, withinReach } from './interactions'
import { drawWorld as renderWorld, drawTileHighlight } from './render'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

function resizeCanvas() {
  const w = Math.floor(window.innerWidth / PIXEL) * PIXEL
  const h = Math.floor(window.innerHeight / PIXEL) * PIXEL
  canvas.width = Math.max(w, PIXEL * 20)
  canvas.height = Math.max(h, PIXEL * 12)
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

let images: ImageMap
let characterFrame: Rect | null = null
const camera = createCamera()
const hotbar = createHotbar()
const selectedRef = { value: 0 }
const input = createInput(selectedRef)
const hover = createHover()

function loop() {
  moveAndCollide(player, input)
  updateCamera(camera, canvas, player)

  renderWorld(ctx, canvas, camera, images, player, characterFrame, hover, hotbar, selectedRef.value)

  const tx = hover.tileX
  const ty = hover.tileY
  if (tx !== null && ty !== null) {
    let color = '#f1c40f'
    if (withinReach(player, tx, ty)) {
      color = canPlaceAt(player, tx, ty) ? '#2ecc71' : '#e67e22'
    }
    drawTileHighlight(ctx, camera, hover, color)
  }

  requestAnimationFrame(loop)
}

generateWorld()
loadImages(assetsToLoad)
  .then((loaded) => {
    images = loaded
    characterFrame = findFirstOpaqueTile(images.character, TILE_SIZE)
    // extract two variants from forest.png and alias into images
    const variants = extractForestVariants(images.forest, TILE_SIZE)
    ;(images as any).wood = variants.wood ? cropImage(images.forest, variants.wood) : images.forest
    ;(images as any).leaves = variants.leaves ? cropImage(images.forest, variants.leaves) : images.forest
    bindMouse(canvas, camera, hover, player, hotbar, selectedRef)
    loop()
  })
  .catch((err) => {
    console.error('Failed to load images', err)
  })

// create a temporary cropped image from a spritesheet rect
function cropImage(sheet: HTMLImageElement, rect: Rect): HTMLImageElement {
  const off = document.createElement('canvas')
  off.width = rect.sw
  off.height = rect.sh
  const octx = off.getContext('2d')!
  octx.drawImage(sheet, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, rect.sw, rect.sh)
  const img = new Image()
  img.src = off.toDataURL()
  return img
}
