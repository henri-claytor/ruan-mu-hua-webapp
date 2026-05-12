#!/usr/bin/env node
/**
 * 實際股票 Hurst 診斷：抓代表性個股的日報酬，跑多窗口 R/S 迴歸 + Anis-Lloyd 修正。
 * 直接打 CMoney API（Node.js 端無 CORS 限制，免走 proxy）。
 *
 * 用法：node scripts/diagnose-real-stocks.mjs
 */

const CMONEY_BASE = 'https://www.cmoney.tw/MobileService/ashx/GetDtnoData.ashx'

async function fetchDaily(code) {
  const url = `${CMONEY_BASE}?DtNo=133057193&Action=GetDtNoData&FilterNo=0&ParamStr=AssignID=${code}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const titles = json.Title
  const idx = titles.findIndex((t) => t.includes('報酬'))
  const retIdx = idx >= 0 ? idx : 1
  return json.Data
    .map((row) => {
      const s = (row[retIdx] ?? '').replace('%', '').trim()
      if (s === '' || s === '--' || s === 'N/A') return NaN
      const n = parseFloat(s)
      return isNaN(n) ? NaN : n / 100
    })
    .filter((v) => !isNaN(v))
}

// ── Hurst（複製自 src/lib/hurst.ts） ──────────────────────────────────────────

function average(a) { return a.reduce((s, v) => s + v, 0) / a.length }
function stdev(a) {
  const m = average(a)
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length)
}

function calcRSForWindow(window) {
  const mu = average(window)
  const s = stdev(window)
  if (s === 0) return NaN
  let cum = 0, max = -Infinity, min = Infinity
  for (const r of window) {
    cum += r - mu
    if (cum > max) max = cum
    if (cum < min) min = cum
  }
  const range = max - min
  if (range === 0) return NaN
  return range / s
}

function lgamma(x) {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  x -= 1
  let a = c[0]
  const t = x + 7.5
  for (let i = 1; i < 9; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

function expectedRS(n) {
  let sum = 0
  for (let i = 1; i < n; i++) sum += Math.sqrt((n - i) / i)
  if (n <= 340) {
    const factor = Math.exp(lgamma((n - 1) / 2) - 0.5 * Math.log(Math.PI) - lgamma(n / 2))
    return factor * sum
  }
  return sum / Math.sqrt((n * Math.PI) / 2)
}

function linearSlope(xs, ys) {
  const n = xs.length
  const mx = average(xs), my = average(ys)
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  return den === 0 ? 0 : num / den
}

const SIZES = [10, 20, 40, 80, 160]

function calcHurst(returns) {
  const values = returns.filter((v) => !isNaN(v))
  const n = values.length
  if (n < 10) return null
  const available = SIZES.filter((s) => s <= Math.floor(n / 2))
  if (available.length < 2) {
    // fallback
    const mu = average(values), s = stdev(values)
    let cum = 0, max = -Infinity, min = Infinity
    for (const r of values) { cum += r - mu; if (cum > max) max = cum; if (cum < min) min = cum }
    const r = max - min
    if (s === 0 || r === 0) return null
    return Math.max(0, Math.min(1, Math.log(r / s) / Math.log(n)))
  }
  const points = []
  for (const size of available) {
    const subCount = Math.floor(n / size)
    const tail = values.slice(n - subCount * size)
    const rsValues = []
    for (let i = 0; i < subCount; i++) {
      const w = tail.slice(i * size, (i + 1) * size)
      const rs = calcRSForWindow(w)
      if (!isNaN(rs)) rsValues.push(rs)
    }
    if (rsValues.length === 0) continue
    points.push({ n: size, rs: average(rsValues) })
  }
  if (points.length < 2) return null
  const xs = points.map((p) => Math.log(p.n))
  const ys = points.map((p) => {
    const e = expectedRS(p.n)
    const corrected = p.rs - e + Math.sqrt((Math.PI * p.n) / 2)
    return Math.log(Math.max(corrected, 1e-10))
  })
  return Math.max(0, Math.min(1, linearSlope(xs, ys)))
}

function multiScale(daily) {
  if (daily.length < 240) return null
  return {
    short: calcHurst(daily.slice(-60)),
    medium: calcHurst(daily.slice(-120)),
    long: calcHurst(daily.slice(-240)),
  }
}

// ── 代表性測試樣本 ────────────────────────────────────────────────────────────

const SAMPLES = [
  { code: '2330', label: '台積電（大型權值）' },
  { code: '2317', label: '鴻海（大型權值）' },
  { code: '2454', label: '聯發科（半導體）' },
  { code: '2603', label: '長榮（航運週期股）' },
  { code: '0050', label: '元大台灣 50（ETF）' },
  { code: '00878', label: '國泰永續高股息（ETF）' },
  { code: '2412', label: '中華電（防禦股）' },
  { code: '3008', label: '大立光（成長股）' },
  { code: '2002', label: '中鋼（傳產）' },
  { code: '6505', label: '台塑化（傳產）' },
]

function interp(h) {
  if (h > 0.6) return '趨勢'
  if (h < 0.4) return '回歸'
  return '隨機'
}

function pad(s, n) { return String(s).padEnd(n) }

console.log('=== 多窗口 R/S 迴歸 + Anis-Lloyd 修正 ===\n')
console.log(pad('股票', 10), pad('名稱', 30), pad('日筆數', 8), pad('短(60)', 14), pad('中(120)', 14), pad('長(240)', 14))
console.log('-'.repeat(95))

for (const { code, label } of SAMPLES) {
  try {
    const daily = await fetchDaily(code)
    const ms = multiScale(daily)
    if (!ms) { console.log(pad(code, 10), pad(label, 30), pad(daily.length, 8), '資料不足'); continue }
    const fmt = (v) => v == null ? '-' : `${v.toFixed(3)}(${interp(v)})`
    console.log(pad(code, 10), pad(label, 30), pad(daily.length, 8), pad(fmt(ms.short), 14), pad(fmt(ms.medium), 14), pad(fmt(ms.long), 14))
  } catch (err) {
    console.log(pad(code, 10), pad(label, 30), '錯誤：', err.message)
  }
  await new Promise((r) => setTimeout(r, 300))
}
