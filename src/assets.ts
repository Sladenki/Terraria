import type { ImageMap, Rect } from './types'

export const assetsToLoad: Record<string, string> = {
  character: '/assets/character.png',
  dirt: '/assets/dirt.png',
  forest: '/assets/forest.png',
}

export function loadImages(paths: Record<string, string>): Promise<ImageMap> {
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

export function findFirstOpaqueTile(img: HTMLImageElement, tilePx: number): Rect | null {
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
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 32) {
          return { sx, sy, sw: tilePx, sh: tilePx }
        }
      }
    }
  }
  return null
}

// forest.png assumed to be a spritesheet with multiple 16x16 variants.
// We'll map: wood = first non-empty, leaves = second non-empty tile found.
export function extractForestVariants(img: HTMLImageElement, tilePx: number): { wood: Rect | null; leaves: Rect | null } {
  const off = document.createElement('canvas')
  off.width = img.naturalWidth
  off.height = img.naturalHeight
  const octx = off.getContext('2d')!
  octx.drawImage(img, 0, 0)
  const cols = Math.floor(img.naturalWidth / tilePx)
  const rows = Math.floor(img.naturalHeight / tilePx)

  type Score = { rect: Rect; greenScore: number; woodScore: number; coverage: number }
  const candidates: Score[] = []
  for (let ty = 0; ty < rows; ty += 1) {
    for (let tx = 0; tx < cols; tx += 1) {
      const sx = tx * tilePx
      const sy = ty * tilePx
      const data = octx.getImageData(sx, sy, tilePx, tilePx).data
      let rSum = 0, gSum = 0, bSum = 0, count = 0
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]
        if (a > 32) {
          rSum += data[i]
          gSum += data[i + 1]
          bSum += data[i + 2]
          count += 1
        }
      }
      if (count === 0) continue
      const r = rSum / count, g = gSum / count, b = bSum / count
      const coverage = count / (tilePx * tilePx)
      const greenScore = (g - Math.max(r, b)) * coverage
      const woodScore = (r + g - 2 * b) * coverage - Math.abs(r - g) * 0.25
      candidates.push({ rect: { sx, sy, sw: tilePx, sh: tilePx }, greenScore, woodScore, coverage })
    }
  }
  // filter out very sparse tiles (likely UI/icons)
  const filtered = candidates.filter(c => c.coverage > 0.15)
  const leavesCand = filtered.reduce((best, c) => (c.greenScore > (best?.greenScore ?? -1e9) ? c : best), null as Score | null)
  // avoid picking same tile for wood
  const woodFiltered = filtered.filter(c => !leavesCand || c.rect.sx !== leavesCand.rect.sx || c.rect.sy !== leavesCand.rect.sy)
  const woodCand = woodFiltered.reduce((best, c) => (c.woodScore > (best?.woodScore ?? -1e9) ? c : best), null as Score | null)
  return { wood: woodCand?.rect ?? null, leaves: leavesCand?.rect ?? null }
}


