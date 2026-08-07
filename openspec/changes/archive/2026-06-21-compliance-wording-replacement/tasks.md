## 1. 集中表與元件

- [x] 1.1 新增 `src/lib/wording.ts`（含 WORDING + COMPLIANCE_FOOTER）
- [x] 1.2 新增 `src/components/ComplianceFooter.tsx`

## 2. Quadrant 字面量改動

- [x] 2.1 `ev.ts` type 與賦值：「最佳」→「雙優」、「避免」→「較弱」
- [x] 2.2 `ev.test.ts` 斷言同步更新
- [x] 2.3 `QuadrantBadge.tsx` 兩個 record key + line/sub label 更新
- [x] 2.4 `IndividualPage.tsx:307` fallback default 改新值

## 3. 標題類引用 wording.ts

- [x] 3.1 `ActionGuide.tsx` title 預設值改用 `WORDING.actionGuideTitle`
- [x] 3.2 `RecommendationPanel.tsx` title + sub 改用 wording
- [x] 3.3 `DiagnosisPanel.tsx` h2 改用 `WORDING.diagnosisTitle`
- [x] 3.4 `ComparePage.tsx` 短線/長線推薦改用 wording
- [x] 3.5 `exportXlsx.ts` sheet 名改用 `WORDING.excelDiagSheet`

## 4. Advice 句子直接修改（依 WORDING-DIFF.md 對照）

- [x] 4.1 `ActionGuide.tsx`：11 條 items + footer 文字
- [x] 4.2 `diagnosis.ts`：14 條 advice
- [x] 4.3 `recommendations.ts`：5 條 title/body
- [x] 4.4 `MyTradeHistoryBlock.tsx`：2 條 compareInsight

## 5. 內部註解 / docstring

- [x] 5.1 `ActionGuide.tsx` docstring「建議行動列表」→「分析觀察列表」
- [x] 5.2 4 個 Page 註解「操作建議 / 重點建議」→「分析觀察 / 重點觀察」
- [x] 5.3 `recommendations.ts` / `diagnosis.ts` / `exportXlsx.ts` docstring 對應改

## 6. Footer 加到 4 個分析頁

- [x] 6.1 `IndividualPage.tsx` 結果區末加 `<ComplianceFooter />`
- [x] 6.2 `PortfolioPage.tsx` 結果區末加
- [x] 6.3 `ComparePage.tsx` 結果區末加
- [x] 6.4 `PerformancePage.tsx` 結果區末加（在 RawTradeTable 之後）

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 通過（含 ev.test.ts quadrant 字面量更新）
- [x] 7.3 `npm run build` 通過
- [x] 7.4 瀏覽器確認 4 個分析頁：
  - 標題都是「分析觀察 / 重點觀察 / 短線統計優勢」等中性詞 ✓
  - Quadrant 顯示「雙優」「較弱」✓
  - 底部出現 disclaimer ✓
  - advice / recommendation 內文無「建議 / 推薦」字眼（僅剩 footer 內「非投資建議」此處為必要免責文字）✓
- [x] 7.5 部署 Vercel
  - Commit: 1cd8dba
  - Production: https://web-app-gamma-fawn.vercel.app
  - Deployment: dpl_5royaDHykZxQZFMBcANtDBM6iQ7E
