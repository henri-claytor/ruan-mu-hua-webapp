# Design: 合規詞彙替換 + Footer Disclaimer

## Context

老師將系統用於課程教學，需避免「投資建議」語氣。本 change 全面替換約 60 處用詞為「分析觀察 / 統計上」中性詞，並加 footer disclaimer。

## Goals / Non-Goals

**Goals:**
- 全站去除「投資建議」語氣
- 用詞集中化方便未來還原
- 完整對照表永久保存（WORDING-DIFF.md）
- Footer disclaimer 明確聲明非投資建議

**Non-Goals:**
- 不改計算邏輯
- 不改資料結構
- 不引入動態切換（合規/進階兩模式）

## Decisions

### D1 — 集中表 vs 直接修改 vs Feature flag

**決策**：採「**集中表 + 直接修改**」混合策略：

| 改動類型 | 策略 |
|---------|------|
| 標題 / chip / 評級註記（固定詞彙）| `src/lib/wording.ts` 集中表 |
| Advice 句子（長且依規則生成）| 直接修改 source + 靠 WORDING-DIFF.md 保留歷史 |
| type 字面量（quadrant）| 直接改 ev.ts type，更新所有引用 |
| Footer disclaimer | 單一 const `COMPLIANCE_FOOTER` |

**理由**：
- 集中表適合「少量、可枚舉、未來可能還原」的固定詞彙
- 長句子放集中表反而難管理
- Feature flag 增加 bundle 與維護複雜度，不採用

### D2 — WORDING-DIFF.md 結構

完整的「原 → 改」對照表存於 change 目錄，封存後仍可查閱。包含：
- A. 標題類（7 處）
- B. Quadrant 字面量（2 處 + 擴散）
- C. ActionGuide（11 條 + footer）
- D. Diagnosis advice（14 條）
- E. Recommendations（5 處）
- F. MyTradeHistory（2 條）
- G. exportXlsx 註解（3 處）
- H. 內部代碼註解（~10 處）
- I. Footer 新增（4 處）
- J. 不動白名單

### D3 — wording.ts 結構

```typescript
export const WORDING = {
  // 區塊標題
  actionGuideTitle:     '分析觀察',         // 原: '操作建議'
  recommendationTitle:  '重點觀察',         // 原: '重點建議'
  recommendationSub:    '自動產生的分析觀察',// 原: '自動產生的具體行動建議'
  diagnosisTitle:       '自動診斷與觀察',   // 原: '自動診斷與建議'
  shortTermVerdict:     '短線統計優勢',     // 原: '短線推薦'
  longTermVerdict:      '長線統計優勢',     // 原: '長線推薦'
  longTermNote:         '長線參考',          // 原: '長線參考'（已是中性，沿用）
  excelDiagSheet:       '診斷觀察',          // 原: '診斷建議'

  // Quadrant 評級註記
  quadrantBestNote:     '雙優',              // 原: '最佳'
  quadrantWorstNote:    '較弱',              // 原: '避免'
  quadrantBestSub:      '雙優評級',          // 原: '最佳評級'
  quadrantWorstSub:     '統計較弱',          // 原: '避免操作'
} as const

export const COMPLIANCE_FOOTER =
  '本系統所有分析皆為統計教學示例，非投資建議，不構成買賣依據。投資人應依自身判斷負責。'
```

### D4 — Quadrant 字面量處理

`'高賠率正期望值（最佳）'` → `'高賠率正期望值（雙優）'`
`'低賠率負期望值（避免）'` → `'低賠率負期望值（較弱）'`

**影響**：
- `ev.ts` Quadrant type 字面量 union 改動
- `ev.test.ts` 測試斷言更新
- `QuadrantBadge.tsx` key（兩個 record）+ line/sub label
- `IndividualPage.tsx:307` fallback default 改新值

### D5 — Footer Disclaimer 元件

```tsx
// src/components/ComplianceFooter.tsx
import { COMPLIANCE_FOOTER } from '../lib/wording'

export default function ComplianceFooter() {
  return (
    <div className="text-caption text-faint border-t border-base pt-3 mt-4 leading-relaxed">
      ⚠ {COMPLIANCE_FOOTER}
    </div>
  )
}
```

加在 4 個分析頁的 results 區塊最底（hasTrades / computed && bothReady / hasResult 條件下）。

### D6 — Migration 順序

1. 建 `wording.ts`（含 COMPLIANCE_FOOTER）
2. 建 `ComplianceFooter.tsx`
3. 改 quadrant 字面量（ev.ts → 擴散）
4. 改各元件 title 使用 wording.ts
5. 改 advice 句子（按 WORDING-DIFF.md）
6. 改 docstring / 註解
7. 4 個分析頁加 ComplianceFooter
8. tests 更新（ev.test.ts）
9. 驗證 + 部署

## Risks / Trade-offs

- **type 字面量改動風險**：tests 必須同步；其他依賴此字面量的位置（如 Excel 匯出、PDF 文字）需檢查
- **句子語氣中性後可能讀起來生硬**：合規優先
- **無法完全消除投資諮詢風險**：仍需配合教學情境使用 + 明確 disclaimer
- **集中表 vs 引用點重構成本**：一次性投入，但未來還原成本降為 0
