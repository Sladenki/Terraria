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
  const found: Rect[] = []
  for (let ty = 0; ty < rows; ty += 1) {
    for (let tx = 0; tx < cols; tx += 1) {
      const sx = tx * tilePx
      const sy = ty * tilePx
      const data = octx.getImageData(sx, sy, tilePx, tilePx).data
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 32) {
          found.push({ sx, sy, sw: tilePx, sh: tilePx })
          break
        }
      }
      if (found.length >= 2) break
    }
    if (found.length >= 2) break
  }
  return { wood: found[0] ?? null, leaves: found[1] ?? null }
}


