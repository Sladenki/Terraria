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

let images: ImageMap

function drawTestScene() {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#202830'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // ground tiles
  const rows = 5
  for (let x = 0; x < canvas.width; x += PIXEL) {
    for (let r = 0; r < rows; r += 1) {
      ctx.drawImage(images.dirt, 0, 0, TILE_SIZE, TILE_SIZE, x, canvas.height - (r + 1) * PIXEL, PIXEL, PIXEL)
    }
  }

  // character from top-left of sprite sheet (0,0,16,16). We'll refine with frames later
  ctx.drawImage(images.character, 0, 0, TILE_SIZE, TILE_SIZE, 10 * PIXEL, canvas.height - (rows + 1) * PIXEL, PIXEL, PIXEL)
}

function loop() {
  drawTestScene()
  requestAnimationFrame(loop)
}

loadImages(assetsToLoad)
  .then((loaded) => {
    images = loaded
    loop()
  })
  .catch((err) => {
    console.error('Failed to load images', err)
  })
