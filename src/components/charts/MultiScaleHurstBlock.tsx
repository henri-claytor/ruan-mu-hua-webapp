import { useState } from 'react'
import ResultCard from '../ResultCard'
import HurstLineChart from './HurstLineChart'
import type { HurstResult, MultiScaleHurstResult, Divergence } from '../../lib/hurst'
import { METRIC_LABELS as L } from '../../lib/labels'
import { fmtRatio } from '../../utils/format'

// ── Divergence banner styling ─────────────────────────────────────────────────

interface BannerStyle {
  text: string
  bg: string
  border: string
  textColor: string
}

function bannerStyle(d: Divergence): BannerStyle {
  switch (d) {
    case 'stable':
      return {
        text: '三尺度一致，狀態穩定',
        bg: 'bg-elevated',
        border: 'border-base',
        textColor: 'text-dim',
      }
    case 'short-weakening':
      return {
        text: '⚠ 短期偏離長期：趨勢可能正在減弱',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'short-strengthening':
      return {
        text: '⚠ 短期偏離長期：動能轉強',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'mixed':
      return {
        text: '三尺度有差異，狀態觀察中',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        textColor: 'text-blue-700',
      }
  }
}

// ── Single scale card ─────────────────────────────────────────────────────────

function colorForH(h: number): 'green' | 'red' | 'blue' {
  if (h > 0.6) return 'green'
  if (h < 0.4) return 'red'
  return 'blue'
}

interface ScaleCardProps {
  label: string
  windowDesc: string
  result: HurstResult
  showSampleWarning?: boolean
}

function ScaleCard({ label, windowDesc, result, showSampleWarning }: ScaleCardProps) {
  // 底層值：R/S 迴歸點集 or 單點 fallback
  const baseValue = result.points.length >= 2
    ? `R/S 迴歸斜率（${result.points.length} 點）`
    : `R/S 單點公式（n=${result.n}）`

  return (
    <div className="space-y-2">
      <div className="text-center">
        <p className="text-[18px] font-bold text-main">{label}</p>
        <p className="text-[11px] text-dim">{windowDesc}</p>
      </div>
      <ResultCard
        title={L.hurstH}
        value={fmtRatio(result.h)}
        color={colorForH(result.h)}
        emphasis="hero"
      />
      <p className="text-[11px] text-center text-dim">{baseValue}</p>
      <p className="text-[11px] text-center text-dim">{result.interpretation}</p>
      {showSampleWarning && (
        <p className="text-[10.5px] text-center text-faint">樣本較小，誤差較大</p>
      )}
    </div>
  )
}

// ── Main block ────────────────────────────────────────────────────────────────

interface Props {
  result: MultiScaleHurstResult
  /** 可選：覆寫預設標題（如組合頁傳入「組合趨勢延續性偵測」） */
  titleOverride?: string
}

export default function MultiScaleHurstBlock({ result, titleOverride }: Props) {
  const [open, setOpen] = useState(true)
  const banner = bannerStyle(result.divergence)
  const long = result.long

  const title = titleOverride ?? '趨勢延續性偵測'

  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h2 className="font-serif text-h2 font-bold text-main tracking-wide text-left">{title}</h2>
          <p className="text-caption text-faint text-left mt-0.5">
            Hurst 指數，60/120/240 日多尺度 · 使用日報酬 240 筆
          </p>
        </div>
        <span className="text-faint text-small">{open ? '▼ 收折' : '▶ 展開'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          {/* Divergence 判讀橫幅 */}
          <div className={`${banner.bg} border ${banner.border} rounded-xl px-4 py-3`}>
            <p className={`text-body font-semibold ${banner.textColor}`}>{banner.text}</p>
          </div>

          {/* 三卡片並列 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScaleCard
              label="短期"
              windowDesc="最近 60 個交易日（約 3 個月）"
              result={result.short}
              showSampleWarning
            />
            <ScaleCard
              label="中期"
              windowDesc="最近 120 個交易日（約 6 個月）"
              result={result.medium}
            />
            <ScaleCard
              label="長期"
              windowDesc="最近 240 個交易日（約 1 年）"
              result={result.long}
            />
          </div>

          {/* 累積偏差圖：只用長期窗口 */}
          <div className="border-t border-base pt-4">
            <HurstLineChart cumDeviations={long.cumDeviations} subtitle="長期窗口（240日）" />
          </div>

          {/* 計算步驟（僅長期） */}
          <div className="border-t border-base pt-4">
            <h3 className="text-label font-semibold text-dim uppercase tracking-wider mb-3">
              計算步驟（長期窗口 240 日，多窗口 R/S 迴歸法）
            </h3>
            <div className="bg-elevated rounded-lg p-4 text-small num space-y-2 text-main">
              {long.points.length >= 2 ? (
                <>
                  <p className="text-dim">對每個子窗口尺寸 n，將序列切成不重疊子窗口計算 R/S：</p>
                  <table className="w-full text-small">
                    <thead className="text-dim text-caption">
                      <tr>
                        <th className="text-left py-1">子窗口尺寸 n</th>
                        <th className="text-left py-1">子窗口數</th>
                        <th className="text-left py-1">平均 R/S</th>
                      </tr>
                    </thead>
                    <tbody>
                      {long.points.map((p) => (
                        <tr key={p.n} className="border-t border-base">
                          <td className="py-1">n = {p.n}</td>
                          <td className="py-1">{p.subWindowCount}</td>
                          <td className="py-1">{p.rs.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-dim pt-2">
                    對 (log n, log corrected R/S) 點集做線性迴歸（含 Anis-Lloyd 小樣本偏差修正）：
                  </p>
                  <p>log(R/S) ≈ H × log(n) + c</p>
                  <p className="font-bold text-blue-700">H = 迴歸斜率 = {long.h.toFixed(4)}</p>
                </>
              ) : (
                <>
                  <p className="text-dim">樣本較小，使用單點公式：</p>
                  <p>μ = {long.mu.toFixed(6)}</p>
                  <p>Xₜ = Σ(rᵢ − μ)，共 {long.n} 筆</p>
                  <p>R = MAX(Xₜ) − MIN(Xₜ) = {long.r.toFixed(6)}</p>
                  <p>S = 標準差 = {long.s.toFixed(6)}</p>
                  <p>H = log(R/S) / log(n)</p>
                  <p className="font-bold text-blue-700">H = {long.h.toFixed(4)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
