import { useState } from 'react'
import ResultCard from '../ResultCard'
import QuadrantBadge from '../QuadrantBadge'
import type { MultiScaleEVResult, ScaleEV, EVDivergence } from '../../lib/ev'
import { fmtPct, colorByReturn } from '../../utils/format'

// ── Divergence banner ─────────────────────────────────────────────────────────

interface BannerStyle {
  text: string
  bg: string
  border: string
  textColor: string
}

function bannerStyle(d: EVDivergence): BannerStyle {
  switch (d) {
    case 'stable':
      return {
        text: '三尺度一致，狀態穩定',
        bg: 'bg-elevated',
        border: 'border-base',
        textColor: 'text-dim',
      }
    case 'short-deteriorating':
      return {
        text: '⚠ 短期動能轉弱：短期年化 EV 顯著低於長期',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'short-improving':
      return {
        // 紅漲：短期 EV 轉強用紅色語意（這裡的 banner 仍用綠提示「正向」訊號 → 為避免色彩混亂，沿用 amber 警示風格）
        text: '⚠ 短期動能轉強：短期年化 EV 顯著高於長期',
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

interface ScaleCardProps {
  label: string
  windowDesc: string
  result: ScaleEV | null
  showSampleWarning?: boolean
}

function ScaleCard({ label, windowDesc, result, showSampleWarning }: ScaleCardProps) {
  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-center">
          <p className="text-label text-faint uppercase tracking-wider">{label}</p>
          <p className="text-caption text-faint">{windowDesc}</p>
        </div>
        <div className="bg-elevated rounded-xl p-4 text-center">
          <p className="text-small text-faint">資料不足</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <div className="text-center">
        <p className="text-label text-faint uppercase tracking-wider">{label}</p>
        <p className="text-caption text-faint">{windowDesc}</p>
      </div>
      <ResultCard
        title="年化 EV"
        value={fmtPct(result.evAnnual)}
        color={colorByReturn(result.evAnnual)}
        emphasis="hero"
      />
      <p className="text-caption text-center text-dim">{result.ev.quadrant}</p>
      {showSampleWarning && (
        <p className="text-caption text-center text-faint">樣本較小，年化誤差較大</p>
      )}
    </div>
  )
}

// ── Calculation steps ─────────────────────────────────────────────────────────

function StepRow({ label, scale, periods }: { label: string; scale: ScaleEV | null; periods: number }) {
  if (!scale) {
    return (
      <p className="text-faint">
        {label}：資料不足，未計算
      </p>
    )
  }
  const { ev, evAnnual, windowSize, freq } = scale
  const freqLabel = freq === 'daily' ? '日' : '月'
  return (
    <p>
      {label}：{freqLabel} EV = <span className={ev.ev > 0 ? 'text-red-700' : ev.ev < 0 ? 'text-green-700' : 'text-main'}>
        {fmtPct(ev.ev, 4)}
      </span>
      {' → 年化 = (1 + EV)'}<sup>{periods}</sup>{' − 1 = '}
      <span className={evAnnual > 0 ? 'text-red-700 font-semibold' : evAnnual < 0 ? 'text-green-700 font-semibold' : 'text-main font-semibold'}>
        {fmtPct(evAnnual)}
      </span>
      <span className="text-faint">（窗口 {windowSize} 筆）</span>
    </p>
  )
}

// ── Main block ────────────────────────────────────────────────────────────────

interface Props {
  result: MultiScaleEVResult
  monthlyCount: number
  dailyCount: number
  /** 可選：覆寫預設標題（如組合頁傳入「組合期望報酬與賠率優勢」） */
  titleOverride?: string
  /** 可選：覆寫副標的「日報酬 N 筆」描述（組合頁可寫成「日報酬最少 N 筆」） */
  dailyCountLabelOverride?: string
}

export default function MultiScaleEVBlock({
  result,
  monthlyCount,
  dailyCount,
  titleOverride,
  dailyCountLabelOverride,
}: Props) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const banner = bannerStyle(result.divergence)
  const long = result.long
  const longEv = long.ev
  const longAnnualColor = colorByReturn(long.evAnnual)
  const hasOddsAdvantage = longEv.actualOdds > longEv.breakEvenOdds

  const title = titleOverride ?? '期望報酬與賠率優勢'
  const dailyLabel = dailyCountLabelOverride ?? `日報酬 ${dailyCount} 筆`

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">{title}</h2>
        <p className="text-caption text-faint mt-0.5">
          EV 期望值多尺度分析（短/中/長）· 使用月報酬 {monthlyCount} 筆 + {dailyLabel}
        </p>
      </div>

      {/* Divergence 判讀 sbadge — 緊湊 inline-flex + pulse dot */}
      <div>
        <div className="sbadge">
          <div className="sdot" />
          <span className="text-small font-medium">{banner.text}</span>
        </div>
      </div>

      {/* Hero 列：以「長期年化 EV」為主結論 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <ResultCard
          title="長期年化 EV"
          value={fmtPct(long.evAnnual)}
          color={longAnnualColor}
          emphasis="hero"
          subtitle={`單期月 EV ${fmtPct(longEv.ev, 4)}（年化複利推估）`}
        />
        <div className="space-y-2">
          <QuadrantBadge quadrant={longEv.quadrant} size="large" />
          <p className={`text-body font-semibold ${hasOddsAdvantage ? 'text-red-700' : 'text-green-700'}`}>
            賠率優勢：{hasOddsAdvantage ? '✓ 有優勢' : '✗ 無優勢'}
          </p>
        </div>
      </div>

      {/* 三卡片並列：短/中/長 年化 EV */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScaleCard
          label="短期"
          windowDesc="日頻最近 60 筆（≈3 個月）"
          result={result.short}
          showSampleWarning
        />
        <ScaleCard
          label="中期"
          windowDesc="月頻最近 36 筆（3 年）"
          result={result.medium}
        />
        <ScaleCard
          label="長期"
          windowDesc={`月頻全部（${result.long.windowSize} 筆）`}
          result={result.long}
        />
      </div>

      {/* 長期勝敗率 stats row — 用 .sdiv 直線分隔 */}
      <div className="border-t border-b border-base py-3 flex items-center flex-wrap gap-x-3.5 gap-y-1 text-small text-dim">
        <span className="text-label text-faint tracking-wide">長期勝敗率與平均盈虧（月頻）</span>
        <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
        <span>勝率 <span className="text-red-700 font-semibold num">{(longEv.winRate * 100).toFixed(2)}%</span></span>
        <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
        <span>敗率 <span className="text-green-700 font-semibold num">{(longEv.lossRate * 100).toFixed(2)}%</span></span>
        <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
        <span>Avg Gain <span className="text-red-700 font-semibold num">{fmtPct(longEv.avgGain)}</span></span>
        <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
        <span>Avg Loss <span className="text-green-700 font-semibold num">{fmtPct(-longEv.avgLoss)}</span></span>
      </div>

      {/* 摺疊：計算步驟 */}
      <div className="border-t border-base pt-3">
        <button
          type="button"
          onClick={() => setStepsOpen((v) => !v)}
          className="text-small text-dim hover:text-main transition-colors"
        >
          {stepsOpen ? '▼ 收折計算步驟' : '▶ 展開計算步驟'}
        </button>
        {stepsOpen && (
          <div className="mt-3 bg-elevated rounded-lg p-4 text-small num space-y-1.5 text-main">
            <p className="text-dim">三尺度年化 EV 計算過程：</p>
            <StepRow label="短期" scale={result.short} periods={252} />
            <StepRow label="中期" scale={result.medium} periods={12} />
            <StepRow label="長期" scale={result.long} periods={12} />
            <p className="text-dim pt-2 border-t border-base">
              年化複利公式：(1 + 單期 EV)<sup>每年期數</sup> − 1
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
