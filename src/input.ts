export function createInput(selectedSlotRef: { value: number }): Record<string, boolean> {
  const input: Record<string, boolean> = {}
  window.addEventListener('keydown', (e) => {
    input[e.code] = true
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
    if (e.code.startsWith('Digit')) {
      const n = Number(e.code.slice(5))
      if (n >= 1 && n <= 5) selectedSlotRef.value = n - 1
    }
  })
  window.addEventListener('keyup', (e) => {
    input[e.code] = false
  })
  return input
}


