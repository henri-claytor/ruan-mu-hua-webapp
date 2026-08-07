# Design: ComparePage 套用個股頁全套邏輯

## Context

完成個股 + 組合頁的視覺體驗統一後，比較頁是最後一頁需要對齊的分析頁。比較頁的特殊之處在於它沒有「多尺度」概念（單尺度對比），主判斷的呈現方式需要設計為「綜合勝出方」而非「主判斷卡」。

## Goals / Non-Goals

**Goals:**
- 手動「開始比較」按鈕（同個股頁查詢、組合頁計算）
- ActionGuide 移到頂部、金邊強化
- 新增「綜合勝出方」主判斷區塊
- 比較表套用 `.cmp-table` 統一樣式 + `.win` 高亮
- 命名與其他頁一致

**Non-Goals:**
- 不引入多尺度概念（compare 本質是兩股對比）
- 不改 `calcEV / calcVaR / calcHurst / buildCompareGuide` 邏輯
- 不改 Zustand store
- 不改 StockSelector 元件

## Decisions

### D1 — 手動「開始比較」按鈕

```tsx
const [computed, setComputed] = useState(false)

useEffect(() => {
  setComputed(false)
}, [compareA.stockCode, compareA.monthlyReturns, compareB.stockCode, compareB.monthlyReturns])

const bothReady = compareA.monthlyReturns.length >= 10 && compareB.monthlyReturns.length >= 10
const isLoading = loadingA || loadingB
const buttonLabel = isLoading ? '載入中...' : computed ? '重新比較' : '開始比較'

function handleCompare() {
  if (!bothReady) return
  setComputed(true)
}

{/* 按鈕放在 StockPanel grid 下方 */}
<div className="flex justify-end">
  <button
    onClick={handleCompare}
    disabled={!bothReady || isLoading}
    className="btn btn-solid"
  >{buttonLabel}</button>
</div>

{/* 結果區改為 computed && bothReady && resultA.ev && resultB.ev 才渲染 */}
```

### D2 — 新增「綜合勝出方」主判斷卡

**位置**：ActionGuide 之後、比較表之前

**邏輯**：

```tsx
const winsA = [evAdv.a, winAdv.a, oddsAdv.a, var95Adv.a, var99Adv.a, hurstAdv.a].filter(Boolean).length
const winsB = [evAdv.b, winAdv.b, oddsAdv.b, var95Adv.b, var99Adv.b, hurstAdv.b].filter(Boolean).length
const total = 6
const ties = total - winsA - winsB
const verdict =
  winsA > winsB ? { name: labelA, winner: 'A' as const } :
  winsB > winsA ? { name: labelB, winner: 'B' as const } :
  { name: '平手', winner: null }
```

**呈現**（金邊主判斷卡）：

```tsx
<div className="relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-6 py-5">
  <div className="absolute top-2.5 right-3.5">
    <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">綜合勝出方</span>
  </div>
  <p className="text-[18px] font-bold text-main">整體推薦</p>
  <p className="text-[11px] text-dim mb-3">6 項指標統計（EV / 勝率 / 損益比 / 95% / 99% / 趨勢強度）</p>
  <p className={`font-serif text-[36px] font-bold leading-none ${verdict.winner ? 'text-red-700' : 'text-dim'}`}>
    {verdict.name}
  </p>
  <p className="text-[11px] text-dim mt-3">
    {labelA} 勝 {winsA} 項 · {labelB} 勝 {winsB} 項 · 平手 {ties} 項
  </p>
</div>
```

### D3 — 比較表 cmp-table 樣式

替換現有 `<table>` 為 `.cmp-table`（已在 index.css 定義）：

```tsx
<table className="cmp-table">
  <thead>
    <tr><th>指標</th><th>{labelA}</th><th>{labelB}</th></tr>
  </thead>
  <tbody>
    <tr>
      <td className="metric">期望報酬率</td>
      <td className={`num red ${evAdv.a ? 'win' : ''}`}>{...}</td>
      <td className={`num red ${evAdv.b ? 'win' : ''}`}>{...}</td>
    </tr>
    {/* ... */}
  </tbody>
</table>
```

優點：
- 與績效頁 / 組合頁的 `.cmp-table` 風格一致
- 表頭 serif、`.win` 自動綠底高亮
- 數字 serif

### D4 — 區塊順序

```
1. Header（清除資料）
2. 兩支股票 StockPanel grid
3. 「開始比較」按鈕（grid 之下）
─────────────── 以下為 computed && 兩股都 ready 才渲染 ───────────────
4. 操作建議（ActionGuide 金邊版）
5. 🆕 綜合勝出方（主判斷卡）
6. 比較表（cmp-table 樣式）
```

### D5 — 命名修正

- 表格列「期望值（EV）」→「期望報酬率」
- 副標「選取兩支股票，並排比較 EV、VaR 與 Hurst 指數」→「選取兩支股票，並排比較期望報酬率、下行虧損與趨勢強度」
- 「象限判斷」→「象限評級」（更白話）

### D6 — Migration 順序

1. 加 `computed` state + reset effect
2. 加「開始比較」按鈕
3. 把 ActionGuide 區塊移到結果區頂部
4. 新增「綜合勝出方」卡
5. 替換比較表為 `.cmp-table` 結構
6. 命名修正
7. 驗證 tsc / vitest / build / 部署

## Risks / Trade-offs

- **「綜合勝出方」門檻**：6 項簡單統計，未加權；未來可考慮加權（如 EV 比 Hurst 重要）— 第一版採平等
- **改變使用者習慣**：自動 → 手動。但個股/組合已是手動，使用者已適應
- **比較表的數值色（紅綠）**：EV/勝率/損益比正向用紅；VaR 用綠（虧損越小越好）— 沿用既有邏輯
