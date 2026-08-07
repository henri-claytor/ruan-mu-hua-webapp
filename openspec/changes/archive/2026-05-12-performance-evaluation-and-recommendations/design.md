# Design: 績效評估雙軸與重點建議區

## Context

PDF 範本第一節「整體績效評估」採「優勢 / 風險」雙軸結構，第三節「重點建議」獨立成編號式區塊。Change A 已完成結構層對齊（5 象限、8 卡、圖例、摘要），本 change 補齊評估與建議邏輯。

兩者的差異：
- **DiagnosisPanel（評估）**：基於規則引擎，產生「事實觀察 + 建議行動」，分優勢與風險呈現
- **RecommendationPanel（建議）**：聚合 diagnoses 中具行動性的條目，編號化、加入特定個股名稱，類似 PDF 第三節

## Goals / Non-Goals

**Goals:**
- DiagnosisLevel 擴為 5 個（加 advantage）
- 6 條組合層級「優勢」規則
- DiagnosisPanel 改為兩欄結構（優勢 / 風險）
- 新建 RecommendationPanel 編號式建議區塊
- 既有規則訊息檢視，確保都含具體數字

**Non-Goals:**
- 不改 5 象限分類（Change A 已完成）
- 不改 8 主指標卡
- 不動個股 / 組合分析頁的 ActionGuide
- 不改既有 12 條負面規則邏輯（只擴充訊息精準度）

## Decisions

### D1 — 「優勢」型診斷規則設計（6 條）

**決策**：

| ID | 條件 | level | title | message 範本 | advice |
|----|------|-------|-------|-------------|--------|
| `adv-profit-factor-strong` | profitFactor > 4 | advantage | 獲利因子非常強勢 | 「獲利因子 {x}x 處於「非常強勢」區間（>4.0），每虧損 1 元可從其他交易賺回 {x} 元」 | 「保持目前策略結構與資金管理」 |
| `adv-balanced-win-payoff` | winRate ≥ 0.7 且 payoffRatio ≥ 1.5 | advantage | 勝率與損益比均衡 | 「勝率 {w}% 配合損益比 {p}，既能頻繁獲利、平均每次贏的幅度也超過輸的幅度」 | 「策略結構健康，可持續執行」 |
| `adv-high-win-rate` | winRate ≥ 0.8（且未觸發 balanced）| advantage | 勝率極高 | 「勝率 {w}% 顯示選股或進場時機掌握精準」 | 「留意是否依賴特定市況，建議測試不同行情下的表現」 |
| `adv-strong-payoff` | payoffRatio ≥ 2.5（且未觸發 balanced）| advantage | 賠率優勢明顯 | 「賠率 {p}x，平均每次贏的幅度顯著超過輸的幅度」 | 「打法品質優秀，可保持」 |
| `adv-positive-ev` | expectedValue > 0 且 nTrades ≥ 10（且未觸發 PF / balanced）| advantage | 期望值為正 | 「每筆平均期望值 {ev} 元，策略結構健康」 | 「持續累積樣本以確認長期穩定」 |
| `adv-low-drawdown` | maxDrawdownPct > −0.05 | advantage | 最大回撤可控 | 「最大回撤僅 {x}%，風險控制良好」 | 「持續維持嚴謹的部位控制」 |

**互斥處理**：`adv-balanced-win-payoff` 觸發時不再觸發 `adv-high-win-rate` / `adv-strong-payoff` / `adv-positive-ev`（後三者是前者的退而求其次）。`adv-profit-factor-strong` 不互斥於其他（獲利因子強勢可獨立成立）。

**理由**：
- 6 條覆蓋了「策略結構」「執行紀律」「風險控制」三大面向
- 門檻參考 PDF 範本與業界共識（PF > 4 = 非常強勢、勝率 > 80% = 極高、回撤 < 5% = 控制良好）
- 訊息含具體數字直接套用 PDF 風格

### D2 — 排序：advantage 排最前

**決策**：

```typescript
const LEVEL_ORDER: Record<DiagnosisLevel, number> = {
  advantage: 0,  // 優勢最前
  alert: 1,
  warning: 2,
  note: 3,
  info: 4,
}
```

