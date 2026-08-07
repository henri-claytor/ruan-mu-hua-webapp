# 還原指南

> 若未來合規環境改變、或產品定位轉為「進階使用者工具」（明確標示非教學用途），可依本指南還原原始用詞。
>
> Change：`compliance-wording-replacement`（2026-05-20）

---

## 還原難度分級

### 🟢 易（5 分鐘內，僅改 1 個檔案）

**步驟**：編輯 `src/lib/wording.ts`，把所有值還原為註解中的「原:」值。

可一鍵還原的詞：
- 區塊標題（操作建議、重點建議、自動診斷與建議、短線推薦、長線推薦）
- Excel sheet 名（診斷建議）
- Quadrant 評級註記（最佳、避免、最佳評級、避免操作）

### 🟡 中（30 分鐘，多檔案編輯）

**步驟**：依 `WORDING-DIFF.md` 對照表，逐處修改 source。

需修改的句子：
- `ActionGuide.tsx`：11 條 advice items
- `diagnosis.ts`：14 條 advice
- `recommendations.ts`：4-5 條 body / title
- `MyTradeHistoryBlock.tsx`：2 條判讀句

### 🔴 難（涉及 type 字面量 + 測試）

**步驟**：

1. `ev.ts`：恢復 type 與 quadrant 賦值
   - `'高賠率正期望值（雙優）'` → `'高賠率正期望值（最佳）'`
   - `'低賠率負期望值（較弱）'` → `'低賠率負期望值（避免）'`
2. `ev.test.ts`：對應斷言還原
3. `QuadrantBadge.tsx`：key + line/sub label
4. `IndividualPage.tsx:307`：fallback default 還原

### Footer Disclaimer 移除

若決定移除：
- `ActionGuide.tsx:217` 還原為原文字
- `IndividualPage.tsx` / `PortfolioPage.tsx` / `ComparePage.tsx` / `PerformancePage.tsx`：移除底部 footer 區塊

---

## 完整還原步驟（極端情境）

若要 100% 還原所有改動：

```bash
# 1. Git revert 整個 commit
git log --oneline | grep compliance-wording
git revert <commit-hash>

# 2. 或者用 OpenSpec change 對照表手動還原
# 讀取：
openspec/changes/archive/YYYY-MM-DD-compliance-wording-replacement/WORDING-DIFF.md
# 依 H、I、J 區之外的所有對照表，「改」→「原」逐項替換
```

---

## 部分還原（建議做法）

若只想還原**部分**詞彙（例如保留 footer disclaimer 但還原「分析觀察」→「操作建議」）：

### 範例：僅還原標題類

1. 編輯 `src/lib/wording.ts`：
```typescript
export const WORDING = {
  actionGuideTitle:     '操作建議',    // 改回原值
  recommendationTitle:  '重點建議',    // 改回原值
  // ...
}
```
2. 不動 advice 句子、不動 disclaimer
3. `npm run build` + 部署

### 範例：保留標題但放寬 advice 語氣

1. 不動 `wording.ts`
2. 修改 `diagnosis.ts` / `recommendations.ts` 中的 advice 句子（依 WORDING-DIFF.md 對照）
3. 保留 footer 不動

---

## 注意事項

1. **質詢風險評估**：還原前評估金管會規範是否仍適用此產品。
2. **type 字面量改動需小心**：影響 tests，需同步更新測試斷言。
3. **資料相容性**：既有匯出 CSV / Excel 含舊 quadrant 字串時，若 type 改回，舊資料的 quadrant 值仍是新版（不會自動更新）— 需考慮資料 migration。
4. **保留 disclaimer**：即使還原其他詞彙，建議保留 footer disclaimer 作為基本免責。

---

## 結語

本系統的合規策略採「**集中表 + 完整對照**」雙保險，
未來可彈性調整。
