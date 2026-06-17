/**
 * ActionGuide — 根據分析結果產生繁體中文分析觀察列表
 *
 * 純 rule-based。所有訊號→訊息對應集中在這個檔案，方便調整。
 * 三個分析頁（個股/組合/比較）各有對應的 build* 函式。
 */

import type { Divergence } from '../lib/hurst'
import type { EVDivergence } from '../lib/ev'

export type VarLevel = 'low' | 'mid' | 'high'

/** |var95| 區間判斷風險等級。低 < 5% < mid < 10% < high */
export function classifyVarLevel(var95: number): VarLevel {
  const abs = Math.abs(var95)
  if (abs < 0.05) return 'low'
  if (abs < 0.1) return 'mid'
  return 'high'
}

// ── Individual ────────────────────────────────────────────────────────────────

export interface IndividualSignals {
  ev: number
  evQuadrant: string
  varLevel: VarLevel
  hurstH: number | null            // 短期 H（多尺度時）或長期 H（單尺度時）
  hurstDivergence?: Divergence     // 多尺度時提供
  evDivergence?: EVDivergence      // 多尺度 EV 時提供
}

export function buildIndividualGuide(s: IndividualSignals): string[] {
  const items: string[] = []

  // EV × Hurst 組合判讀（用短期 H）
  if (s.ev > 0 && s.hurstH !== null && s.hurstH > 0.6) {
    items.push('EV 正值且短期趨勢持續（H > 0.6），統計上偏多方有利。')
  } else if (s.ev > 0) {
    items.push('期望值為正，整體傾向有利，仍需觀察趨勢強弱與部位變化。')
  } else {
    items.push('期望值為負，統計上偏不利，需更謹慎評估。')
  }

  // 風險等級
  if (s.varLevel === 'high') {
    items.push('下行風險偏高（VaR95 超過 10%），單筆波動較大。')
  } else if (s.varLevel === 'low') {
    items.push('下行風險偏低（VaR95 < 5%），波動可控。')
  }

  // Hurst 解讀（用短期 H）
  if (s.hurstH !== null) {
    if (s.hurstH < 0.4) {
      items.push('短期 Hurst < 0.4 顯示均值回歸傾向，高點延續性偏弱。')
    } else if (s.hurstH >= 0.4 && s.hurstH <= 0.55) {
      items.push('短期 Hurst 接近 0.5，價格走勢偏隨機，技術面參考度較低。')
    }
  }

  // Hurst Divergence 訊號（短期偏離長期）
  if (s.hurstDivergence === 'short-weakening') {
    items.push('⚠ 短期 H 顯著低於長期，趨勢動能可能轉弱。')
  } else if (s.hurstDivergence === 'short-strengthening') {
    items.push('⚠ 短期 H 顯著高於長期，動能轉強，可留意突破訊號。')
  }

  // EV Divergence 訊號（短期年化 EV 偏離長期）
  if (s.evDivergence === 'short-deteriorating') {
    items.push('⚠ 短期年化 EV 顯著低於長期，近期表現轉弱。')
  } else if (s.evDivergence === 'short-improving') {
    items.push('⚠ 短期年化 EV 顯著高於長期，近期動能轉強。')
  }

  return items
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export interface PortfolioSignals {
  ev: number
  varLevel: VarLevel
  hurstH: number | null
  stockCount: number
  /** 多尺度 EV divergence 訊號（資料夠時提供）*/
  evDivergence?: EVDivergence
  /** 多尺度 Hurst divergence 訊號（資料夠時提供）*/
  hurstDivergence?: Divergence
}

export function buildPortfolioGuide(s: PortfolioSignals): string[] {
  const items: string[] = []

  if (s.ev > 0) {
    items.push('組合整體期望值為正，統計方向偏正面。')
  } else {
    items.push('組合整體期望值為負，可檢視成分股權重與低 EV 標的的分布。')
  }

  if (s.stockCount < 3) {
    items.push('組合股數較少，非系統性風險集中。')
  }

  if (s.varLevel === 'high') {
    items.push('組合下行風險偏高，高波動股票權重較重。')
  }

  if (s.hurstH !== null) {
    if (s.hurstH > 0.6) {
      items.push('組合呈現趨勢特性（H > 0.6），統計上具順勢延續傾向。')
    } else if (s.hurstH < 0.4) {
      items.push('組合偏均值回歸（H < 0.4），追高型策略的統計效果偏弱。')
    }
  }

  // EV divergence（多尺度時）
  if (s.evDivergence === 'short-deteriorating') {
    items.push('⚠ 組合短期年化 EV 顯著低於長期，近期表現轉弱。')
  } else if (s.evDivergence === 'short-improving') {
    items.push('⚠ 組合短期年化 EV 顯著高於長期，動能轉強。')
  }

  // Hurst divergence（多尺度時）
  if (s.hurstDivergence === 'short-weakening') {
    items.push('⚠ 組合短期 H 顯著低於長期，趨勢動能可能轉弱。')
  } else if (s.hurstDivergence === 'short-strengthening') {
    items.push('⚠ 組合短期 H 顯著高於長期，動能轉強。')
  }

  return items
}

// ── Compare ───────────────────────────────────────────────────────────────────

export interface CompareSignals {
  evA: number | null
  evB: number | null
  varA: number | null  // var95
  varB: number | null
  hurstA: number | null
  hurstB: number | null
  nameA: string
  nameB: string
}

export function buildCompareGuide(s: CompareSignals): string[] {
  // 兩股都要有完整資料才比較
  if (s.evA === null || s.evB === null) return []

  const items: string[] = []
  const { evA, evB, nameA, nameB } = s

  // EV 對決
  if (evA < 0 && evB > 0) {
    items.push(`${nameA} 期望值為負、${nameB} 為正，兩股統計方向相反。`)
  } else if (evB < 0 && evA > 0) {
    items.push(`${nameB} 期望值為負、${nameA} 為正，兩股統計方向相反。`)
  } else if (Math.abs(evA - evB) > 0.005) {
    const winner = evA > evB ? nameA : nameB
    items.push(`${winner} 期望值較高，在其他條件相近下統計上較佔優勢。`)
  } else {
    items.push('兩股期望值相近，可由風險與趨勢面進一步區分。')
  }

  // VaR 對決（虧損少者優）
  if (s.varA !== null && s.varB !== null) {
    const lossA = Math.abs(s.varA)
    const lossB = Math.abs(s.varB)
    if (Math.abs(lossA - lossB) > 0.01) {
      const safer = lossA < lossB ? nameA : nameB
      items.push(`${safer} 的 VaR95 較低，下行風險較小。`)
    }
  }

  // Hurst 對決
  if (s.hurstA !== null && s.hurstB !== null) {
    if (s.hurstA > 0.55 && s.hurstB < 0.45) {
      items.push(`${nameA} 偏趨勢、${nameB} 偏均值回歸，兩者統計特性差異明顯。`)
    } else if (s.hurstB > 0.55 && s.hurstA < 0.45) {
      items.push(`${nameB} 偏趨勢、${nameA} 偏均值回歸，兩者統計特性差異明顯。`)
    }
  }

  return items
}

// ── React 元件 ────────────────────────────────────────────────────────────────

interface ActionGuideProps {
  items: string[]
  title?: string
}

import { WORDING, COMPLIANCE_FOOTER } from '../lib/wording'

export default function ActionGuide({ items, title = WORDING.actionGuideTitle }: ActionGuideProps) {
  if (items.length === 0) return null

  return (
    <div className="bg-[#f4ead8] border-2 border-[#c9a84c] rounded-2xl p-6 space-y-3 shadow-sm">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[22px]" aria-hidden>💡</span>
        <h2 className="font-serif text-[20px] font-bold text-main tracking-wide">{title}</h2>
        <span className="text-[11px] text-gold-dark px-2 py-0.5 rounded-full bg-[rgba(154,122,46,0.1)]">
          {items.length} 條
        </span>
      </div>
      <p className="text-[12px] text-dim -mt-1">依下方多維度分析（EV / 風險 / 趨勢 / 模擬）自動產生</p>
      <ul className="space-y-2 pt-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[13.5px] text-main leading-relaxed">
            <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gold-dark text-white text-[11px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-faint text-[11px] pt-3 border-t border-[rgba(154,122,46,0.2)]">
        ⚠ {COMPLIANCE_FOOTER}
      </p>
    </div>
  )
}
