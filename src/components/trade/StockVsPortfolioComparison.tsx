/**
 * 個股 vs 組合對比區塊
 *
 * 含 3 個子表（EV / VaR / Hurst）的 Tab 切換，幫助使用者看出
 * 每支股票對組合各維度的貢獻方向。
 */

import { useState, useMemo } from 'react'
import type { MultiScaleEVResult } from '../../lib/ev'
import type { VaRResult } from '../../lib/var'
import type { MultiScaleHurstResult, HurstResult } from '../../lib/hurst'
import {
  compareEV,
  compareVaR,
  compareHurstCategory,
  categorizeHurst,
  getOverallVerdict,
  getVaROverallVerdict,
  type EVAlignment,
  type OverallVerdict,
  type VaROverallVerdict,
} from '../../lib/comparison'
import { fmtPct } from '../../utils/format'

// ── Stock comparison input ────────────────────────────────────────────────────

export interface StockComparisonInput {
  stockId: string
  stockName: string
  weight: number  // 0–100
  ev: MultiScaleEVResult | null
  var: VaRResult | null
  hurst: MultiScaleHurstResult | null
}

interface Props {
  portfolioEV: MultiScaleEVResult
  portfolioVar: VaRResult
  portfolioHurst: MultiScaleHurstResult | HurstResult | null
  stocks: StockComparisonInput[]
}

// ── 對比符號樣式 ──────────────────────────────────────────────────────────────

function alignmentSymbol(a: EVAlignment): { symbol: string; cls: string } {
  if (a === 'aligned') return { symbol: '✓', cls: 'text-green-700' }
  if (a === 'opposed') return { symbol: '⚠', cls: 'text-amber-700' }
  return { symbol: '—', cls: 'text-faint' }
}

function verdictBadge(verdict: OverallVerdict | VaROverallVerdict): {
  label: string
  cls: string
} {
  switch (verdict) {
    case '一致':
    case '降低風險':
      return { label: verdict, cls: 'bg-green-50 text-green-700' }
    case '部分對立':
    case '混合':
      return { label: verdict, cls: 'bg-amber-50 text-amber-700' }
    case '全對立':
    case '拉高風險':
      return { label: verdict, cls: 'bg-red-50 text-red-700' }
    case '接近組合':
      return { label: verdict, cls: 'bg-blue-50 text-blue-700' }
    case '資料不足':
      return { label: verdict, cls: 'bg-elevated text-dim' }
  }
}

function evColorClass(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'text-faint'
  if (n > 0) return 'text-red-700'
  if (n < 0) return 'text-green-700'
  return 'text-main'
}

// ── EV 子表 ───────────────────────────────────────────────────────────────────

