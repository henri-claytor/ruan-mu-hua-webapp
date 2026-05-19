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
        text: '近 3 個月與近 1 年趨勢一致',
        bg: 'bg-elevated',
        border: 'border-base',
        textColor: 'text-dim',
      }
    case 'short-deteriorating':
      return {
        text: '⚠ 短期動能轉弱：近 3 個月年化 EV 顯著低於近 1 年',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'short-improving':
      return {
        text: '⚠ 短期動能轉強：近 3 個月年化 EV 顯著高於近 1 年',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'mixed':
      return {
        text: '近 3 個月與近 1 年趨勢有差異',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        textColor: 'text-blue-700',
      }
  }
}

// ── Single scale card ─────────────────────────────────────────────────────────

interface ScaleCardProps {
  result: ScaleEV | null
  /** 後備：result === null 時顯示的標題 */
  fallbackLabel: string
  /** 後備 window 描述 */
  fallbackWindowDesc: string
  /** 視覺權重：'primary' 主要判斷 / 'reference' 參考用（弱化樣式） */
  tier: 'primary' | 'reference'
  /** 短期可加「樣本較小」警語 */
  showSampleWarning?: boolean
}

function ScaleCard({ result, fallbackLabel, fallbackWindowDesc, tier, showSampleWarning }: ScaleCardProps) {
  const isReference = tier === 'reference'
  // primary 用 bg-card2（cream），reference 用 bg-elevated（弱化）
  const cardCls = isReference
    ? 'bg-elevated border border-[rgba(154,122,46,0.12)] rounded-lg px-[18px] py-4 opacity-90'
    : 'bg-card2 border border-base rounded-lg px-[18px] py-4 hover:border-[rgba(154,122,46,0.28)] transition-colors'
  const numSize = isReference ? 'text-[20px]' : 'text-[24px]'
  const numToneClass = (n: number) => (n > 0 ? 'text-red-700' : n < 0 ? 'text-green-700' : 'text-main')

  const label = result?.label ?? fallbackLabel
  const windowDesc =
    result === null
      ? fallbackWindowDesc
      : result.freq === 'daily'
        ? `日報酬最近 ${result.windowSize} 筆`
        : `月報酬最近 ${result.windowSize} 筆`

  if (!result) {
    return (
      <div className={cardCls}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-[10.5px] text-dim tracking-[1.5px]">{label}</p>
          {isReference && <span className="text-[10px] text-gold-dark px-1.5 py-0.5 rounded-full bg-[rgba(154,122,46,0.1)]">參考用</span>}
        </div>
        <p className="text-[10.5px] text-[#9a8a70] mb-3">{windowDesc}</p>
        <p className="text-small text-faint">資料不足</p>
      </div>
    )
  }
  return (
    <div className={cardCls}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className={`text-[10.5px] tracking-[1.5px] ${isReference ? 'text-dim' : 'text-dim'}`}>{label}</p>
        {isReference && (
          <span className="text-[10px] text-gold-dark px-1.5 py-0.5 rounded-full bg-[rgba(154,122,46,0.1)]">
            參考用
          </span>
        )}
      </div>
      <p className="text-[10.5px] text-[#9a8a70] mb-3">{windowDesc}</p>
      <p className="text-[10.5px] text-dim tracking-[1px] mb-1">年化 EV</p>
      <p className={`font-serif ${numSize} font-bold leading-none num ${numToneClass(result.evAnnual)} ${isReference ? 'opacity-90' : ''}`}>
        {fmtPct(result.evAnnual)}
      </p>
      <p className={`text-[10.5px] mt-2 leading-[1.5] ${isReference ? 'text-faint' : 'text-dim'}`}>
        {result.ev.quadrant}
      </p>
      {showSampleWarning && (
        <p className="text-[10.5px] text-faint leading-[1.5]">樣本較小，年化誤差較大</p>
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

  // 主結論：優先用 medium（最近 1 年），其次 short，最後 long
  const primary = result.medium ?? result.short ?? result.long
  const primaryEv = primary?.ev
  const primaryAnnualColor = primary ? colorByReturn(primary.evAnnual) : 'default'
  const primaryLabel = primary?.label ?? '年化 EV'
  const hasOddsAdvantage = primaryEv ? primaryEv.actualOdds > primaryEv.breakEvenOdds : false

  const title = titleOverride ?? '期望報酬與賠率優勢'
  const dailyLabel = dailyCountLabelOverride ?? `日報酬 ${dailyCount} 筆`

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">{title}</h2>
        <p className="text-caption text-faint mt-0.5">
          多尺度年化 EV（最近 3 個月 · 最近 1 年 · 最近 5 年參考）· 月報酬 {monthlyCount} 筆 + {dailyLabel}
        </p>
      </div>

      {/* Divergence 判讀 sbadge — 緊湊 inline-flex + pulse dot */}
      <div>
        <div className="sbadge">
          <div className="sdot" />
          <span className="text-small font-medium">{banner.text}</span>
        </div>
      </div>

      {/* Hero 列：以「最近 1 年年化 EV」為主結論 */}
      {primary && primaryEv && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
          <ResultCard
            title={`${primaryLabel}・年化 EV`}
            value={fmtPct(primary.evAnnual)}
            color={primaryAnnualColor}
            emphasis="hero"
            subtitle={`${primary.freq === 'daily' ? '日' : '月'} EV ${fmtPct(primaryEv.ev, 4)}（年化複利推估）`}
          />
          <div className="space-y-2">
            <QuadrantBadge quadrant={primaryEv.quadrant} size="large" />
            <p className={`text-body font-semibold ${hasOddsAdvantage ? 'text-red-700' : 'text-green-700'}`}>
              賠率優勢：{hasOddsAdvantage ? '✓ 有優勢' : '✗ 無優勢'}
            </p>
          </div>
        </div>
      )}

      {/* 主要判斷：前 2 卡並排 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScaleCard
          result={result.short}
          fallbackLabel="最近 3 個月"
          fallbackWindowDesc="需 ≥ 60 筆日報酬"
          tier="primary"
          showSampleWarning
        />
        <ScaleCard
          result={result.medium}
          fallbackLabel="最近 1 年"
          fallbackWindowDesc="需 ≥ 240 筆日報酬"
          tier="primary"
        />
      </div>

      {/* 參考用：第 3 卡單獨整行 */}
      <ScaleCard
        result={result.long}
        fallbackLabel="最近 5 年"
        fallbackWindowDesc="需 ≥ 60 筆月報酬"
        tier="reference"
      />

      {/* 主要尺度勝敗率 stats row — 用 .sdiv 直線分隔 */}
      {primaryEv && (
        <div className="border-t border-b border-base py-3 flex items-center flex-wrap gap-x-3.5 gap-y-1 text-small text-dim">
          <span className="text-label text-faint tracking-wide">{primaryLabel}勝敗率與平均盈虧</span>
          <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
          <span>勝率 <span className="text-red-700 font-semibold num">{(primaryEv.winRate * 100).toFixed(2)}%</span></span>
          <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
          <span>敗率 <span className="text-green-700 font-semibold num">{(primaryEv.lossRate * 100).toFixed(2)}%</span></span>
          <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
          <span>Avg Gain <span className="text-red-700 font-semibold num">{fmtPct(primaryEv.avgGain)}</span></span>
          <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
          <span>Avg Loss <span className="text-green-700 font-semibold num">{fmtPct(-primaryEv.avgLoss)}</span></span>
        </div>
      )}

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
            <StepRow label="最近 3 個月" scale={result.short} periods={252} />
            <StepRow label="最近 1 年" scale={result.medium} periods={252} />
            <StepRow label="最近 5 年" scale={result.long} periods={12} />
            <p className="text-dim pt-2 border-t border-base">
              年化複利公式：(1 + 單期 EV)<sup>每年期數</sup> − 1
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
