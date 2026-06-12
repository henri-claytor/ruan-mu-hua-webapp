import { describe, it, expect } from 'vitest'
import { parseTradesCSV, formatTradesCSV } from './csv'
import type { Trade } from './trade'

const VALID_CSV = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025-03-15,2025-09-20,580.50,720.00,1000,580500,720000,139500,0.2403,獲利了結
2317,鴻海,2025-04-01,2025-07-15,165.00,158.50,2000,330000,317000,-13000,-0.0394,停損出場
`

describe('parseTradesCSV', () => {
  it('parses valid CSV correctly', () => {
    const { trades, errors } = parseTradesCSV(VALID_CSV)
    expect(errors).toEqual([])
    expect(trades).toHaveLength(2)
    expect(trades[0].stockId).toBe('2330')
    expect(trades[0].stockName).toBe('台積電')
    expect(trades[0].buyDate).toBe('2025-03-15')
    expect(trades[0].pnl).toBe(139500)
    expect(trades[0].returnRate).toBeCloseTo(0.2403, 5)
    expect(trades[0].note).toBe('獲利了結')
  })

  it('skips comment lines and blank lines', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
# this is a comment
2330,台積電,2025-03-15,2025-09-20,580,720,1000,580000,720000,140000,0.2414,

2317,鴻海,2025-04-01,2025-07-15,165,158,2000,330000,316000,-14000,-0.0424,
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades).toHaveLength(2)
  })

  it('reports invalid date format', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025/03/15,2025-09-20,580,720,1000,580000,720000,140000,0.24,
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(trades).toHaveLength(0)
    expect(errors[0]).toMatch(/buy_date 格式錯誤/)
  })

  it('reports sell_date before buy_date', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025-09-20,2025-03-15,580,720,1000,580000,720000,140000,0.24,
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(trades).toHaveLength(0)
    expect(errors[0]).toMatch(/sell_date.*早於 buy_date/)
  })

  it('reports missing required header (buy_amount)', () => {
    // 缺必填欄位 buy_amount → 報錯
    const csv = `stock_id,buy_date,sell_date,sell_amount,shares
2330,2025-03-15,2025-09-20,720000,1000
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(trades).toHaveLength(0)
    expect(errors.some((e) => e.includes('buy_amount'))).toBe(true)
  })

  it('detects percentage format for return_rate (>1 → divide by 100)', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025-03-15,2025-09-20,580,720,1000,580000,720000,140000,24.03,
`
    const { trades } = parseTradesCSV(csv)
    expect(trades[0].returnRate).toBeCloseTo(0.2403, 5)
  })

  it('keeps decimal format for return_rate (≤1)', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025-03-15,2025-09-20,580,720,1000,580000,720000,140000,0.24,
`
    const { trades } = parseTradesCSV(csv)
    expect(trades[0].returnRate).toBeCloseTo(0.24, 5)
  })

  it('reports non-numeric required value (buy_amount)', () => {
    const csv = `stock_id,buy_date,sell_date,buy_amount,sell_amount,shares
2330,2025-03-15,2025-09-20,abc,720000,1000
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(trades).toHaveLength(0)
    expect(errors[0]).toMatch(/buy_amount 不是有效數值/)
  })

  it('ignores non-numeric optional value and auto-derives', () => {
    // buy_price 是選填，無效時自動推算
    const csv = `stock_id,buy_date,sell_date,buy_amount,sell_amount,shares,buy_price
2330,2025-03-15,2025-09-20,580500,720000,1000,abc
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades[0].buyPrice).toBeCloseTo(580.5, 5) // 自動推算
  })

  it('handles thousand-separator commas in numbers', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025-03-15,2025-09-20,580,720,1000,"580,000","720,000","140,000",0.24,
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades[0].buyAmount).toBe(580000)
    expect(trades[0].sellAmount).toBe(720000)
    expect(trades[0].pnl).toBe(140000)
  })

  // ── 簡化 6 欄版本 + 向下相容 ──────────────────────────────────────────

  it('accepts simplified 6-column CSV and auto-derives missing fields', () => {
    const csv = `stock_id,buy_date,sell_date,buy_amount,sell_amount,shares
2330,2025-03-15,2025-09-20,580500,720000,1000
2317,2025-04-01,2025-07-15,330000,317000,2000
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades).toHaveLength(2)
    // stockName 預設 = stockId
    expect(trades[0].stockName).toBe('2330')
    // buyPrice = buyAmount / shares
    expect(trades[0].buyPrice).toBeCloseTo(580.5, 5)
    expect(trades[0].sellPrice).toBeCloseTo(720, 5)
    // pnl = sell − buy（精確）
    expect(trades[0].pnl).toBe(139500)
    // returnRate = pnl / buyAmount
    expect(trades[0].returnRate).toBeCloseTo(139500 / 580500, 5)
    // 第二筆虧損
    expect(trades[1].pnl).toBe(-13000)
    expect(trades[1].note).toBeUndefined()
  })

  it('uses provided buy_price / pnl over derived ones when present', () => {
    // 提供 buy_price 720（與推算 580.5 不同）→ 用 CSV 提供值
    const csv = `stock_id,buy_date,sell_date,buy_amount,sell_amount,shares,buy_price,pnl
2330,2025-03-15,2025-09-20,580500,720000,1000,123.45,99999
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades[0].buyPrice).toBe(123.45)
    expect(trades[0].pnl).toBe(99999)
  })

  it('backward-compatible: full 12-column CSV still works', () => {
    const { trades, errors } = parseTradesCSV(VALID_CSV)
    expect(errors).toEqual([])
    expect(trades).toHaveLength(2)
    expect(trades[0].buyPrice).toBe(580.5) // 用提供值，不推算
  })

  it('partial CSV (with stock_name + note, no price/pnl) auto-derives', () => {
    const csv = `stock_id,stock_name,buy_date,sell_date,buy_amount,sell_amount,shares,note
2330,台積電,2025-03-15,2025-09-20,580500,720000,1000,獲利了結
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades[0].stockName).toBe('台積電') // 用 CSV 提供
    expect(trades[0].buyPrice).toBeCloseTo(580.5, 5) // 自動推算
    expect(trades[0].pnl).toBe(139500) // 自動推算
    expect(trades[0].note).toBe('獲利了結')
  })

  it('rejects when required column buy_amount missing', () => {
    const csv = `stock_id,buy_date,sell_date,sell_amount,shares
2330,2025-03-15,2025-09-20,720000,1000
`
    const { trades, errors } = parseTradesCSV(csv)
    expect(trades).toHaveLength(0)
    expect(errors.some((e) => /buy_amount/.test(e))).toBe(true)
  })
})

describe('formatTradesCSV', () => {
  it('round-trips valid trades', () => {
    const trade: Trade = {
      id: 'test-1',
      stockId: '2330',
      stockName: '台積電',
      buyDate: '2025-03-15',
      sellDate: '2025-09-20',
      buyPrice: 580.5,
      sellPrice: 720,
      shares: 1000,
      buyAmount: 580500,
      sellAmount: 720000,
      pnl: 139500,
      returnRate: 0.2403,
      note: '獲利了結',
    }
    const csv = formatTradesCSV([trade])
    const { trades, errors } = parseTradesCSV(csv)
    expect(errors).toEqual([])
    expect(trades).toHaveLength(1)
    expect(trades[0].stockId).toBe('2330')
    expect(trades[0].buyAmount).toBe(580500)
    expect(trades[0].pnl).toBe(139500)
  })
})
