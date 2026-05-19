import { useState } from 'react'
import type { MultiScaleEVResult, ScaleEV, EVDivergence } from '../../lib/ev'
import { fmtPct, fmtWinRate } from '../../utils/format'
import { METRIC_LABELS as L } from '../../lib/labels'

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
  /** 視覺權重：'primary'（一般主要）/ 'primary-main'（主判斷強調）/ 'reference'（長期參考橫向卡，由父層另渲染）*/
  tier: 'primary' | 'primary-main'
  /** 是否在右上角顯示「主判斷」chip + 🏆 */
  isPrimaryMain?: boolean
  /** 短期可加「樣本較小」警語 */
  showSampleWarning?: boolean
}

function ScaleCard({ result, fallbackLabel, fallbackWindowDesc, tier, isPrimaryMain, showSampleWarning }: ScaleCardProps) {
  const isMain = tier === 'primary-main' || isPrimaryMain
  const cardCls = isMain
    ? 'relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-[18px] py-4 transition-colors'
    : 'relative bg-card2 border border-base rounded-lg px-[18px] py-4 hover:border-[rgba(154,122,46,0.28)] transition-colors'
  const numSize = isMain ? 'text-[40px]' : 'text-[36px]'
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
        <p className="text-[18px] font-bold text-main">{label}</p>
        <p className="text-[11px] text-dim mb-3">{windowDesc}</p>
        <p className="text-small text-faint">資料不足</p>
      </div>
    )
  }

  // 底層值：日/月平均報酬率（單期 EV）
  const baseLabel = result.freq === 'daily' ? L.evDaily : L.evMonthly
  const baseValue = fmtPct(result.ev.ev, 2)

  return (
    <div className={cardCls}>
      {isMain && (
        <div className="absolute top-2.5 right-3.5 flex items-center gap-1.5">
          <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">主判斷</span>
          <span className="text-[18px]" aria-hidden>🏆</span>
        </div>
      )}
      <p className="text-[18px] font-bold text-main">{label}</p>
      <p className="text-[11px] text-dim mb-3">{windowDesc}</p>

      <p className="text-[13px] text-dim mb-1">{L.evAnnual}</p>
      <p className={`font-serif ${numSize} font-bold leading-none num ${numToneClass(result.evAnnual)}`}>
        {fmtPct(result.evAnnual)}
      </p>

      <p className="text-[11px] text-dim mt-2">
        {baseLabel} <span className="num font-semibold">{baseValue}</span>
      </p>

      <p className={`text-[11px] mt-2 leading-[1.5] ${isMain ? 'text-red-700 font-semibold' : 'text-dim'}`}>
        {result.ev.quadrant}
      </p>
      {showSampleWarning && (
        <p className="text-[10.5px] text-faint leading-[1.5]">樣本較小，年化誤差較大</p>
      )}
    </div>
  )
}

// ── Reference 橫向卡（最近 5 年） ─────────────────────────────────────────────

function ReferenceRow({ result }: { result: ScaleEV | null }) {
  if (!result) {
    return (
      <div className="bg-elevated border border-[rgba(154,122,46,0.12)] rounded-lg px-[18px] py-3 text-small text-faint">
        最近 5 年 · 資料不足（需 ≥ 60 筆月報酬）
      </div>
    )
  }
  const numClass = result.evAnnual > 0 ? 'text-red-700' : result.evAnnual < 0 ? 'text-green-700' : 'text-main'
  const baseLabel = result.freq === 'daily' ? L.evDaily : L.evMonthly
  return (
    <div className="bg-elevated border border-[rgba(154,122,46,0.12)] rounded-lg px-[18px] py-3 flex items-center flex-wrap gap-x-3.5 gap-y-1 opacity-95">
      <span className="text-[16px] font-bold text-dim">{result.label}</span>
      <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
      <span className="text-[11.5px] text-dim">月報酬 {result.windowSize} 筆</span>
      <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
      <span className="text-[11.5px] text-dim">年化</span>
      <span className={`font-serif text-[20px] font-bold num ${numClass}`}>
        {fmtPct(result.evAnnual)}
      </span>
      <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
      <span className="text-[11.5px] text-dim">
        {baseLabel} <span className="num font-semibold text-red-700">{fmtPct(result.ev.ev, 2)}</span>
      </span>
      <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
      <span className="text-[11.5px] text-dim">{result.ev.quadrant}</span>
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
  const hasOddsAdvantage = primaryEv ? primaryEv.actualOdds > primaryEv.breakEvenOdds : false

  const title = titleOverride ?? '期望報酬與損益比優勢'
  const dailyLabel = dailyCountLabelOverride ?? `日報酬 ${dailyCount} 筆`

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">{title}</h2>
        <p className="text-caption text-faint mt-0.5">
          多尺度{L.evAnnual}（最近 3 個月 · 最近 1 年 · 最近 5 年參考）· 月報酬 {monthlyCount} 筆 + {dailyLabel}
        </p>
      </div>

      {/* Divergence 判讀 sbadge — 緊湊 inline-flex + pulse dot */}
      <div>
        <div className="sbadge">
          <div className="sdot" />
          <span className="text-small font-medium">{banner.text}</span>
        </div>
      </div>

      {/* 主要判斷：2 卡並排，medium 加金邊主判斷 chip + 🏆 */}
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
          tier="primary-main"
        />
      </div>

      {/* 參考列：最近 5 年橫向 1 行 */}
      <ReferenceRow result={result.long} />

      {/* 主要尺度勝敗率 stats row（含損益比優勢）— 用 .sdiv 直線分隔 */}
      {primaryEv && (
        <div className="border-t border-b border-base py-3 flex items-center flex-wrap gap-x-3.5 gap-y-1 text-small text-dim">
          <span className="font-semibold text-main">損益比優勢</span>
          <span className={`font-semibold ${hasOddsAdvantage ? 'text-red-700' : 'text-green-700'}`}>
            {hasOddsAdvantage ? '✓ 有優勢' : '✗ 無優勢'}
          </span>
          <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
          <span>勝率 <span className="text-red-700 font-semibold num">{fmtWinRate(primaryEv.winRate)}</span></span>
          <span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />
          <span>敗率 <span className="text-green-700 font-semibold num">{fmtWinRate(primaryEv.lossRate)}</span></span>
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
            <p className="text-dim">三尺度{L.evAnnual}計算過程：</p>
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
