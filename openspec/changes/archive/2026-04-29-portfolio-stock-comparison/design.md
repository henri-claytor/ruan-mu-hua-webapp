# Design: 個股 vs 組合對比區塊

## Context

組合頁目前只顯示「加權後」的組合層級指標，但加權數字會掩蓋成分股之間的方向差異——使用者無法回答「拖累者是誰、帶動者是誰」這類歸因問題。

本 change 加上「個股 vs 組合對比」區塊，自動展示三個維度（EV / VaR / Hurst）的個股 vs 組合差異。

## Goals / Non-Goals

**Goals:**
- 三個維度（EV 多尺度 / VaR / Hurst 多尺度）對比子表
- 簡單對比規則（同號 / 同類別 / 風險高低）讓結果一眼可讀
- 對每支股票標示「整體對比結論」（一致 / 半拖累 / 全對立）
- 計算邏輯複用既有 `calcMultiScaleEV`、`calcVaR`、`calcMultiScaleHurst`

**Non-Goals:**
- 不做 MC 對比（單股 MC 推估與組合 MC 比較缺乏物理意義）
- 不做精確「貢獻度」加權計算（只看方向 / 類別，不算金額拉動量）
- 不做產業 / 板塊歸因
- 不在個股頁加類似功能（個股頁有自己的 MyTradeHistoryBlock 處理跨頁邏輯）

## Decisions

### D1 — 對比規則（依用戶 Q3=A：簡單方向比較）

#### EV 對比（每尺度）

```typescript
type EVAlignment = 'aligned' | 'opposed' | 'na'

function compareEV(stockEV: number | null, portfolioEV: number): EVAlignment {
  if (stockEV === null) return 'na'
  // 同號視為 aligned
  if ((stockEV >= 0 && portfolioEV >= 0) || (stockEV < 0 && portfolioEV < 0)) {
    return 'aligned'
  }
  return 'opposed'
}
```

**邊界**：
- 個股或組合 EV 為 0 視為「正方向」（避免 0 邊界問題）
- 個股 multi-scale 該尺度為 null（資料不足）→ 'na'

#### VaR 對比（單一）

```typescript
type VaRComparison = 'higher-risk' | 'lower-risk' | 'similar' | 'na'

function compareVaR(stockVaR: number, portfolioVaR: number): VaRComparison {
  // 比較絕對值，1.1 / 0.9 倍門檻
  const ratio = Math.abs(stockVaR) / Math.abs(portfolioVaR)
  if (ratio > 1.1) return 'higher-risk'
  if (ratio < 0.9) return 'lower-risk'
  return 'similar'
}
```

**邊界**：
- 組合 VaR 為 0 → 退化為 similar
- 個股 VaR 為 0 → 視為 lower-risk

#### Hurst 對比（每尺度，依類別）

```typescript
type HurstCategory = 'trending' | 'random' | 'mean-reverting'

function categorize(h: number): HurstCategory {
  if (h > 0.6) return 'trending'
  if (h < 0.4) return 'mean-reverting'
  return 'random'
}

function compareHurst(stockH: number | null, portfolioH: number): EVAlignment {
  if (stockH === null) return 'na'
  return categorize(stockH) === categorize(portfolioH) ? 'aligned' : 'opposed'
}
```

### D2 — 整體對比結論判斷

對每支股票，依「✓ 比例」判斷整體標籤：

```typescript
function overallLabel(
  alignedCount: number,
  totalEvaluable: number,
  portfolioDirection: 'positive' | 'negative',  // 用於決定 "拖累" vs "帶動" 用詞
): string {
  if (totalEvaluable === 0) return '資料不足'
  const ratio = alignedCount / totalEvaluable
  if (ratio === 1) return '一致'
  if (ratio === 0) return '全對立'
  // 部分對立：依組合方向決定用詞
  if (portfolioDirection === 'positive') {
    return alignedCount >= totalEvaluable / 2 ? '半帶動' : '半對立'
  }
  return alignedCount >= totalEvaluable / 2 ? '半拖累' : '主要對立'
}
```

**簡化版**（first iteration）：用三檔結論
- 全 ✓ → **一致**
- 全 ⚠ → **全對立**
- 混合 → **部分對立**

第一版用簡化版，未來若使用者覺得需要更細的「帶動 vs 拖累」可加。

### D3 — 元件結構

**主元件**：`StockVsPortfolioComparison.tsx`

