/**
 * 分形維度 D（Fractal Dimension）
 *
 * 與 Hurst 指數的關係：D = 2 − H（1D 時間序列的 Hausdorff–Besicovitch dimension）
 *
 * 解讀：
 *   D 接近 1 → 序列「平滑」、有強趨勢
 *   D ≈ 1.5 → 序列「隨機」（H ≈ 0.5）
 *   D 接近 2 → 序列「鋸齒」、有強均值回歸傾向
 */

export type FractalRegime =
  | 'strong-trend'       // D < 1.4
  | 'mild-trend'         // 1.4 ≤ D < 1.48
  | 'random'             // 1.48 ≤ D ≤ 1.52
  | 'mild-mean-revert'   // 1.52 < D ≤ 1.6
  | 'strong-mean-revert' // D > 1.6

/** Hurst → Fractal Dimension：D = 2 − H */
export function hurstToFractalDimension(h: number): number {
  if (Number.isNaN(h)) return NaN
  return 2 - h
}

/** 將 D 值分到 5 級狀態；NaN 預設為 random */
export function classifyFractalDimension(d: number): FractalRegime {
  if (Number.isNaN(d)) return 'random'
  if (d < 1.4) return 'strong-trend'
  if (d < 1.48) return 'mild-trend'
  if (d <= 1.52) return 'random'
  if (d <= 1.6) return 'mild-mean-revert'
  return 'strong-mean-revert'
}

const REGIME_LABEL: Record<FractalRegime, string> = {
  'strong-trend':        '強趨勢延續',
  'mild-trend':          '偏趨勢',
  'random':              '接近隨機',
  'mild-mean-revert':    '偏均值回歸',
  'strong-mean-revert':  '強均值回歸',
}

export function fractalRegimeLabel(r: FractalRegime): string {
  return REGIME_LABEL[r]
}
