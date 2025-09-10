const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

const TILE_SIZE = 16
const SCALE = 2
const PIXEL = TILE_SIZE * SCALE

function resizeCanvas() {
  const w = Math.floor(window.innerWidth / PIXEL) * PIXEL
  const h = Math.floor(window.innerHeight / PIXEL) * PIXEL
  canvas.width = Math.max(w, PIXEL * 20)
  canvas.height = Math.max(h, PIXEL * 12)
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

type ImageMap = Record<string, HTMLImageElement>

function loadImages(paths: Record<string, string>): Promise<ImageMap> {
  const entries = Object.entries(paths)
  return Promise.all(
    entries.map(([key, src]) =>
      new Promise<[string, HTMLImageElement]>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve([key, img])
        img.onerror = (e) => reject(e)
        img.src = src
      }),
    ),
  ).then((pairs) => Object.fromEntries(pairs))
}

const assetsToLoad = {
  character: '/assets/character.png',
  dirt: '/assets/dirt.png',
  forest: '/assets/forest.png',
}

// --- World ---
const WORLD_WIDTH_TILES = 100
const WORLD_HEIGHT_TILES = 50
const world: number[][] = []
const REACH_TILES = 6

function generateWorld() {
  const groundHeightTiles = 36 // ground level from top (lower means nearer top)
  for (let y = 0; y < WORLD_HEIGHT_TILES; y += 1) {
    const row: number[] = []
    for (let x = 0; x < WORLD_WIDTH_TILES; x += 1) {
      // 0 = empty, 1 = dirt
      if (y >= groundHeightTiles) {
        row.push(1)
      } else {
        row.push(0)
      }
    }
    world.push(row)
  }
}

function tileAt(tileX: number, tileY: number): number {
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH_TILES || tileY >= WORLD_HEIGHT_TILES) return 1 // treat out-of-bounds as solid
  return world[tileY][tileX]
}

function isSolidAtPixel(px: number, py: number): boolean {
  const tx = Math.floor(px / PIXEL)
  const ty = Math.floor(py / PIXEL)
  return tileAt(tx, ty) === 1
}

// --- Player ---
type Player = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  onGround: boolean
}

const player: Player = {
  x: 10 * PIXEL,
  y: 30 * PIXEL,
  vx: 0,
  vy: 0,
  w: PIXEL,
  h: PIXEL,
  onGround: false,
}

// --- Inventory / Hotbar ---
type ItemId = 'dirt'
type InventorySlot = { id: ItemId | null; count: number }
const hotbar: InventorySlot[] = [
  { id: 'dirt', count: 50 },
  { id: null, count: 0 },
  { id: null, count: 0 },
  { id: null, count: 0 },
  { id: null, count: 0 },
]
let selectedSlot = 0

function addToInventory(id: ItemId, amount: number) {
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

function consumeFromSelected(id: ItemId, amount: number): boolean {
  const slot = hotbar[selectedSlot]
  if (slot.id !== id || slot.count < amount) return false
  slot.count -= amount
  if (slot.count === 0) slot.id = null
  return true
}

// --- Mouse hover state ---
type HoverState = { x: number; y: number; tileX: number | null; tileY: number | null }
const hover: HoverState = { x: 0, y: 0, tileX: null, tileY: null }

const input: Record<string, boolean> = {}
window.addEventListener('keydown', (e) => {
  input[e.code] = true
  // prevent page scroll on Space/Arrow keys
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
  // hotbar quick select: Digit1..Digit5
  if (e.code.startsWith('Digit')) {
    const n = Number(e.code.slice(5))
    if (n >= 1 && n <= 5) selectedSlot = n - 1
  }
})
window.addEventListener('keyup', (e) => {
  input[e.code] = false
})

function moveAndCollide(p: Player) {
  const speed = 3 // px per frame
  const gravity = 0.6
  const maxFall = 12
  const jumpSpeed = 10

  // horizontal input
  let desiredVX = 0
  if (input['KeyA'] || input['ArrowLeft']) desiredVX -= speed
  if (input['KeyD'] || input['ArrowRight']) desiredVX += speed
  p.vx = desiredVX

  // jump
  if ((input['Space'] || input['KeyW'] || input['ArrowUp']) && p.onGround) {
    p.vy = -jumpSpeed
    p.onGround = false
  }

  // apply gravity
  p.vy = Math.min(p.vy + gravity, maxFall)

  // --- move X and resolve collisions ---
  p.x += p.vx
  if (collidesWithWorld(p)) {
    // move back to tile boundary
    const sign = Math.sign(p.vx)
    while (collidesWithWorld(p)) p.x -= sign
    p.vx = 0
  }

  // --- move Y and resolve collisions ---
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
  // check four corners of AABB
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

// --- Camera ---
const camera = { x: 0, y: 0 }
function updateCamera() {
  camera.x = player.x + player.w / 2 - canvas.width / 2
  camera.y = player.y + player.h / 2 - canvas.height / 2
  const worldWidthPx = WORLD_WIDTH_TILES * PIXEL
  const worldHeightPx = WORLD_HEIGHT_TILES * PIXEL
  camera.x = Math.max(0, Math.min(camera.x, worldWidthPx - canvas.width))
  camera.y = Math.max(0, Math.min(camera.y, worldHeightPx - canvas.height))
}

// --- Rendering ---
let images: ImageMap
type Rect = { sx: number; sy: number; sw: number; sh: number }
let characterFrame: Rect | null = null

function findFirstOpaqueTile(img: HTMLImageElement, tilePx: number): Rect | null {
  const cols = Math.floor(img.naturalWidth / tilePx)
  const rows = Math.floor(img.naturalHeight / tilePx)
  if (cols <= 0 || rows <= 0) return null
  const off = document.createElement('canvas')
  off.width = img.naturalWidth
  off.height = img.naturalHeight
  const octx = off.getContext('2d')!
  octx.drawImage(img, 0, 0)
  for (let ty = 0; ty < rows; ty += 1) {
    for (let tx = 0; tx < cols; tx += 1) {
      const sx = tx * tilePx
      const sy = ty * tilePx
      const data = octx.getImageData(sx, sy, tilePx, tilePx).data
      // check if there is any visible pixel (alpha > 32)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 32) {
          return { sx, sy, sw: tilePx, sh: tilePx }
        }
      }
    }
  }
  return null
}

