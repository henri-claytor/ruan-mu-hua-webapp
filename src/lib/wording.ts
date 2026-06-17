/**
 * 全站使用者面對的詞彙集中表（合規版）
 *
 * 設計目的：為符合金管會規範，將「建議 / 推薦」類詞彙改為「觀察 / 統計」中性詞，
 * 使本系統適用於課程教學情境，不構成投資建議。
 *
 * 未來若要還原為原始詞彙，只需改本表即可，不需動所有引用點。
 *
 * 完整對照表與還原指南：
 *   openspec/changes/archive/2026-05-20-compliance-wording-replacement/
 *     ├── WORDING-DIFF.md   ← 70+ 處原 → 改對照
 *     └── REVERT-GUIDE.md   ← 還原步驟
 */

export const WORDING = {
  // ── 區塊標題 ──────────────────────────────────────────────────────
  actionGuideTitle:    '分析觀察',          // 原: '操作建議'
  recommendationTitle: '重點觀察',          // 原: '重點建議'
  recommendationSub:   '自動產生的分析觀察', // 原: '自動產生的具體行動建議'
  diagnosisTitle:      '自動診斷與觀察',    // 原: '自動診斷與建議'
  shortTermVerdict:    '短線統計優勢',      // 原: '短線推薦'
  longTermVerdict:     '長線統計優勢',      // 原: '長線推薦'
  longTermSubChip:     '長線參考',          // 沿用（原本即中性）
  excelDiagSheet:      '診斷觀察',          // 原: '診斷建議'

  // ── Quadrant 評級註記（顯示用，type 字面量另在 ev.ts）──────────────
  quadrantBestNote:    '雙優',              // 原: '最佳'
  quadrantWorstNote:   '較弱',              // 原: '避免'
  quadrantBestSub:     '雙優評級',          // 原: '最佳評級'
  quadrantWorstSub:    '統計較弱',          // 原: '避免操作'
} as const

/** 合規免責聲明（4 個分析頁底部 + ActionGuide footer 共用） */
export const COMPLIANCE_FOOTER =
  '本系統所有分析皆為統計教學示例，非投資建議，不構成買賣依據。投資人應依自身判斷負責。'