```jsx
<SectionBlock title="個股 vs 組合對比" subtitle="...">
  <Tabs defaultTab="ev">
    <Tab id="ev">
      <EVComparisonTable stocks={...} portfolio={...} />
    </Tab>
    <Tab id="var">
      <VaRComparisonTable ... />
    </Tab>
    <Tab id="hurst">
      <HurstComparisonTable ... />
    </Tab>
  </Tabs>
</SectionBlock>
```

**理由**：
- Tab 切換比同時顯示 3 表更省垂直空間
- 子表元件獨立，方便個別測試
- 預設 Tab 為 EV（最常看的指標）

**替代方案考慮**：
- 三表上下排列：佔垂直空間，捲動疲勞，拒絕
- 三表並排：手機顯示破版，拒絕

### D4 — 子表元件設計（共用結構）

每個子表結構：

```
┌─────────────────────────────────────────────┐
│ 表頭                                        │
├─────────────────────────────────────────────┤
│ 組合（基準）  數值  數值  數值  (基準)      │ ← 強調列
├─────────────────────────────────────────────┤
│ 股票 1       數值⚠ 數值✓ 數值✓  半拖累     │
│ 股票 2       數值✓ 數值✓ 數值✓  一致       │
│ 股票 3       數值⚠ 數值⚠ 數值⚠  全對立     │
└─────────────────────────────────────────────┘
```

**樣式**：
- 組合列：粗體 + 背景色（`bg-elevated`）
- 個股列：普通樣式
- ✓ 用綠色 / ⚠ 用 amber（這裡視為警示語意，非紅漲綠跌；因為「對立」是中性的方向資訊，不是賺賠）
- 整體對比欄：badge 樣式

**注意配色語意**：
- ✓ 表「同方向 / 一致」→ green
- ⚠ 表「對立 / 不同」→ amber 警示
- 整體對比 badge：「一致」綠、「全對立」紅、「部分對立」amber

### D5 — 計算流程整合到 PortfolioPage

```typescript
// 對每支股票分別計算多尺度 EV / VaR / Hurst
const stockComparisons = useMemo(() => {
  if (!evMulti || !varResult) return []
  return stocks.map((s) => {
    const stockEV = calcMultiScaleEV(s.monthlyReturns, s.dailyReturns)
    const stockVar = s.monthlyReturns.length >= 10
      ? calcVaR(useDailyFreq ? s.dailyReturns : s.monthlyReturns)
      : null
    const stockHurst = s.dailyReturns.length >= 240
      ? calcMultiScaleHurst(s.dailyReturns)
      : null
    return {
      stockId: s.code,
      stockName: s.name,
      weight: s.weight,
      ev: stockEV,
      var: stockVar,
      hurst: stockHurst,
    }
  })
}, [stocks, evMulti, varResult, useDailyFreq])
```

**性能**：每股 ~ 5 個計算（多尺度 EV 含三次 calcEV，hurst 含三次 calcHurst）。10 支股 ≈ 50 個計算 < 50ms，可接受。

### D6 — 位置與顯示條件

**位置**：插入在 `<MultiScaleEVBlock>` 之後、`<VarBlock>` 之前。

**顯示條件**：只有 `evMulti` 與 `varResult` 都存在時才顯示。否則跳過此區塊。

**理由**：對比需要組合自己有 EV 與 VaR 才有意義。如果組合本身月報酬不足、無法多尺度 EV，對比也就無從進行。

### D7 — 整體對比結論顯示策略

**第一版**：用簡單三檔
- ✓ **一致**：所有可評估尺度都同方向
- ⚠ **全對立**：所有可評估尺度都異方向
- ⚠ **部分對立**：混合

未來可細分「帶動 vs 拖累」依組合方向。

## Risks / Trade-offs

- **個股 EV 分析受月報酬筆數限制**：calcMultiScaleEV 需要 monthly ≥ 60。短歷史新股將無 EV → 'na'，整列幾乎全 — → 緩解：整體對比顯示「資料不足」
- **VaR 比較絕對值忽略方向**：VaR 永遠負，比較大小對風險來說 OK；但對「方向」直覺感較弱 → 接受。VaR 本就是風險指標
- **Hurst 三尺度都需要個股日報酬 ≥ 240**：很多新標的會 fallback 為 null → 接受。同個股頁標準
- **Tab 切換可能讓使用者錯過某維度**：預設 EV，但 VaR / Hurst 需要點擊才看到 → 緩解：Tab 標籤旁顯示對比結論摘要（如「VaR 對比 1 拉高 / 1 接近 / 1 降低」），使用者掃過 Tab 即知有什麼差異
- **計算量在大組合（10 支股）下增加**：50 個計算 + tab 切換重渲染 → 用 useMemo 快取，可接受