**理由**：
- 排序對「優勢」單獨呈現時意義不大（會分到兩欄）
- 但在 Excel 匯出、PDF 匯出時依此順序輸出有助於閱讀
- 既有測試 `orders results by level (alert → ...)` 需更新

### D3 — DiagnosisPanel 兩欄結構

**決策**：左欄「優勢」、右欄「風險與注意事項」。

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <h3>優勢（N 條）</h3>
    {advantages.map(...)}
  </div>
  <div>
    <h3>風險與注意事項（M 條）</h3>
    {risks.map(...)}
  </div>
</div>
```

**邊界**：
- 沒有任何 advantage → 左欄顯示「持續累積交易紀錄以建立優勢視角」
- 沒有任何 risk（含 alert / warning / note / info）→ 右欄顯示「✓ 暫無需要關注的問題」
- 兩邊都空 → 整個 Panel 不渲染（與 trades.length === 0 行為一致）

**手機 layout**：grid-cols-1，上下排列（優勢在上）

### D4 — RecommendationPanel 編號式建議區塊

**決策**：

```jsx
<SectionBlock title="重點建議">
  {recommendations.map((r, i) => (
    <div key={r.id}>
      <span className="number-badge">{i + 1}</span>
      <h4>{r.title}</h4>
      <p>{r.body}</p>
    </div>
  ))}
