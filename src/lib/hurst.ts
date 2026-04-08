import { average, stdev } from './utils'

export type HurstInterpretation =
  | '趨勢延續型（Persistent）'
  | '隨機遊走型（Random Walk）'
  | '均值回歸型（Anti-persistent）'

export interface HurstResult {
  h: number
  r: number
  s: number
  n: number
  mu: number
  cumDeviations: number[]   // Xt = Σ(ri − μ) for each month
  interpretation: HurstInterpretation
}

export function calcHurst(returns: number[]): HurstResult | null {
  const values = returns.filter((v) => !isNaN(v))
  const n = values.length
  if (n < 10) return null

  const mu = average(values)
  const s = stdev(values)

  // Cumulative deviations: Xt = Σ(ri − μ)
  const cumDeviations: number[] = []
  let cumSum = 0
  for (const r of values) {
    cumSum += r - mu
    cumDeviations.push(cumSum)
  }

  const maxX = Math.max(...cumDeviations)
  const minX = Math.min(...cumDeviations)
  const r = maxX - minX

  if (s === 0 || r === 0) return null

  const h = Math.log(r / s) / Math.log(n)

  let interpretation: HurstInterpretation
  if (h > 0.6) {
    interpretation = '趨勢延續型（Persistent）'
  } else if (h < 0.4) {
    interpretation = '均值回歸型（Anti-persistent）'
  } else {
    interpretation = '隨機遊走型（Random Walk）'
  }

  return { h, r, s, n, mu, cumDeviations, interpretation }
}
