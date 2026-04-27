import html2canvas from 'html2canvas'
import type { EVResult } from '../lib/ev'
import type { VaRResult } from '../lib/var'
import type { MonteCarloResult } from '../lib/montecarlo'
import type { HurstResult } from '../lib/hurst'

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
}

function fmtWan(n: number): string {
  return (n / 10000).toFixed(1) + ' 萬'
}

export interface IndividualSummaryData {
  ev: EVResult
  var?: VaRResult
  mc?: MonteCarloResult
}

export interface PortfolioSummaryData {
  ev: EVResult
  var: VaRResult
  mc: MonteCarloResult
}

export interface HurstSummaryData {
  result: HurstResult
}

export function buildIndividualSummary(data: IndividualSummaryData): string {
  const lines = [
    '【個股期望值分析】',
    `EV: ${fmt(data.ev.ev)}  象限: ${data.ev.quadrant}`,
    `勝率: ${fmt(data.ev.winRate)}  敗率: ${fmt(data.ev.lossRate)}`,
    `Avg Gain: ${fmt(data.ev.avgGain)}  Avg Loss: ${fmt(data.ev.avgLoss)}`,
    `實際賠率: ${data.ev.actualOdds.toFixed(2)}  損益平衡賠率: ${data.ev.breakEvenOdds.toFixed(2)}`,
  ]
  if (data.var) {
    lines.push(`VaR 95%: ${fmt(data.var.var95)}  VaR 99%: ${fmt(data.var.var99)}`)
  }
  if (data.mc) {
    lines.push(
      `蒙地卡羅 P50 → 1年: ${fmtWan(data.mc.oneYear.p50)}  3年: ${fmtWan(data.mc.threeYear.p50)}  5年: ${fmtWan(data.mc.fiveYear.p50)}`
    )
  }
  return lines.join('\n')
}

export function buildPortfolioSummary(data: PortfolioSummaryData): string {
  const lines = [
    '【投資組合分析】',
    `組合 EV: ${fmt(data.ev.ev)}  象限: ${data.ev.quadrant}`,
    `勝率: ${fmt(data.ev.winRate)}  敗率: ${fmt(data.ev.lossRate)}`,
    `VaR 95%: ${fmt(data.var.var95)}  VaR 99%: ${fmt(data.var.var99)}`,
    `蒙地卡羅 P50 → 1年: ${fmtWan(data.mc.oneYear.p50)}  3年: ${fmtWan(data.mc.threeYear.p50)}  5年: ${fmtWan(data.mc.fiveYear.p50)}`,
  ]
  return lines.join('\n')
}

export function buildHurstSummary(data: HurstSummaryData): string {
  const { result } = data
  return [
    '【Hurst 指數分析】',
    `H 值: ${result.h.toFixed(4)}  解讀: ${result.interpretation}`,
    `n=${result.n}  R=${result.r.toFixed(6)}  S=${result.s.toFixed(6)}  R/S=${(result.r / result.s).toFixed(4)}`,
  ].join('\n')
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback: create textarea
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

export async function downloadPng(element: HTMLElement, filename: string): Promise<void> {
  // Wait for charts to finish rendering
  await new Promise((r) => setTimeout(r, 500))
  const canvas = await html2canvas(element, { scale: 2, useCORS: true })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function buildPngFilename(page: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `rmh-${page}-${date}.png`
}
