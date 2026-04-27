/**
 * Parse a text input (newline, comma, or tab separated) into an array of numbers.
 * Supports decimal (0.05), percentage (5%), and Tab-separated (from Excel) formats.
 * Invalid values and header rows are silently filtered out.
 */
export function parseReturns(text: string): number[] {
  // Split on newline, comma, or tab
  const raw = text
    .split(/[\n,\r\t]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')

  const result: number[] = []
  for (const s of raw) {
    const isPercent = s.includes('%')
    const cleaned = s.replace('%', '').trim()
    const n = parseFloat(cleaned)
    if (!isNaN(n)) {
      // Percentage string like "5%" → 0.05; otherwise assume already decimal
      result.push(isPercent ? n / 100 : n)
    }
    // Non-numeric tokens (headers, labels) are silently skipped
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