function EVComparisonTable({
  portfolioEV,
  stocks,
}: {
  portfolioEV: MultiScaleEVResult
  stocks: StockComparisonInput[]
}) {
  const portShort = portfolioEV.short?.evAnnual ?? null
  const portMedium = portfolioEV.medium?.evAnnual ?? null
  const portLong = portfolioEV.long?.evAnnual ?? null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small">
        <thead className="bg-elevated text-dim">
          <tr>
            <th className="px-3 py-2 text-left">股票</th>
            <th className="px-3 py-2 text-right">比重</th>
            <th className="px-3 py-2 text-right">短期年化</th>
            <th className="px-3 py-2 text-right">中期年化</th>
            <th className="px-3 py-2 text-right">長期年化</th>
            <th className="px-3 py-2 text-center">整體對比</th>
          </tr>
        </thead>
        <tbody>
          {/* 組合基準列 */}
          <tr className="bg-blue-50/40 font-semibold">
            <td className="px-3 py-2 text-main">組合（基準）</td>
            <td className="px-3 py-2 text-right text-dim">100%</td>
            <td className={`px-3 py-2 text-right num ${evColorClass(portShort)}`}>
              {portShort !== null ? fmtPct(portShort) : '—'}
            </td>
            <td className={`px-3 py-2 text-right num ${evColorClass(portMedium)}`}>
              {portMedium !== null ? fmtPct(portMedium) : '—'}
            </td>
            <td className={`px-3 py-2 text-right num ${evColorClass(portLong)}`}>
              {portLong !== null ? fmtPct(portLong) : '—'}
            </td>
            <td className="px-3 py-2 text-center text-faint">(基準)</td>
          </tr>

          {stocks.map((s) => {
            const sShort = s.ev?.short?.evAnnual ?? null
            const sMedium = s.ev?.medium?.evAnnual ?? null
            const sLong = s.ev?.long?.evAnnual ?? null

            // 對比：依組合各尺度判斷
            const aShort = portShort !== null ? compareEV(sShort, portShort) : 'na'
            const aMedium = portMedium !== null ? compareEV(sMedium, portMedium) : 'na'
            const aLong = portLong !== null ? compareEV(sLong, portLong) : 'na'
            const verdict = getOverallVerdict([aShort, aMedium, aLong])

            return (
              <tr key={s.stockId} className="border-t border-base">
                <td className="px-3 py-2">
                  <span className="font-semibold">{s.stockId}</span>
                  <br />
                  <span className="text-caption text-dim">{s.stockName}</span>
                </td>
                <td className="px-3 py-2 text-right num text-dim">{s.weight}%</td>
                <CellEV value={sShort} alignment={aShort} />
                <CellEV value={sMedium} alignment={aMedium} />
                <CellEV value={sLong} alignment={aLong} />
                <td className="px-3 py-2 text-center">
                  <Badge {...verdictBadge(verdict)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CellEV({ value, alignment }: { value: number | null; alignment: EVAlignment }) {
  const sym = alignmentSymbol(alignment)
  return (
    <td className="px-3 py-2 text-right num whitespace-nowrap">
      {value !== null ? (
        <>
          <span className={evColorClass(value)}>{fmtPct(value)}</span>
          {' '}
          <span className={sym.cls}>{sym.symbol}</span>
        </>
      ) : (
        <span className="text-faint">—</span>
      )}
    </td>
  )
}

// ── VaR 子表 ──────────────────────────────────────────────────────────────────

function VaRComparisonTable({
  portfolioVar,
  stocks,
}: {
  portfolioVar: VaRResult
  stocks: StockComparisonInput[]
}) {
  const varSymbol = (c: ReturnType<typeof compareVaR>) => {
    if (c === 'higher-risk') return { symbol: '⬆', cls: 'text-red-700' }
    if (c === 'lower-risk') return { symbol: '⬇', cls: 'text-green-700' }
    if (c === 'similar') return { symbol: '≈', cls: 'text-blue-600' }
    return { symbol: '—', cls: 'text-faint' }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small">
        <thead className="bg-elevated text-dim">
          <tr>
            <th className="px-3 py-2 text-left">股票</th>
            <th className="px-3 py-2 text-right">比重</th>
            <th className="px-3 py-2 text-right">VaR 95%</th>
            <th className="px-3 py-2 text-right">VaR 99%</th>
            <th className="px-3 py-2 text-center">整體對比</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-blue-50/40 font-semibold">
            <td className="px-3 py-2 text-main">組合（基準）</td>
            <td className="px-3 py-2 text-right text-dim">100%</td>
            <td className="px-3 py-2 text-right num text-green-700">
              {fmtPct(portfolioVar.var95)}
            </td>
            <td className="px-3 py-2 text-right num text-green-700">
              {fmtPct(portfolioVar.var99)}
            </td>
            <td className="px-3 py-2 text-center text-faint">(基準)</td>
          </tr>

          {stocks.map((s) => {
            const sV95 = s.var?.var95 ?? null
            const sV99 = s.var?.var99 ?? null
            const c95 = compareVaR(sV95, portfolioVar.var95)
            const c99 = compareVaR(sV99, portfolioVar.var99)
            const verdict = getVaROverallVerdict(c95, c99)
            const sym95 = varSymbol(c95)
            const sym99 = varSymbol(c99)

            return (
              <tr key={s.stockId} className="border-t border-base">
                <td className="px-3 py-2">
                  <span className="font-semibold">{s.stockId}</span>
                  <br />
                  <span className="text-caption text-dim">{s.stockName}</span>
                </td>
                <td className="px-3 py-2 text-right num text-dim">{s.weight}%</td>
                <td className="px-3 py-2 text-right num whitespace-nowrap">
                  {sV95 !== null ? (
                    <>
                      <span className="text-green-700">{fmtPct(sV95)}</span>
                      {' '}
                      <span className={sym95.cls}>{sym95.symbol}</span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right num whitespace-nowrap">
                  {sV99 !== null ? (
                    <>
                      <span className="text-green-700">{fmtPct(sV99)}</span>
                      {' '}
                      <span className={sym99.cls}>{sym99.symbol}</span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge {...verdictBadge(verdict)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Hurst 子表 ────────────────────────────────────────────────────────────────

const HURST_CATEGORY_LABEL = {
  trending: '趨勢',
  random: '隨機',
  'mean-reverting': '回歸',
} as const

function HurstComparisonTable({
  portfolioHurst,
  stocks,
}: {
  portfolioHurst: MultiScaleHurstResult | HurstResult | null
  stocks: StockComparisonInput[]
}) {
  // 判斷 portfolio 是否為 multi-scale
  const isMulti = portfolioHurst !== null && 'short' in portfolioHurst && 'medium' in portfolioHurst
  const portShort = isMulti ? (portfolioHurst as MultiScaleHurstResult).short.h : null
  const portMedium = isMulti ? (portfolioHurst as MultiScaleHurstResult).medium.h : null
  const portLong = portfolioHurst
    ? isMulti
      ? (portfolioHurst as MultiScaleHurstResult).long.h
      : (portfolioHurst as HurstResult).h
    : null

  if (portLong === null) {
    return (
      <p className="text-small text-dim italic">組合 Hurst 資料不足，無法進行對比。</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small">
        <thead className="bg-elevated text-dim">
          <tr>
            <th className="px-3 py-2 text-left">股票</th>
            <th className="px-3 py-2 text-right">比重</th>
            <th className="px-3 py-2 text-right">短期 H</th>
            <th className="px-3 py-2 text-right">中期 H</th>
            <th className="px-3 py-2 text-right">長期 H</th>
            <th className="px-3 py-2 text-center">整體對比</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-blue-50/40 font-semibold">
            <td className="px-3 py-2 text-main">組合（基準）</td>
            <td className="px-3 py-2 text-right text-dim">100%</td>
            <td className="px-3 py-2 text-right num text-main">
              {portShort !== null ? `${portShort.toFixed(2)} (${HURST_CATEGORY_LABEL[categorizeHurst(portShort)]})` : '—'}
            </td>
            <td className="px-3 py-2 text-right num text-main">
              {portMedium !== null ? `${portMedium.toFixed(2)} (${HURST_CATEGORY_LABEL[categorizeHurst(portMedium)]})` : '—'}
            </td>
            <td className="px-3 py-2 text-right num text-main">
              {`${portLong.toFixed(2)} (${HURST_CATEGORY_LABEL[categorizeHurst(portLong)]})`}
            </td>
            <td className="px-3 py-2 text-center text-faint">(基準)</td>
          </tr>

          {stocks.map((s) => {
            const sShort = s.hurst?.short.h ?? null
            const sMedium = s.hurst?.medium.h ?? null
            const sLong = s.hurst?.long.h ?? null

            const aShort = portShort !== null ? compareHurstCategory(sShort, portShort) : 'na'
            const aMedium = portMedium !== null ? compareHurstCategory(sMedium, portMedium) : 'na'
            const aLong = compareHurstCategory(sLong, portLong)
            const verdict = getOverallVerdict([aShort, aMedium, aLong])

            return (
              <tr key={s.stockId} className="border-t border-base">
                <td className="px-3 py-2">
                  <span className="font-semibold">{s.stockId}</span>
                  <br />
                  <span className="text-caption text-dim">{s.stockName}</span>
                </td>
                <td className="px-3 py-2 text-right num text-dim">{s.weight}%</td>
                <CellHurst value={sShort} alignment={aShort} />
                <CellHurst value={sMedium} alignment={aMedium} />
                <CellHurst value={sLong} alignment={aLong} />
                <td className="px-3 py-2 text-center">
                  <Badge {...verdictBadge(verdict)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CellHurst({ value, alignment }: { value: number | null; alignment: EVAlignment }) {
  const sym = alignmentSymbol(alignment)
  return (
    <td className="px-3 py-2 text-right num whitespace-nowrap">
      {value !== null ? (
        <>
          <span className="text-main">
            {value.toFixed(2)} ({HURST_CATEGORY_LABEL[categorizeHurst(value)]})
          </span>
          {' '}
          <span className={sym.cls}>{sym.symbol}</span>
        </>
      ) : (
        <span className="text-faint">—</span>
      )}
    </td>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-caption font-semibold ${cls}`}>
      {label}
    </span>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────────

type Tab = 'ev' | 'var' | 'hurst'

export default function StockVsPortfolioComparison({
  portfolioEV,
  portfolioVar,
  portfolioHurst,
  stocks,
}: Props) {
  const [tab, setTab] = useState<Tab>('ev')

  // Tab 標籤旁的對比結論摘要
  const evSummary = useMemo(() => {
    if (stocks.length === 0) return ''
    const counts = { 一致: 0, 部分對立: 0, 全對立: 0, 資料不足: 0 } as Record<OverallVerdict, number>
    for (const s of stocks) {
      const aShort = portfolioEV.short
        ? compareEV(s.ev?.short?.evAnnual ?? null, portfolioEV.short.evAnnual)
        : 'na'
      const aMedium = portfolioEV.medium
        ? compareEV(s.ev?.medium?.evAnnual ?? null, portfolioEV.medium.evAnnual)
        : 'na'
      const aLong = portfolioEV.long
        ? compareEV(s.ev?.long?.evAnnual ?? null, portfolioEV.long.evAnnual)
        : 'na'
      counts[getOverallVerdict([aShort, aMedium, aLong])]++
    }
    return `${counts['一致']} 一致 / ${counts['部分對立']} 部分對立 / ${counts['全對立']} 全對立`
  }, [stocks, portfolioEV])

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">個股 vs 組合對比</h2>
        <p className="text-caption text-faint mt-0.5">
          看每檔股票對組合各維度的貢獻方向（EV / VaR / Hurst）
        </p>
      </div>

      {/* Tab 切換 */}
      <div className="flex border-b border-base gap-1">
        <TabButton active={tab === 'ev'} onClick={() => setTab('ev')}>
          EV
          <span className="text-caption text-faint ml-2">{evSummary}</span>
        </TabButton>
        <TabButton active={tab === 'var'} onClick={() => setTab('var')}>VaR</TabButton>
        <TabButton active={tab === 'hurst'} onClick={() => setTab('hurst')}>Hurst</TabButton>
      </div>

      {tab === 'ev' && <EVComparisonTable portfolioEV={portfolioEV} stocks={stocks} />}
      {tab === 'var' && <VaRComparisonTable portfolioVar={portfolioVar} stocks={stocks} />}
      {tab === 'hurst' && <HurstComparisonTable portfolioHurst={portfolioHurst} stocks={stocks} />}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-small font-medium transition-colors ${
        active
          ? 'border-b-2 border-blue-500 text-blue-700'
          : 'text-dim hover:text-main'
      }`}
    >
      {children}
    </button>
  )
}
