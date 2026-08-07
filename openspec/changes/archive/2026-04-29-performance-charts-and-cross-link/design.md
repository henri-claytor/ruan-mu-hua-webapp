# Design: 績效圖表 + 雙向跨頁連結

## Context

Change 1+2 把績效分析的「資料 + 整體 Dashboard + 個股矩陣」做完了。本 change 加上：

1. **時序與分佈視覺化**：把表格無法表達的時間演變與分佈用圖呈現
2. **個股分析頁的反向摘要**：閉合「績效 ↔ 個股」雙向跨頁連結（Change 2 已做正向）
3. **市場 vs 我的賠率對照**：本系統獨家洞察——只有同時擁有前向（市場資料）與後向（交易紀錄）功能的 app 才能產出

## Goals / Non-Goals

**Goals:**
- 3 張圖表（累積損益曲線 / 個股貢獻 / 持有天數分佈）放在績效分析頁
- 個股分析頁底部「我交易過這檔」摘要，含市場 vs 我賠率對照
- `/performance?stock=2330` 支援自動篩選矩陣表
- 重用既有的 Recharts 與圖表樣式（chartStyle.ts）

**Non-Goals:**
- 不做完整診斷引擎（→ Change 4）
- 不做 PDF / Excel 匯出（→ Change 4）
- 不做按產業別 / 時段分析（未來 Phase 3）
- 不做交易明細時序圖（每筆交易在時間軸的點，過於複雜，未來再做）

## Decisions

### D1 — 累積損益曲線設計

**決策**：

```
              累積損益曲線
              X 軸：sellDate
              Y 軸：累積實現損益（元）
              主曲線（區域圖）：cumPnl
              滾動高點：runningMax（淺灰虛線）
              最大回撤區段：以紅色陰影 ReferenceArea 標注
              標題下方副標：「最大回撤 −XX,XXX 元（−Y.Y%）」
```

資料來源：對 trades 依 sellDate 升序排，逐筆累積 pnl。

**邊界**：
- 同一天有多筆 → 順序依 trade 在 store 中的順序累積（不影響最終值）
- 累積永遠從 0 開始（第一筆 sellDate 之前 = 0）

**為什麼用 AreaChart 而不是 LineChart**：填色強化「資金水位」的意象，視覺上更易感受到回撤。

### D2 — 個股損益貢獻長條圖

**決策**：水平長條（horizontal bar），最多顯示前 15 名（依 |totalPnl| 降序），其餘聚合為「其他」。

```
2330 台積電  ████████████████ +139,500
0050 元大50 ████████░░░░░░░░ +39,600
2317 鴻海   ░░░░░░██████░░░░ −13,000   ← 負值左延伸（綠）
其他 (3 檔)  ░░░░░░░██░░░░░░░ −5,200
```

**配色**：正值紅、負值綠（台股慣例）。

**邊界**：
- 個股數 ≤ 15 → 全部顯示
- 個股數 > 15 → 顯示前 15 + 「其他」聚合

**理由**：水平長條比垂直更易讀股票名稱，水平延伸方向直觀對應正負。

### D3 — 持有天數分佈直方圖

**決策**：6 個固定分桶（0–7 / 8–14 / 15–30 / 31–60 / 61–90 / 90+ 天），每個分桶疊加顯示「勝場 vs 敗場」筆數（stacked bar）。

```
0-7天  | █████ 勝3 | ██ 敗2
8-14天 | ████ 勝2  | ███ 敗3
...
```

**X 軸**：分桶；**Y 軸**：交易筆數；**配色**：勝場紅、敗場綠（台股慣例）。

**輸出 utility**：`holdingDaysHistogram(trades): Array<{ bucket, wins, losses, avgWinReturn, avgLossReturn }>`

**理由**：固定分桶比動態分位更易跨股票比較，6 桶涵蓋短中長期主要區間。

### D4 — PerformanceCharts 容器設計

**決策**：3 張圖共用一個摺疊容器 `PerformanceCharts`，預設展開，標題「績效視覺化」。

```
[績效視覺化  ▼]
├── 累積損益曲線（全寬）
├── 個股損益貢獻 + 持有天數分佈（並排，桌機 grid-cols-2；手機 stack）
```

**位置**：插在 PerformancePage 的「個股矩陣表」之後、「原始交易表格」之前。

**理由**：
- 累積曲線是「整體故事」，獨佔一行視覺最有衝擊
- 貢獻長條與持有分佈視覺密度相當，並排對比兩個維度

### D5 — 「我交易過這檔」摘要設計

**決策**：在 IndividualPage 的 ActionGuide 之後新增 `MyTradeHistoryBlock`。元件邏輯：

```typescript
function MyTradeHistoryBlock({ stockCode, marketPayoff }: Props) {
  const trades = useTradeStore((s) => s.trades).filter(t => t.stockId === stockCode)
  const stats = trades.length > 0 ? calcStockStats(trades, stockCode, totalPnl) : null

  if (!stats) return <EmptyTradeHistory stockCode={stockCode} />
  return <FilledTradeHistory stats={stats} marketPayoff={marketPayoff} />
}
```

**Filled 狀態 UI**：

