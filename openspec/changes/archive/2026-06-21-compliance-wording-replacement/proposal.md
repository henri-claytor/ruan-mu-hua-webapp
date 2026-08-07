## Why

老師將本系統用於課程教學。台灣金管會對投資顧問業有嚴格規範（投信投顧法第 4 條），未具證券分析師資格者不得對特定有價證券提供「投資建議」。

目前全站約有 70 處「建議 / 推薦 / 應該 / 不宜 / 加碼 / 減倉 / 進出場時機」等用詞，可能被解讀為投資建議。需全面替換為「分析觀察 / 統計上 / 值得檢視」等中性教學語氣，並加上明確的免責聲明。

## What Changes

### 1. 詞彙集中表 `src/lib/wording.ts`（新增）

集中所有「標題類 + 評級標籤」固定詞彙，未來若要還原為原版只需改本表：

- 區塊標題：操作建議 → 分析觀察 等 7 個詞
- Quadrant 評級：「最佳」「避免」→「雙優」「較弱」

### 2. 完整對照表

詳見 `WORDING-DIFF.md`（同目錄）— 列出全站約 70 處的「原 → 改」對照。

### 3. 還原指南

詳見 `REVERT-GUIDE.md`（同目錄）— 未來若要還原原詞，依此指南操作。

### 4. 全站 Footer Disclaimer

4 個分析頁底部 + ActionGuide 既有 footer 強化：

```
⚠ 本系統所有分析皆為統計教學示例，非投資建議，不構成買賣依據。
   投資人應依自身判斷負責。
```

### 5. Advice 句子直接修改

`diagnosis.ts` / `recommendations.ts` / `ActionGuide.tsx` 的長句子直接修改 source，靠 git history + 本 change 的 WORDING-DIFF.md 保留可還原性。

### 6. quadrant 字面量改動範圍

`'高賠率正期望值（最佳）'` → `'高賠率正期望值（雙優）'`
`'低賠率負期望值（避免）'` → `'低賠率負期望值（較弱）'`

影響：`ev.ts` type、`QuadrantBadge.tsx`、`ev.test.ts`、`IndividualPage.tsx` fallback、其他使用該 type 的位置

## Capabilities

### Modified Capabilities

- `design-system-tokens`：新增詞彙集中表 `wording.ts` 與 footer disclaimer 規範
- `result-first-layout`：4 頁底部加合規 disclaimer

## Impact

- **影響檔案（約 12 個）**：
  - `src/lib/wording.ts`（新）
  - `src/lib/ev.ts` + `src/lib/ev.test.ts`（quadrant 字面量）
  - `src/lib/diagnosis.ts`（14 條 advice）
  - `src/lib/recommendations.ts`（5 條 body/title）
  - `src/lib/exportXlsx.ts`（sheet 名）
  - `src/components/ActionGuide.tsx`（11 條 + title + footer）
  - `src/components/QuadrantBadge.tsx`（label + 副標）
  - `src/components/trade/RecommendationPanel.tsx`（title + 副標）
  - `src/components/trade/DiagnosisPanel.tsx`（title）
  - `src/components/trade/MyTradeHistoryBlock.tsx`（2 條）
  - `src/pages/IndividualPage.tsx` / `PortfolioPage.tsx` / `ComparePage.tsx` / `PerformancePage.tsx`（disclaimer + 註解）
- **不影響**：
  - 計算邏輯
  - 資料結構
  - 既有資料

## Risks / Trade-offs

- **type 字面量改動**：影響跨檔案斷言；tests 需同步更新
- **句子語氣中性化後可能略顯生硬**：但合規優先於風格
- **無法完全消除合規風險**：仍應確保使用者主動承擔判斷責任 + footer 明確聲明