function drawWorld() {
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

  // draw player (placeholder rect + detected frame from sprite sheet)
  const px = Math.round(player.x - camera.x)
  const py = Math.round(player.y - camera.y)
  // debug placeholder to ensure visibility
  ctx.fillStyle = '#e74c3c'
  ctx.fillRect(px, py, PIXEL, PIXEL)
  // draw sprite if frame detected, otherwise fallback to top-left
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

  // highlight targeted tile if within reach
  const hx = hover.tileX
  const hy = hover.tileY
  if (hx !== null && hy !== null) {
    if (withinReach(hx, hy)) {
      const dx = Math.round(hx * PIXEL - camera.x)
      const dy = Math.round(hy * PIXEL - camera.y)
      ctx.strokeStyle = canPlaceAt(hx, hy) ? '#2ecc71' : (tileAt(hx, hy) === 1 ? '#e67e22' : '#f1c40f')
      ctx.lineWidth = 2
      ctx.strokeRect(dx + 1, dy + 1, PIXEL - 2, PIXEL - 2)
    }
  }

  drawHotbar()
}

function loop() {
  moveAndCollide(player)
  updateCamera()
  drawWorld()
  requestAnimationFrame(loop)
}

generateWorld()
loadImages(assetsToLoad)
  .then((loaded) => {
    images = loaded
    characterFrame = findFirstOpaqueTile(images.character, TILE_SIZE)
    loop()
  })
  .catch((err) => {
    console.error('Failed to load images', err)
  })

// --- Mouse + interaction ---
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
  if (!withinReach(tx, ty)) return

  if (e.button === 0) {
    // break
    if (tileAt(tx, ty) === 1) {
      world[ty][tx] = 0
      addToInventory('dirt', 1)
    }
  } else if (e.button === 2) {
    // place
    if (canPlaceAt(tx, ty)) {
      if (consumeFromSelected('dirt', 1)) {
        world[ty][tx] = 1
      }
    }
  }
})

canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  if (e.deltaY > 0) selectedSlot = (selectedSlot + 1) % hotbar.length
  else if (e.deltaY < 0) selectedSlot = (selectedSlot - 1 + hotbar.length) % hotbar.length
}, { passive: false })

function withinReach(tileX: number, tileY: number): boolean {
  const pcx = player.x + player.w / 2
  const pcy = player.y + player.h / 2
  const tcx = tileX * PIXEL + PIXEL / 2
  const tcy = tileY * PIXEL + PIXEL / 2
  const dx = (tcx - pcx) / PIXEL
  const dy = (tcy - pcy) / PIXEL
  return Math.hypot(dx, dy) <= REACH_TILES
}

function canPlaceAt(tileX: number, tileY: number): boolean {
  if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH_TILES || tileY >= WORLD_HEIGHT_TILES) return false
  if (tileAt(tileX, tileY) !== 0) return false
  // avoid placing inside player
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

function drawHotbar() {
  const boxSize = PIXEL * 2
  const spacing = PIXEL
  const totalWidth = hotbar.length * boxSize + (hotbar.length - 1) * spacing
  const startX = Math.round((canvas.width - totalWidth) / 2)
  const y = canvas.height - boxSize - spacing
  for (let i = 0; i < hotbar.length; i += 1) {
    const x = startX + i * (boxSize + spacing)
    ctx.fillStyle = i === selectedSlot ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)'
    ctx.fillRect(x, y, boxSize, boxSize)
    ctx.strokeStyle = i === selectedSlot ? '#ffffff' : 'rgba(255,255,255,0.4)'
    ctx.lineWidth = i === selectedSlot ? 3 : 2
    ctx.strokeRect(x + 1, y + 1, boxSize - 2, boxSize - 2)
    const slot = hotbar[i]
    if (slot.id === 'dirt' && slot.count > 0) {
      const pad = 6
      ctx.drawImage(images.dirt, 0, 0, TILE_SIZE, TILE_SIZE, x + pad, y + pad, boxSize - pad * 2, boxSize - pad * 2)
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.floor(boxSize / 3)}px monospace`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(String(slot.count), x + boxSize - 6, y + boxSize - 6)
    }
  }
}
