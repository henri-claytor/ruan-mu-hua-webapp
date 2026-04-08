import { average } from './utils'

export type Quadrant =
  | '高賠率正期望值（最佳）'
  | '低賠率正期望值（勝率驅動）'
  | '高賠率負期望值（賠率驅動但勝率不足）'
  | '低賠率負期望值（避免）'

export interface EVResult {
  winRate: number      // 0–1
  lossRate: number     // 0–1
  avgGain: number      // average of positive returns
  avgLoss: number      // average of absolute negative returns
  ev: number           // expected value
  actualOdds: number   // avgGain / avgLoss
  breakEvenOdds: number // lossRate / winRate
  quadrant: Quadrant
}

export function calcEV(returns: number[]): EVResult {
  const gains = returns.filter((r) => r > 0)
  const losses = returns.filter((r) => r < 0)
  const n = returns.length

  const winRate = gains.length / n
  const lossRate = losses.length / n
  const avgGain = gains.length > 0 ? average(gains) : 0
  const avgLoss = losses.length > 0 ? Math.abs(average(losses)) : 0

  const ev = winRate * avgGain - lossRate * avgLoss
  const actualOdds = avgLoss > 0 ? avgGain / avgLoss : 0
  const breakEvenOdds = winRate > 0 ? lossRate / winRate : 0

  let quadrant: Quadrant
  if (ev > 0 && actualOdds > breakEvenOdds) {
    quadrant = '高賠率正期望值（最佳）'
  } else if (ev > 0) {
    quadrant = '低賠率正期望值（勝率驅動）'
  } else if (actualOdds > breakEvenOdds) {
    quadrant = '高賠率負期望值（賠率驅動但勝率不足）'
  } else {
    quadrant = '低賠率負期望值（避免）'
  }

  return { winRate, lossRate, avgGain, avgLoss, ev, actualOdds, breakEvenOdds, quadrant }
}
