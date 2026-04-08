export interface VaRResult {
  var95: number   // 5th percentile (6th smallest of 120)
  var99: number   // 1st percentile (2nd smallest of 120)
  sorted: number[] // ascending sorted returns
}

export function calcVaR(returns: number[]): VaRResult {
  const sorted = [...returns].sort((a, b) => a - b)
  const n = sorted.length

  // VaR 95%: 5% worst → index = floor(n * 0.05)
  // For n=120: index 6 (0-based) = 7th smallest
  const idx95 = Math.max(0, Math.floor(n * 0.05) - 1)
  // VaR 99%: 1% worst → index 1 (0-based) = 2nd smallest
  const idx99 = Math.max(0, Math.floor(n * 0.01) - 1)

  return {
    var95: sorted[idx95],
    var99: sorted[idx99],
    sorted,
  }
}
