import { average, stdev, randomNormal } from './utils'

export interface MonteCarloResult {
  mu: number
  sigma: number
  // Terminal values for 1yr (12mo), 3yr (36mo), 5yr (60mo)
  oneYear: { p5: number; p50: number; p95: number }
  threeYear: { p5: number; p50: number; p95: number }
  fiveYear: { p5: number; p50: number; p95: number }
  // All paths terminal values [paths] for each horizon
  allPaths: {
    oneYear: number[]
    threeYear: number[]
    fiveYear: number[]
  }
  // Monthly paths for fan chart: allPathsMonthly[path][month]
  allPathsMonthly: number[][]
}

function terminalValues(paths: number[][], horizon: number): number[] {
  return paths.map((path) => path[horizon])
}

function pct(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

export function runMonteCarlo(
  returns: number[],
  paths = 100,
  initialValue = 1_000_000
): MonteCarloResult {
  const mu = average(returns)
  const sigma = stdev(returns)
  const months = 60

  // Simulate paths: each path[month] = portfolio value at end of that month
  const allPathsMonthly: number[][] = []

  for (let p = 0; p < paths; p++) {
    const path: number[] = [initialValue]
    let value = initialValue
    for (let m = 0; m < months; m++) {
      const z = randomNormal()
      // Log-normal monthly return
      const r = Math.exp(mu - 0.5 * sigma * sigma + sigma * z)
      value = value * r
      path.push(value)
    }
    allPathsMonthly.push(path)
  }

  const tv1 = terminalValues(allPathsMonthly, 12)
  const tv3 = terminalValues(allPathsMonthly, 36)
  const tv5 = terminalValues(allPathsMonthly, 60)

  return {
    mu,
    sigma,
    oneYear: { p5: pct(tv1, 0.05), p50: pct(tv1, 0.5), p95: pct(tv1, 0.95) },
    threeYear: { p5: pct(tv3, 0.05), p50: pct(tv3, 0.5), p95: pct(tv3, 0.95) },
    fiveYear: { p5: pct(tv5, 0.05), p50: pct(tv5, 0.5), p95: pct(tv5, 0.95) },
    allPaths: { oneYear: tv1, threeYear: tv3, fiveYear: tv5 },
    allPathsMonthly,
  }
}
