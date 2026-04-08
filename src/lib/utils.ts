/**
 * Parse a text input (newline or comma separated) into an array of numbers.
 * Supports both decimal (0.05) and percentage (5%) formats.
 */
export function parseReturns(text: string): number[] {
  const raw = text
    .split(/[\n,\r]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')

  const result: number[] = []
  for (const s of raw) {
    // Handle percentage sign
    const cleaned = s.replace('%', '').trim()
    const n = parseFloat(cleaned)
    if (!isNaN(n)) {
      // If original value was a percentage string like "5%", keep as 0.05
      // If original had %, divide by 100; otherwise assume already decimal
      const val = s.includes('%') ? n / 100 : n
      result.push(val)
    }
  }
  return result
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function stdev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = average(arr)
  const variance = arr.reduce((a, x) => a + Math.pow(x - mean, 2), 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

export function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

/**
 * Generate a standard normal random variable using Box-Muller transform.
 */
export function randomNormal(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}
