/**
 * Calculate weighted portfolio returns from individual stock returns and weights.
 * stocks: array of return arrays (each length should match)
 * weights: array of weights (0–1, should sum to 1)
 * Returns: weighted monthly return array
 */
export function calcPortfolioReturns(
  stocks: number[][],
  weights: number[]
): number[] {
  if (stocks.length === 0 || stocks.length !== weights.length) return []

  const length = Math.min(...stocks.map((s) => s.length))
  const result: number[] = []

  for (let i = 0; i < length; i++) {
    let weighted = 0
    for (let j = 0; j < stocks.length; j++) {
      weighted += stocks[j][i] * weights[j]
    }
    result.push(weighted)
  }

  return result
}