```
┌─────────────────────────────────────────────────────┐
│ 我在這檔的交易紀錄                                  │
│ Q1 雙優徽章                                          │
├─────────────────────────────────────────────────────┤
│ 共交易 N 次 · 勝率 65% · 總損益 +XX,XXX 元           │
├─────────────────────────────────────────────────────┤
│ 市場 vs 我的賠率對照（最重要！）                     │
│   市場月賠率：1.85   ← 來自 EV 多尺度長期            │
│   我的交易賠率：0.92  ← 來自 StockStats              │
│   → 市場給的機會夠好，但你的進出場時機可能要改善     │
├─────────────────────────────────────────────────────┤
│ → 查看完整交易明細（連結至 /performance?stock=2330） │
└─────────────────────────────────────────────────────┘
```

**Empty 狀態 UI**：

```
┌─────────────────────────────────────────────────────┐
│ 我在這檔的交易紀錄                                  │
├─────────────────────────────────────────────────────┤
│ 你尚未在「績效分析」中記錄這檔股票的交易             │
│ → 前往績效分析新增 / 上傳交易紀錄                    │
└─────────────────────────────────────────────────────┘
```

**理由**：
- 不論有沒有交易，都顯示這個區塊（提示功能存在）
- Filled 時把「市場 vs 我的對照」做成 Hero 列，因為這是最有價值的洞察

### D6 — 市場 vs 我賠率對照的解讀文字

**決策**：定義對照邏輯：

```typescript
function compareInsight(market: number, mine: number): string {
  const diff = mine - market
  if (Math.abs(diff) < 0.2) return '市場面與你的執行相當，無顯著差距。'
  if (mine > market + 0.2) return '你比市場給的更好——進出場時機掌握優於平均。'
  if (mine < market - 0.2) return '市場機會夠好，但你的進出場時機可能要改善。'
  return ''
}
```

**門檻 0.2**：賠率單位下，0.2 差距具備視覺意義（從 1.0 → 1.2 是 +20% 改善）。

**理由**：避免使用者對微小差距過度解讀；對顯著差距給出具體方向。

### D7 — 市場賠率資料源（來自既有多尺度 EV）

**決策**：從 IndividualPage 既有的 `evMulti.long.ev` 取得長期月平均：

```typescript
// IndividualPage 內
const marketPayoff = results.evMulti
  ? results.evMulti.long.ev.actualOdds  // = avgGain / avgLoss
  : null
```

**理由**：避免重新計算，直接重用 Change 5（multi-scale-ev）的結果。

**邊界**：`evMulti === null`（資料不足）→ 顯示「市場長期資料不足，無法對照」。

### D8 — `?stock=` query string 篩選矩陣表

**決策**：

PerformancePage 讀 `?stock=2330` → 傳給 `<StockQuadrantMatrix filterStockId="2330" />`。

`StockQuadrantMatrix` 擴充：
- 新增 `filterStockId?: string` prop
- 內部 `filter` state 改為對 stockId 與 quadrant 兩個都 filter
- 若 `filterStockId` 存在 → 只顯示該股、頂部顯示「篩選：2330 台積電（清除）」label

**理由**：
- 用 prop 控制比 URL parse 散在元件各處乾淨
- 讓使用者從個股頁跳過來時，矩陣表自動聚焦該股的所有交易

### D9 — 圖表配色與既有設計一致

**決策**：所有圖表的配色從 `src/utils/chartStyle.ts` 既有 `CHART_COLORS` 取，並對「正/負」報酬使用台股紅漲綠跌：

| 用途 | 顏色 |
|------|------|
| 累積損益主曲線 | `CHART_COLORS.p50`（藍）|
| 滾動高點 | `CHART_COLORS.refLine`（淺灰）|
| 最大回撤陰影 | `CHART_COLORS.negative`（綠）+ 半透明 |
| 個股貢獻正值 | red-500 |
| 個股貢獻負值 | green-500 |
| 勝場分佈（直方）| red-500 |
| 敗場分佈（直方）| green-500 |

**理由**：與既有圖表風格一致；既有 chartStyle 已支援 CSS 變數讀取，自動跟主題。

## Risks / Trade-offs

- **累積損益曲線跨年資料 X 軸密度**：使用者交易若橫跨多年、X 軸標籤會擁擠 → 緩解：Recharts 自動 tick 略過；極端情況可用「最近 12 個月」過濾（暫不做）
- **持有天數分佈在交易筆數少時看不清**：< 10 筆時 6 個 bucket 大多空 → 接受。樣本本來就少，圖表只是輔助
- **市場 vs 我賠率單位的可比性**：市場是「月平均報酬的賠率」，我的是「每筆交易的賠率」，兩者數量級不一定對齊 → 緩解：在副標清楚標示來源（「市場月賠率」vs「你的交易賠率」），讓使用者知道這是不同尺度的對照而非絕對相等
- **MyTradeHistoryBlock 在 Empty 狀態的引導價值**：使用者可能不會主動去績效分析記錄交易 → 接受。這個 empty UI 的目的就是引導他們發現這個功能
- **`?stock=` 與既有 `?code=`（IndividualPage）命名不一致**：兩頁用不同 query 名稱 → 接受。`code` 是「股票代號」、`stock` 是「篩選股票」，語意不同；保持不一致避免將來衝突
