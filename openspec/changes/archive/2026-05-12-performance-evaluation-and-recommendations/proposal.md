# Proposal: 績效評估雙軸（優勢 / 風險）與重點建議區

## Why

Change A（performance-report-structure）已完成 PDF 範本的結構面對齊（5 象限、8 主指標卡、四象限圖例、診斷摘要文字欄）。但 PDF 範本還有兩個重要的「評估與建議」面向尚未對齊：

1. **PDF 第一節「整體績效評估」採「優勢 / 風險」雙軸結構**：每條評估都有「優勢」或「風險」標籤 + 詳細說明（含具體數字）。目前 `DiagnosisPanel` 只有「警示 / 注意 / 提醒 / 資訊」單軸負面為主，沒有「優勢」評估。使用者看完只感覺到問題、看不到自己做對什麼，缺乏鼓舞性
2. **PDF 第三節「重點建議」獨立成編號式區塊**：5 條編號建議，每條有標題 + 多行描述，部分針對特定個股（如「2. 改善鴻海操作方式」）。目前實作沒有獨立「重點建議」區塊；個股相關建議散落在矩陣表的診斷摘要欄

本 change 補齊這兩塊評估與建議邏輯，讓報告完整對齊 PDF 範本，且整體論述更平衡（看見優勢 + 看見風險 + 具體下一步）。

## What Changes

### 1. 新增「優勢」型診斷 level

```typescript
export type DiagnosisLevel = 'alert' | 'warning' | 'note' | 'info' | 'advantage'
//   advantage（NEW）= 綠色，代表正面成績、值得保持的優點
```

新增 6 條組合層級「優勢」規則：

| ID | 條件 | 訊息範例 |
|----|------|---------|
| `adv-profit-factor-strong` | profitFactor > 4 | 「優勢：獲利因子非常強勢 (5.97x)，處於「非常強勢」區間（>4.0）」 |
| `adv-balanced-win-payoff` | winRate ≥ 0.7 且 payoffRatio ≥ 1.5 | 「優勢：勝率與損益比均衡 (勝率 84.5% / 損益比 1.97)」 |
| `adv-high-win-rate` | winRate ≥ 0.8 | 「優勢：勝率極高 (84.5%)」 |
| `adv-strong-payoff` | payoffRatio ≥ 2.5 | 「優勢：每次贏的幅度顯著超過輸的幅度（賠率 2.5）」 |
| `adv-positive-ev` | expectedValue > 0 且 nTrades ≥ 10 | 「優勢：每筆平均期望值 +X 元，策略結構健康」 |
| `adv-low-drawdown` | maxDrawdownPct > −0.05 | 「優勢：最大回撤僅 X%，風險控制好」 |

### 2. DiagnosisPanel 改為「優勢 / 風險」雙軸結構

```
自動診斷與建議
找到 N 條觀察項目（M 優勢 / X 警示 / Y 注意 / Z 資訊）

┌─────────────── 優勢（綠）─────────────┬─────────── 風險（紅 / 橘 / 灰）──────┐
│ ✓ 獲利因子遠超行業水準                │ 🔴 停損紀律不足                       │
│   獲利因子 5.97x 處於「非常強勢」...   │   3 檔全敗標的合計虧損占 17.6%...    │
│ ✓ 勝率與損益比均衡                    │ 🟡 集中度風險                         │
│   勝率 84.5% 配合損益比 1.97...       │   前 2 大標的合計貢獻 47%...         │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

桌機並排（grid 2 欄），手機 stack。

### 3. 「重點建議」獨立區塊（取代 DiagnosisPanel 的 advice 散落顯示）

新區塊 `RecommendationPanel`，編號式條列，**含特定個股建議**：

```
重點建議

1. 強化停損紀律
   貿聯-KY、AES-KY、健策 三檔是最明顯的停損問題標的。建議設定固定停損線
   （如進場成本 −8%），達到即出場，避免重複加碼虧損部位。

2. 改善鴻海操作方式
   鴻海賠率 0.47 代表打法本身有問題——平均虧損幅度是獲利的兩倍。
   若要繼續操作此標的，需調整進出場策略，或縮小部位以控制整體風險。

3. 降低組合集中度
   前兩大標的（宜鼎、群聯）貢獻近半數獲利。可考慮在強勢標的達到目標報酬後
   分批減倉，將資金分散至其他高勝率標的。

4. 追蹤更多績效指標
   建議補充：分產業別分析、加碼行為分析、星期別勝率統計。
```

**建議內容由規則引擎產生**，含特定個股名稱與數據。

### 4. 訊息模板強化

既有所有 diagnosis 規則的 message 重新檢視，確保都含具體數字（百分比、金額、股票名稱）。

### 5. 區塊位置

```
頁面標題 / 隱私 banner / 資料輸入區 /
1. 整體績效 Dashboard
2. 自動診斷與建議（DiagnosisPanel，含優勢 / 風險雙軸）
3. **重點建議（RecommendationPanel，編號式，NEW）**
4. 個股矩陣表
5. 績效視覺化
6. 個股 vs 組合對比
7. 原始交易表格
```

### 6. 不在範圍內

- 不改 5 象限分類 / 8 主指標卡（Change A 已完成）
- 不動 ActionGuide（個股 / 組合分析頁，與績效分析分離）
- 不做 PDF 匯出邏輯（既有 exportPdf 仍會抓所有 DOM 區塊，自然包含新增區塊）

## Capabilities

### Modified Capabilities
- `diagnosis-engine`：擴 5 個 level（加 `'advantage'`），新增 6 條優勢規則
- `performance-page-layout`：DiagnosisPanel 改雙軸；新增重點建議區塊位置
- `report-export`：PDF / Excel 匯出涵蓋新增區塊

## Impact

- `src/lib/diagnosis.ts`：
  - `DiagnosisLevel` 加 `'advantage'`
  - 新增 6 條 `diagnoseAdvantage(...)` 規則
  - 排序：`advantage` 排在最前（與 alert / warning / note / info 區隔）
- `src/lib/diagnosis.test.ts`：6 個新優勢規則測試
- `src/components/trade/DiagnosisPanel.tsx`：兩欄結構（grid 桌機 2 欄、手機 stack）
- `src/components/trade/RecommendationPanel.tsx`（新）：編號式建議區塊，從 diagnoses 聚合「特定個股建議」+ 通用建議
- `src/lib/recommendations.ts`（新）：`buildRecommendations(diagnoses, stocks, performance): Recommendation[]` 規則引擎
- `src/lib/recommendations.test.ts`（新）：測試
- `src/pages/PerformancePage.tsx`：在 DiagnosisPanel 後插入 `<RecommendationPanel>`
- `src/lib/exportPdf.ts`：sections 列表新增 `performance-recommendations` id
- `src/components/trade/ExportMenu.tsx`：pdfSectionIds 同步新增

無 store / API 異動、無新依賴。

預期工作量：4–5 小時
