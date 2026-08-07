# Design: Analysis Layout & Action Guide

## Context

IndividualPage 目前的分析區塊順序為：EV → VaR → 蒙地卡羅 → Hurst。這個順序以「分析類型」為主，但忽略了資料頻率的邏輯關係：

| 區塊 | 使用資料 |
|------|----------|
| EV | 月報酬 |
| 蒙地卡羅 | 月報酬 |
| VaR | 日報酬（或月報酬 fallback） |
| Hurst | 日報酬（或月報酬 fallback） |

VaR 與 Hurst 的 `freqLabel` 相同（同一個 `returnsForRisk`），但在畫面上被蒙地卡羅隔開，使用者容易誤以為四個分析使用的是同一套資料。

各頁面在計算完成後沒有任何行動指引，使用者需要自行解讀數字意義。

## Goals / Non-Goals

**Goals:**
- 將 IndividualPage 的分析順序改為：EV → 蒙地卡羅（月報酬軌道） → VaR → Hurst（風險頻率軌道）
- 以輕量視覺分隔線標示兩個軌道，附帶頻率說明文字
- 新增 `ActionGuide` 元件，三個分析頁底部各顯示 2–4 條建議

**Non-Goals:**
- 修改 PortfolioPage / ComparePage 的分析區塊順序（兩頁各自結構較簡單，無重排必要）
- 建議行動連結至外部下單功能
- 動態學習或 AI 生成建議（純 rule-based）

## Decisions

### D1 — 分析區塊重排策略

**決策**：只調整 IndividualPage 的渲染順序（將 `<McBlock>` 移至 `<VarBlock>` 之前），並在月報酬軌道結束後插入一個分隔標題。

**理由**：不改變計算邏輯，只改 JSX 順序，改動最小、風險最低。PortfolioPage 和 ComparePage 本身沒有把 Hurst 和 MC 交錯的問題，不需要動。

**替代方案考慮**：
- 用 Tab 切換兩軌道 → 隱藏資訊，使用者容易遺漏 Hurst，拒絕
- 用 Accordion Group 包住兩軌道 → 多一層巢狀，增加操作步驟，拒絕

### D2 — ActionGuide 元件設計

**決策**：新建 `src/components/ActionGuide.tsx`，接受各頁強型別的 props，純 rule-based 產生建議列表。

**介面**：
```tsx
// Individual
type IndividualSignals = {
  ev: number          // EV 值
  evQuadrant: string  // Q1/Q2/Q3/Q4
  varLevel: 'low' | 'mid' | 'high'   // 以 var95 區間判斷
  hurstH: number | null
}

// Portfolio
type PortfolioSignals = {
  ev: number
  varLevel: 'low' | 'mid' | 'high'
  hurstH: number | null
  stockCount: number
}

// Compare
type CompareSignals = {
  evA: number | null; evB: number | null
  varA: number | null; varB: number | null
  hurstA: number | null; hurstB: number | null
  nameA: string; nameB: string
}
```

**建議訊息規則**（範例）：
- EV > 0 && H > 0.6 → 「EV 正值且趨勢持續，可考慮建立多頭倉位」
- EV < 0 → 「期望值為負，建議觀望或縮減部位」
- varLevel === 'high' → 「下行風險偏高（VaR95 超過 10%），建議控管部位大小」
- H < 0.4 → 「Hurst < 0.4 顯示均值回歸，不宜追高」

**理由**：Rule-based 可完整受測、可審計，不引入 LLM 依賴。訊息文字集中在元件內管理，未來調整方便。

**替代方案考慮**：
- 在各 Page 直接寫 if/else inline → 邏輯散落三個 Page，維護成本高，拒絕

### D3 — VaR 等級判斷標準

**決策**：以 `|var95|`（95% VaR 的絕對值）作為風險等級依據：
- `low`：< 5%
- `mid`：5%–10%
- `high`：> 10%

**理由**：VaR95 代表最壞 5% 情境的單期損失，是業界常用的風險指標。10% 為月報酬的高波動閾值（對應年化約 35%），日報酬下降至 2% 為 high。實作上需根據 `freqLabel` 是否為日頻調整門檻（未來優化），此版本以固定門檻起步。

## Risks / Trade-offs

- **Rule-based 建議過於簡化**：複雜市場情境下，單一規則可能給出片面建議。緩解：建議框標題明確寫「參考建議，非投資意見」，並附免責說明。
- **VaR 等級門檻固定**：日頻 vs 月頻的 VaR 數值量級不同，同一門檻不完全適用。緩解：此版本標注已知限制，下一階段可傳入 freqType 動態調整門檻。
- **ComparePage 建議依賴兩股同時有資料**：若只選了一股，建議欄位不顯示（無資料不比較）。這是預期行為。
