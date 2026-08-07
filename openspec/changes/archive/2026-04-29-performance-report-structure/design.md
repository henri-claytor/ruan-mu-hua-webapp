# Design: 績效分析結構對齊報告範本

## Context

使用者提供的 PDF 範本展現一份成熟的績效報告該有的樣貌——清晰分類、主指標一字排開、診斷文字含具體數字。對照之下既有實作有結構性落差。本 change 處理「分類 + 主指標 + 圖例 + 摘要文字」四件事，下一個 change 處理「優勢 / 風險評估 + 重點建議區」。

## Goals / Non-Goals

**Goals:**
- 5 象限分類涵蓋「單向紀錄」邊界情境
- 主指標卡 8 張一目了然
- 矩陣表上方有圖例幫助理解分類
- 個股表診斷欄為具體文字摘要（含金額 / 報酬率）
- 既有 Q1–Q4 規則與測試不變動

**Non-Goals:**
- 不做「優勢」型診斷規則（→ Change B）
- 不重構 DiagnosisPanel（→ Change B）
- 不新增「重點建議」獨立區塊（→ Change B）
- 不改 ActionGuide、不動其他頁

## Decisions

### D1 — 「單向紀錄」第 5 象限的判定優先順序

**決策**：在 `classifyPerformanceQuadrant` 之前先判斷「單向紀錄」：

```typescript
export function classifyPerformanceQuadrant(
  payoffRatio: number,
  profitFactor: number,
  nWins?: number,
  nLosses?: number,
): PerformanceQuadrant {
  // 優先判斷「單向紀錄」：全勝（nLosses === 0）或全敗（nWins === 0）
  if (nWins !== undefined && nLosses !== undefined) {
    if (nLosses === 0 && nWins > 0) return '單向紀錄（全勝或全敗）'
    if (nWins === 0 && nLosses > 0) return '單向紀錄（全勝或全敗）'
  }
  // ... 既有 4 象限邏輯
}
```

**理由**：
- PDF 把全勝/全敗統一歸類為「單向紀錄」，因為兩個指標都無法有意義計算
- 沒有 nWins/nLosses 時退化為既有邏輯（向後相容）

**呼叫端**：
- `calcStockStats` 中呼叫 `classifyPerformanceQuadrant(payoff, pf, nWins, nLosses)`
- `calcPortfolioPerformance` 中同樣（雖然加權組合很少全勝，仍處理）

### D2 — 單向紀錄的 UI 顯示

**決策**：

| 欄位 | 顯示 |
|------|------|
| 賠率 | `—`（不顯示 ∞ 或 0）|
| 獲利因子 | `—` |
| 進度條 | 不顯示（無數字）|
| 4 象限徽章 | 藍色 + ClipboardCheck icon |
| compact 簡短版 | 「單向紀錄」|
| 診斷摘要欄 | 「N 筆全勝，均報酬 X%」或「N 筆全敗，平均虧損 X%」|

**理由**：
- PDF 範本明確顯示「—」，使用者直接理解「兩指標不適用」
- 配色用藍（與 Q1–Q4 區隔，且不暗示優劣）

### D3 — 主指標卡 8 張佈局

**決策**：兩列各 4 卡（桌機），手機 2x4：

```
桌機 grid-cols-4 + 兩列：
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 總實現損益    │ 整體報酬率   │ 整體勝率     │ 獲利因子     │
│ (Hero)      │ (含年化)    │             │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ 平均持有天數  │ 勝場均報酬   │ 敗場均虧損   │ 損益比（賠率）│
└─────────────┴─────────────┴─────────────┴─────────────┘

細部統計 inline 行（保留）：
總投入 / 最大單筆獲利 / 最大單筆虧損 / 最大回撤 / 最長持有 / 最短持有
```

**「總實現損益」維持 Hero 樣式**（emphasis="hero" 大字 + 紅漲綠跌），其他 7 張為 normal。

**理由**：
- 8 張一字排開符合 PDF 視覺密度
- Hero 列保留是延續整個 app 的層次邏輯（重要結論優先）
- 細部統計避免重覆顯示（已上主層的不再列在 inline）

**Hero 旁的 Quadrant Badge**：仍保留 size="large"，與既有設計一致。

### D4 — QuadrantLegend 元件

**決策**：新元件 `QuadrantLegend`，顯示在 StockQuadrantMatrix 內部、表格上方：

```
個股分析（賠率 × 獲利因子矩陣）
共 N 檔個股 · 4 象限篩選 / 排序

┌────────────────────────┬────────────────────────┐
│ 打法好・結果好（綠）    │ 打法差・結果好（藍）   │
│ 賠率高 + 獲利因子高     │ 賠率低 + 獲利因子高    │
│ 策略與執行雙優         │ 靠資金或勝率撐場       │
├────────────────────────┼────────────────────────┤
│ 打法好・結果差（橘）   │ 打法差・結果差（紅）   │
│ 賠率高 + 獲利因子低     │ 兩者皆低或全敗        │
│ 資金管理需改善         │ 全面檢討              │
└────────────────────────┴────────────────────────┘
┌────────────────────────────────────────────────┐
│ 單向紀錄（藍）                                  │
│ 全勝或全敗，無法同時計算兩項指標                 │
└────────────────────────────────────────────────┘

[全部] [Q1] [Q2] [Q3] [Q4] [單向]   ← 篩選 chips（含新增 Q5）

[個股表...]
```

