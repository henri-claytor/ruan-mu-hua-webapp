/**
 * Pearson 相關係數計算與解讀
 */

export function calcPearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length) {
    throw new Error('xs 與 ys 陣列長度必須一致')
  }
  const n = xs.length
  if (n < 2) return 0

  const sumX = xs.reduce((s, v) => s + v, 0)
  const sumY = ys.reduce((s, v) => s + v, 0)
  const meanX = sumX / n
  const meanY = sumY / n

  let cov = 0
  let varX = 0
  let varY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    cov += dx * dy
    varX += dx * dx
    varY += dy * dy
  }

  const denom = Math.sqrt(varX * varY)
  if (denom === 0 || !isFinite(denom)) return 0

  const r = cov / denom
  if (!isFinite(r)) return 0
  return Math.max(-1, Math.min(1, r))
}

export function interpretCorrelation(r: number): string {
  if (r >= 0.7) return '強正相關：持有越久報酬越高'
  if (r >= 0.3) return '中度正相關：持有時間略有助於報酬'
  if (r > -0.3) return '無顯著關聯：持有期間不影響報酬'
  if (r > -0.7) return '中度負相關：持有越久報酬略差'
  return '強負相關：持有越久報酬越差'
}
