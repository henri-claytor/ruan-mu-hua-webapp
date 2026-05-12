/**
 * 個股 vs 組合對比邏輯
 *
 * 三個維度的對比：
 *   - EV：方向（同號 / 異號）
 *   - VaR：風險程度（高 / 低 / 接近）
 *   - Hurst：類別（趨勢 / 隨機 / 回歸）
 *
 * 整體結論：依各尺度 / 欄位的 ✓ vs ⚠ 比例。
 */

export type EVAlignment = 'aligned' | 'opposed' | 'na'
export type VaRComparison = 'higher-risk' | 'lower-risk' | 'similar' | 'na'
export type OverallVerdict = '一致' | '部分對立' | '全對立' | '資料不足'

// ── EV / Hurst 對比（同號 / 同類別）─────────────────────────────────────────────

/**
 * EV 方向對比：個股 EV 與組合 EV 是否同號（同方向貢獻）。
 * 0 視為正方向（避免邊界）。
 */
export function compareEV(
  stockEV: number | null | undefined,
  portfolioEV: number,
): EVAlignment {
  if (stockEV === null || stockEV === undefined) return 'na'
  const stockSign = stockEV >= 0
  const portfolioSign = portfolioEV >= 0
  return stockSign === portfolioSign ? 'aligned' : 'opposed'
}

// ── VaR 對比（風險程度）────────────────────────────────────────────────────────

const VAR_RISK_HIGH_RATIO = 1.1
const VAR_RISK_LOW_RATIO = 0.9

/**
 * VaR 風險程度對比：個股 |VaR| 相對組合的比值。
 * - > 1.1 → higher-risk（個股拉高組合風險）
 * - < 0.9 → lower-risk
 * - 0.9–1.1 → similar
 */
export function compareVaR(
  stockVaR: number | null | undefined,
  portfolioVaR: number,
): VaRComparison {
  if (stockVaR === null || stockVaR === undefined) return 'na'
  const stockMag = Math.abs(stockVaR)
  const portfolioMag = Math.abs(portfolioVaR)
  if (portfolioMag === 0) return 'similar'
  const ratio = stockMag / portfolioMag
  if (ratio > VAR_RISK_HIGH_RATIO) return 'higher-risk'
  if (ratio < VAR_RISK_LOW_RATIO) return 'lower-risk'
  return 'similar'
}

// ── Hurst 類別對比 ────────────────────────────────────────────────────────────

export type HurstCategory = 'trending' | 'random' | 'mean-reverting'

export function categorizeHurst(h: number): HurstCategory {
  if (h > 0.6) return 'trending'
  if (h < 0.4) return 'mean-reverting'
  return 'random'
}

export function compareHurstCategory(
  stockH: number | null | undefined,
  portfolioH: number,
): EVAlignment {
  if (stockH === null || stockH === undefined) return 'na'
  return categorizeHurst(stockH) === categorizeHurst(portfolioH) ? 'aligned' : 'opposed'
}

// ── 整體結論 ──────────────────────────────────────────────────────────────────

/**
 * 依 alignments 陣列的 ✓ vs ⚠ 數量產生整體結論。
 * - 全 ✓ → 一致
 * - 全 ⚠ → 全對立
 * - 混合 → 部分對立
 * - 全 na → 資料不足
 */
export function getOverallVerdict(alignments: EVAlignment[]): OverallVerdict {
  const evaluable = alignments.filter((a) => a !== 'na')
  if (evaluable.length === 0) return '資料不足'
  const alignedCount = evaluable.filter((a) => a === 'aligned').length
  if (alignedCount === evaluable.length) return '一致'
  if (alignedCount === 0) return '全對立'
  return '部分對立'
}

/**
 * VaR 整體結論：依 var95 與 var99 的對比結果。
 */
export type VaROverallVerdict = '拉高風險' | '降低風險' | '接近組合' | '混合' | '資料不足'

export function getVaROverallVerdict(
  var95: VaRComparison,
  var99: VaRComparison,
): VaROverallVerdict {
  if (var95 === 'na' && var99 === 'na') return '資料不足'
  // 取兩者中較具評估意義的（非 na）
  const both = [var95, var99].filter((v) => v !== 'na')
  if (both.every((v) => v === 'higher-risk')) return '拉高風險'
  if (both.every((v) => v === 'lower-risk')) return '降低風險'
  if (both.every((v) => v === 'similar')) return '接近組合'
  return '混合'
}