**理由**：
- 表格前先教育使用者四象限的概念
- 圖例配色與徽章一致
- 單向紀錄獨佔下方，避免擠壓既有 4 格

### D5 — 診斷摘要文字產生規則

**決策**：新增 `buildStockDiagSummary(stats: StockStats): string` 在 `src/lib/diagnosis.ts`：

```typescript
export function buildStockDiagSummary(s: StockStats): string {
  // 全敗
  if (s.nWins === 0 && s.nLosses >= 3) {
    return `${s.nTrades} 筆全敗，平均虧損 ${(s.avgLossReturnRate * 100).toFixed(1)}%，停損紀律需改善`
  }
  if (s.nWins === 0 && s.nLosses === 2) {
    return `${s.nTrades} 筆全敗，疑似未停損`
  }

  // 全勝
  if (s.nLosses === 0 && s.nWins >= 5) {
    const avgWin = s.avgWinReturnRate * 100
    let efficiency = ''
    if (avgWin < 10) efficiency = '，屬薄利多筆型'
    else if (avgWin < 15) efficiency = ''
    else if (avgWin > 25) efficiency = '，高報酬選股精準'
    if (s.avgHoldingDays < 15) efficiency += '，短週期高效率'
    return `${s.nTrades} 筆全勝，均報酬 ${avgWin.toFixed(1)}%${efficiency}`
  }
  if (s.nLosses === 0 && s.nWins < 5) {
    return `${s.nTrades} 筆全勝，樣本少參考性有限`
  }

  // 賠率問題
  if (isFinite(s.payoffRatio) && s.payoffRatio < 0.8) {
    return `賠率 ${s.payoffRatio.toFixed(2)} 偏低，靠勝率撐場，結構脆弱`
  }
  // 資金管理問題
  if (s.payoffRatio >= 1.5 && isFinite(s.profitFactor) && s.profitFactor < 1.0) {
    return `邏輯對（賠率 ${s.payoffRatio.toFixed(2)}）但押注管理有問題（PF ${s.profitFactor.toFixed(2)}）`
  }
  // 集中度高
  if (Math.abs(s.pnlContribution) > 0.2) {
    const pct = (s.pnlContribution * 100).toFixed(1)
    return `貢獻整體 ${pct}%，集中度高`
  }
  // 雙優（高賠率高 PF）
  if (s.payoffRatio >= 1.5 && s.profitFactor >= 2.0 && isFinite(s.payoffRatio) && isFinite(s.profitFactor)) {
    return `打法與結果雙優（賠率 ${s.payoffRatio.toFixed(2)}、PF ${s.profitFactor.toFixed(1)}）`
  }
  // 樣本不足
  if (s.nTrades < 5) {
    return `${s.nTrades} 筆，樣本少需更多紀錄`
  }
  // 預設
  return `${s.nTrades} 筆，勝率 ${(s.winRate * 100).toFixed(0)}%，均報酬 ${(s.avgWinReturnRate * 100).toFixed(1)}%`
}
```

**理由**：
- 規則優先順序：全敗 → 全勝 → 賠率 → 資金管理 → 集中度 → 雙優 → 樣本不足 → 預設
- 每條規則產生具體含數字的訊息
- 第一條符合的就回傳（不會多重）
- 模仿 PDF 範本的「診斷摘要」欄文字風格

### D6 — 矩陣表「診斷」欄取代邏輯

**決策**：保留 `diagnoses` prop 傳遞（供 tooltip 用），但欄位顯示改為 `buildStockDiagSummary(stockStats)` 文字。

```jsx
<td className="px-3 py-2 text-caption text-dim max-w-md">
  {buildStockDiagSummary(s)}
</td>
```

欄位寬度增加（PDF 範本中診斷摘要欄佔約 30% 表格寬度）。

**Tooltip 增強**（可選）：保留 diagnoses prop，hover 時顯示完整診斷清單（既有行為，不破壞）。

### D7 — 單向紀錄影響其他既有功能的處理

**決策**：

- **StockVsPortfolioComparison**：個股 Hurst 對比仍正常（不受 4 象限影響）；EV 對比同樣
- **buildStockGuide / 個股建議**：暫不變動，沿用既有規則（單向情境本來就會走到對應規則）
- **getOverallVerdict**：不受影響（基於 alignments 陣列計算）
- **既有 Q1 全勝 → 改為單向**：使用者實測時會看到全勝個股從 Q1 變成「單向」，這是正確的，符合 PDF 範本

## Risks / Trade-offs

- **既有測試「assigns negative EV quadrant for all-loss data」可能失效**：全敗應歸單向 → 緩解：更新測試斷言，並新增單向紀錄相關測試
- **新加兩張主指標卡使桌機 grid 從 5 變 4 + 4**：版面要重排 → 接受。8 卡比 5 卡更平衡（5 卡會剩 1 個格沒填）
- **「診斷摘要」文字太長手機可能折行**：max-w-md + 兩行內可接受 → 緩解：預設規則文字控在 25 字內
- **單向紀錄藍色與「Q2 靠重倉」藍色衝突**：兩個都用藍色配色 → 緩解：Q2 改用 indigo 或調整深淺；或單向用 slate（中性灰藍）
- **「單向」變更影響既有 4 象限統計分類圖**：使用者目前看到的 Q1 數量會減少 → 接受。這是正確的分類修正