</SectionBlock>
```

**Recommendation 結構**：

```typescript
interface Recommendation {
  id: string
  title: string        // 短標題（如「強化停損紀律」「改善鴻海操作方式」）
  body: string         // 多行詳細描述（含具體個股、數據、行動建議）
  priority: number     // 排序用（嚴重度）
  scope: 'portfolio' | 'specific-stock'
  stockId?: string
}
```

**產生規則**（`buildRecommendations(diagnoses, stocks, performance): Recommendation[]`）：

聚合策略——同類問題合併：

1. **強化停損紀律**（priority 1）：聚合所有 `stock-all-loss-3plus` 與 `stop-loss-discipline`
   - title：「強化停損紀律」
   - body：「{stocks A, B, C} 是最明顯的停損問題標的。建議設定固定停損線（如進場成本 −8%），達到即出場，避免重複加碼虧損部位。」
2. **改善 {stockName} 操作方式**（priority 2，每股一條）：來自 `stock-low-payoff` 高損益問題股
   - title：「改善 {stockName} 操作方式」
   - body：「{stockName} 賠率 {x} 代表打法本身有問題——平均虧損幅度是獲利的 {y} 倍。若要繼續操作此標的，需調整進出場策略，或縮小部位以控制整體風險。」
3. **檢討 {stockName} 押注管理**（priority 3，每股一條）：來自 `stock-money-management`
   - title：「檢討 {stockName} 押注管理」
   - body：「{stockName} 是「邏輯對但執行錯」的典型案例。賠率 {x} 顯示打法尚可，但獲利因子 {y} 代表虧損筆部位遠大於獲利筆，屬資金管理問題。」
4. **降低組合集中度**（priority 4）：來自 `concentration-risk`
   - title：「降低組合集中度」
   - body：「前兩大標的（{A}、{B}）貢獻近 {N}% 獲利。可考慮在強勢標的達到目標報酬後分批減倉，將資金分散至其他高勝率標的。」
5. **追蹤更多績效指標**（priority 9，固定條目）：補充建議
   - title：「追蹤更多績效指標」
   - body：「建議補充：分產業別分析、加碼行為分析、星期別勝率統計，讓評估更完整。」

**輸出排序**：依 priority 升序。

**邊界**：
- 沒有觸發任何條件 → 仍顯示固定條目「追蹤更多績效指標」
- trades.length === 0 → 不渲染整個 Panel

### D5 — 位置

**決策**：插入在 DiagnosisPanel 之後、StockQuadrantMatrix 之前。

```
頁面結構（紅色 = 本次新增 / 修改）：
1. 標題 + 隱私 banner
2. 資料輸入區
3. 整體 Dashboard
4. ⚠ DiagnosisPanel（雙軸改造）
5. 🆕 RecommendationPanel（編號式建議）
6. 個股矩陣表
7. 績效視覺化
8. 個股 vs 組合對比
9. 原始交易表格
```

**理由**：
- DiagnosisPanel 是事實觀察，RecommendationPanel 是行動建議 → 邏輯順序為「先看事實、再看建議」
- 兩者放矩陣表前是因 PDF 範本順序如此

### D6 — Diagnosis 訊息精準度檢視

**決策**：檢視既有 12 條規則的 message，確保都含具體數字：

| 規則 | 既有訊息 | 強化後（如需）|
|------|---------|---------|
| `concentration-risk` | 「前 2 大標的合計貢獻整體損益的 X.X%」| ✓ 已含數字 |
| `stop-loss-discipline` | 「N 檔全敗標的合計虧損 X 元，佔總損益絕對值 Y%」| ✓ 已含 |
| `low-profit-factor` | 「獲利因子 X < 2.0」| ✓ 已含 |
| `low-payoff` | 「賠率 X < 1.2」| ✓ 已含 |
| `high-frequency` | 「年均約 N 筆」| ✓ 已含 |
| `low-sample` | 「總交易筆數 N 筆 < 30」| ✓ 已含 |
| `stock-all-loss-2` / `3plus` | 「{stockName} N 筆全敗」| ✓ 已含 |
| `stock-low-payoff` | 「{stockName} 賠率 X」| ✓ 已含 |
| `stock-money-management` | 「{stockName} 賠率 X 但 PF Y」| ✓ 已含 |
| `stock-concentration` | 「{stockName} 貢獻整體 X%」| ✓ 已含 |
| `stock-low-sample` | 「{stockName} 交易筆數僅 N 筆」| ✓ 已含 |

**結論**：既有訊息已大致符合 PDF 風格。新增的 6 條優勢規則同樣含具體數字。**不需特別大改既有規則**。

### D7 — Excel 匯出整合

**決策**：`exportXlsx.ts` 的「Sheet 4 診斷建議」自動含 advantage 條目（既有邏輯遍歷所有 diagnoses）。

**新增 Sheet（可選）**：可考慮加 Sheet 5「重點建議」對應 RecommendationPanel 內容。第一版**先不加**，使用者覺得需要再 propose 第三個 change。

### D8 — PDF 匯出整合

**決策**：在 `exportPerformancePdf` 的 sections 列表加入新區塊 id：

```typescript
const sections = [
  { id: 'performance-banner' },
  { id: 'performance-dashboard' },
  { id: 'performance-diagnosis' },
  { id: 'performance-recommendations' },  // 新增
  { id: 'performance-matrix' },
  { id: 'performance-charts' },
  { id: 'performance-trades' },
]
```

由 `PerformancePage` 的 RecommendationPanel 外層 `<div id="performance-recommendations">` 提供。

## Risks / Trade-offs

- **正面 + 負面同時顯示可能讓使用者感到矛盾**：如組合 PF 強但有集中度風險，兩邊都會列 → 接受。這正是真實情況，PDF 範本也是這樣呈現的（「優勢 X」+「風險 Y」並存）
- **RecommendationPanel 與 DiagnosisPanel 內容重複**：兩者都涵蓋同樣的問題 → 緩解：DiagnosisPanel 是「事實觀察 + 1 句建議」，RecommendationPanel 是「聚合 + 多行詳細描述」，可視為「快速掃」與「深入讀」兩種閱讀模式
- **新增 RecommendationPanel 後頁面變更長**：使用者需要更多捲動 → 接受。可在未來加可摺疊容器
- **「追蹤更多績效指標」是固定建議，可能對成熟使用者沒幫助** → 接受。PDF 範本也有此項，作為「下一步擴充」提示
- **優勢規則的門檻可能過寬或過嚴**：例如獲利因子 > 4 對某些策略可能難達標 → 第一版用 PDF 範本的參考值，使用者覺得需要再調整
