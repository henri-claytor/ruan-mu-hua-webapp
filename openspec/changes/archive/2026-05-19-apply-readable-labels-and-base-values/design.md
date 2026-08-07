# Design: 白話命名 + 底層值副行

## Context

兩個獨立但綁定的改動：
1. 全站 UI 字串白話化（保留內部 type 與函式名稱）
2. 每張指標卡新增底層計算來源副行

## Goals / Non-Goals

**Goals:**
- 全站使用者面對的指標名稱統一白話
- 每張卡有清楚的層級：「主標 → 視窗 → 指標名 → 主數字 → 底層 → 評級 → 警語」
- 不改任何計算邏輯與 lib type

**Non-Goals:**
- 不改 lib/*.ts 內部 type / interface / 函式命名
- 不改色票、字級 token、layout 框架
- 不改 PDF/Excel 計算（只改文字標籤）
- 不改 cmp-table 結構（保留現狀）

## Decisions

### D1 — 命名對照表（單一真實來源）

集中在 `src/lib/labels.ts`（新檔），所有 UI 字串從此匯入：

```typescript
export const METRIC_LABELS = {
  evAnnual:    '年化期望報酬率',
  evAnnualShort: '年化報酬率',
  payoffRatio: '損益比',
  profitFactor: '獲利因子',
  winRate:     '勝率',
  lossRate:    '敗率',
  hurstH:      '趨勢強度 H',
  hurst:       '趨勢強度',
  fractalD:    '分形維度 D',
  var95:       '95% 下行虧損',
  var99:       '99% 下行虧損',
  mcP5:        '悲觀情境',
  mcP50:       '中位情境',
  mcP95:       '樂觀情境',
  totalPnl:    '總實現損益',
  overallReturn: '整體報酬率',
  avgHolding:  '平均持有天數',
  avgWinPct:   '勝場均報酬',
  avgLossPct:  '敗場均虧損',
}
```

**理由**：未來再改命名只改一處；元件 import 用變數而非寫死字串。

### D2 — 卡片視覺層級（統一規格）

```
┌────────────────────────────────────┐
│ {主標題}              [參考用?]chip│  ← 18px 粗、第 3 卡可加 chip
│ {視窗描述}                          │  ← 11px dim
│                                    │
│ {指標名稱}                          │  ← 13px dim
│ {主數字}                            │  ← 28~36px serif/sans 粗、紅綠
│                                    │
│ {底層值}                            │  ← 11px dim（NEW）
│                                    │
│ [評級 chip]                         │  ← (有則顯示)
│ {警語 / 樣本不足等}                 │  ← 11px faint（有則顯示）
└────────────────────────────────────┘
```

對 reference tier 卡（最近 5 年）：所有字級 ×0.85、bg-elevated、整體 dim。

### D3 — 各區塊底層值對應實作

#### EV ScaleCard
```tsx
底層值 = result.freq === 'daily' ? `日平均報酬率 ${fmtPct(result.ev.ev)}` : `月平均報酬率 ${fmtPct(result.ev.ev)}`
```

#### VaR
```tsx
底層值 = `${nUsed} 筆${freq}報酬第 ${percentile} 百分位`
// 例：「240 筆日報酬第 5 百分位」
```

#### Hurst H
```tsx
底層值 = `R/S 迴歸斜率（${result.points.length} 點）`
// fallback：`R/S 單點公式（n=${result.n}）`
```

#### 走勢規律性 D
```tsx
底層值 = `H = ${fmtRatio(h)}（D = 2 − H）`
```

#### Monte Carlo
```tsx
底層值 = `μ=${fmtPct(mu)} / σ=${fmtPct(sigma)}`
```

#### PortfolioPerformanceBlock（8 卡）

對應規則：

| 卡片 | 底層 |
|------|------|
| 總實現損益 | `總投入 ${fmtMoney(totalInvested)}` |
| 整體報酬率 | `年化 ${fmtPct(annualizedReturn)}` |
| 整體勝率 | `勝 ${nWins} / 共 ${nTrades}` |
| 獲利因子 | `總獲利 ${fmtMoney(totalWinPnl)} / 總虧損 ${fmtMoney(totalLossPnl)}` |
| 平均持有天數 | `最長 ${maxHoldingDays} / 最短 ${minHoldingDays}` |
| 勝場均報酬 | `勝場 ${nWins} 筆` |
| 敗場均虧損 | `敗場 ${nLosses} 筆` |
| 損益比 | `Avg Gain ${fmtPct(avgWin)} / Avg Loss ${fmtPct(-avgLoss)}` |

### D4 — 元件改造策略

**統一抽出 `<ScaleMetricCard>` 共用元件**？

評估：每個區塊的底層值格式不同（EV vs VaR vs Hurst vs D vs MC），抽元件後仍需各區傳入自己的底層字串。**不抽元件**，直接在每個 Block 修改既有 ScaleCard / metric-card 結構。

### D5 — 訊息檔（diagnosis / recommendations）

`diagnosis.ts` 與 `recommendations.ts` 訊息中所有「賠率」改「損益比」：

```typescript
// before: `${stockName} 賠率 ${payoff}`
// after:  `${stockName} 損益比 ${payoff}`
```

對應 test 斷言同步更新。

### D6 — PDF / Excel 匯出

`utils/export.ts` 摘要文字也採新命名。匯出的 PDF / Excel 視覺仍是現有元件截圖（PDF）或 sheet（Excel），跟著元件變化自動更新。

### D7 — Migration 順序

1. **Phase 1**：建 `lib/labels.ts` 集中表
2. **Phase 2**：EV / VaR / Hurst / D / MC 個股頁五個 block 改 ScaleCard 結構（加底層、改命名）
3. **Phase 3**：PortfolioPerformanceBlock 8 卡（績效頁 + 組合頁共用）
4. **Phase 4**：訊息檔 diagnosis / recommendations 字串替換 + 測試更新
5. **Phase 5**：ComparePage cmp-table headers 命名替換
6. **Phase 6**：utils/export 摘要文字
7. **Phase 7**：驗證（tsc / vitest / build / 瀏覽器）+ 部署

## Risks / Trade-offs

- **「賠率」→「損益比」搜尋範圍廣**：散落 20+ 處（diagnosis 文案、recommendations、UI label、PDF、test 斷言）— 採全域搜尋逐處替換
- **底層值佔位**：每張卡多 1 行，整體高度 +20px 左右 — 可接受
- **第 3 卡（reference）的底層**：需弱化字級，避免搶占主數字焦點
- **VaR 兩段（95 / 99）底層幾乎一樣**：「240 筆日報酬第 5/1 百分位」 — 重複但仍保留以維持結構一致
- **Compare 頁 cmp-table headers 命名變了**：使用者習慣可能要適應
