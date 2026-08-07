# Design: Multi-scale EV（年化版）

## Context

現行 `calcEV(monthly)` 使用全部月報酬計算單一 EV 值（月平均報酬期望）。問題：

- **時間尺度單一**：僅反映「全期長期平均」，無法看出近期變化
- **頻率單一**：只能用月頻，最短粒度是 1 個月
- **無法偵測 regime change**：如果某股票過去 5 年表現好但近 3 個月開始走弱，單一 EV 看不出來

multi-scale Hurst 已用「同頻率不同窗口」處理過類似問題（60/120/240 日），但因為 EV 的「短期」可以有意義到 60 個交易日（3 個月），用日頻能讓「短期」有更高的時間解析度。

**頻率混用的挑戰**：日頻 EV ≈ 0.02%/天 vs 月頻 EV ≈ 0.5%/月，兩者數量級差 30+ 倍，無法直接比較。**解法是年化**：把所有 EV 換算到「假設這個 EV 持續延續一年」的年化複利報酬。

## Goals / Non-Goals

**Goals:**
- 提供三尺度年化 EV（短期日頻 60 / 中期月頻 36 / 長期月頻全部）
- 三者數量級對齊到「年化報酬 %」可直接比較
- 偵測短期 vs 長期的 divergence，給出動能變化訊號
- UI 與 multi-scale Hurst 一致（Hero 列 + 三卡片 + 狀態橫幅）
- 不改變既有 `calcEV()` 介面，向後兼容

**Non-Goals:**
- 不對 winRate / Avg Gain / Avg Loss / actualOdds 做年化（這些是「每期」指標，年化沒意義；保留各自尺度的原始值）
- 不引入第三方統計套件
- 不對 PortfolioPage / ComparePage 套用（先在 IndividualPage 驗證）
- 不改長期 EV 的計算方式（仍是月頻，僅多加年化轉換）

## Decisions

### D1 — 窗口尺寸選擇

**決策**：

| 尺度 | 資料 | 窗口 | 對應期間 | 最少需求 |
|------|------|------|----------|----------|
| 短期 | 日報酬 | 最近 60 筆 | ≈3 個月（一季） | 60 筆日報酬 |
| 中期 | 月報酬 | 最近 36 筆 | 3 年 | 36 筆月報酬 |
| 長期 | 月報酬 | 全部 | 5–10 年 | 60 筆月報酬 |

**理由**：
- 短期 60 個交易日 ≈ 1 季，是台股「季報追蹤」的自然時間單位
- 中期 36 月 = 3 年，涵蓋一個經濟循環的中段
- 長期下限 60 月（5 年）才有統計穩定性
- 短期用日頻（而非月頻 12 筆）：12 筆月報酬 EV 樣本太小，雜訊大；60 筆日頻雖更短期但樣本足夠

**替代方案考慮**：
- 短期用月頻 12 筆（1 年）：避免年化轉換複雜度，但樣本只有 12 筆，EV 點估計不穩定，拒絕
- 短期用日頻 252 筆（1 年）：與「短期」語意違背，拒絕
- 中期用 24 月：太短與長期重疊度高，拒絕

### D2 — 年化轉換公式

**決策**：

| 尺度 | 年化公式 |
|------|----------|
| 短期（日頻）| `EV_annual = (1 + EV_daily)^252 − 1` |
| 中期（月頻）| `EV_annual = (1 + EV_monthly)^12 − 1` |
| 長期（月頻）| `EV_annual = (1 + EV_monthly)^12 − 1` |

`EV_daily` / `EV_monthly` 即既有 `calcEV()` 的輸出 `ev` 欄位（單期期望值）。

**為什麼用複利年化（而非簡單乘法）**：
- 簡單乘法 `EV × N` 假設報酬獨立加總，忽略複利
- 複利年化反映實際投資再投入的累積效應
- 學術金融的標準做法

**邊界處理**：
- `EV ≤ −1`（單期虧損 100% 以上）：理論上不可能；防禦性檢查若發生則 clip 為 −0.99 避免 NaN
- `EV` 為 NaN：上游 `calcEV` 已過濾，不再二次防護

### D3 — Divergence 判斷規則

**決策**：類比 Hurst divergence 邏輯，但門檻與分界線適用 EV 語境：

| 狀態 | 條件 | 含義 |
|------|------|------|
| `stable` | `|annual_short − annual_long| ≤ 0.05`（5%）| 三尺度年化 EV 一致 |
| `short-deteriorating` | `annual_short < annual_long − 0.05` 且 `annual_short < 0 ≤ annual_long` | 短期轉負、長期仍正 → 動能轉弱 |
| `short-improving` | `annual_short > annual_long + 0.05` 且 `annual_short > 0 ≥ annual_long` | 短期轉正、長期仍負 → 動能轉強 |
| `mixed` | 其他差距 > 0.05 但未跨越 0 的情況 | 有差距但方向一致 |

**理由**：
- 0.05（5% 年化）是合理門檻：日頻 60 筆下 EV 標準誤約 1–2%，年化後約 5–10%；5% 差距具備統計意義
- 0% 跨越是 EV 語境的關鍵分界線（賺/虧）
- 四個狀態與 Hurst divergence 對稱，使用者學一次即可套用

**替代方案考慮**：
- 用「相對差異」（短/長 比例）而非絕對差距：在 EV 接近 0 時不穩定，拒絕
- 用統計顯著性檢定：計算成本高且難解釋，拒絕

### D4 — `MultiScaleEVResult` 介面設計

**決策**：

```typescript
export type EVDivergence =
  | 'stable'
  | 'short-improving'
  | 'short-deteriorating'
  | 'mixed'

export interface ScaleEV {
  ev: EVResult           // 既有 EVResult，內部 ev 為單期值
  evAnnual: number       // 年化後 EV
  windowSize: number     // 此尺度使用的資料筆數
  freq: 'daily' | 'monthly'
}

export interface MultiScaleEVResult {
  short:  ScaleEV | null  // 60 日窗口（資料不足回傳 null）
  medium: ScaleEV | null  // 36 月窗口
  long:   ScaleEV         // 全部月報酬（保證有，否則整個函式回傳 null）
  divergence: EVDivergence
}

export function calcMultiScaleEV(
  monthly: number[],
  daily: number[]
): MultiScaleEVResult | null
```

**邊界**：
- `monthly.length < 60` → 整個函式回傳 `null`（連長期都算不出）
- `daily.length < 60` → `short` 為 null
- `monthly.length < 36` → `medium` 為 null
- divergence 計算時若 `short` 為 null → 退化為 `stable`

### D5 — UI 呈現策略

**決策**：完全模仿 `MultiScaleHurstBlock`，建立 `MultiScaleEVBlock` 取代既有 `EVBlock`：

```
┌──────────────────────────────────────────────────┐
│ 期望報酬與賠率優勢                              │
│  EV 期望值多尺度分析（短/中/長）                │
├──────────────────────────────────────────────────┤
│  [狀態判讀橫幅]                                  │
│  ⚠ 短期動能轉弱：短期年化 EV 顯著低於長期       │
├──────────────────────────────────────────────────┤
│  [短期 3個月]   [中期 3年]   [長期 全期]        │
│   年化 −12.4%    年化 +5.8%   年化 +8.1%        │
│   日頻 60 筆     月頻 36 筆   月頻 120 筆       │
│   （高賠率負）   （低賠率正）  （高賠率正）     │
├──────────────────────────────────────────────────┤
│  象限徽章（large）：依長期 quadrant              │
│  賠率優勢：依長期 actualOdds vs breakEvenOdds   │
├──────────────────────────────────────────────────┤
│  ▶ 展開計算步驟（顯示三組單期 EV → 年化轉換）   │
└──────────────────────────────────────────────────┘
```

**理由**：
- Hero 列以「長期」為主結論（最穩定的長期視角）
- 三卡片並列顯示三尺度年化 EV + 對應 quadrant
- 短期卡片下方加「樣本較小」提示
- 計算步驟區塊顯示「單期 EV → 年化」轉換過程

### D6 — 子指標的處理（winRate / Avg Gain / 賠率優勢）

**決策**：

| 指標 | 處理方式 |
|------|----------|
| EV | 各尺度都做年化 |
| winRate / lossRate | 不年化，但顯示時標注「該尺度勝率」 |
| Avg Gain / Avg Loss | 不年化，但因為單位是「每期平均」，日頻和月頻數量級不同 → **僅顯示在計算步驟中**，不放主畫面 |
| actualOdds | 不年化（是比例，年化後不變）|
| breakEvenOdds | 不年化（是比例）|
| quadrant | 各尺度依其原始 EV + actualOdds 判斷 |

**理由**：
- 主畫面只放可比較的「年化 EV」+「quadrant」+「賠率優勢」
- 「每期平均盈虧」放在計算步驟，避免日頻 0.02% vs 月頻 1% 的數量級誤導

### D7 — ActionGuide 整合

**決策**：在 `buildIndividualGuide` 的 `IndividualSignals` 新增：

```typescript
hurstDivergence?: Divergence
evDivergence?: EVDivergence    // 新增
hurstH?: number | null
evShortAnnual?: number          // 新增（短期年化 EV）
```

新建議規則：
- `evDivergence === 'short-deteriorating'`：「⚠ 短期年化 EV 顯著低於長期，近期表現轉弱，注意停損」
- `evDivergence === 'short-improving'`：「⚠ 短期年化 EV 顯著高於長期，近期動能轉強」

原本「Hurst 解讀用短期 H」的規則保留不變。

### D8 — 報酬率色彩與符號慣例（台股「紅漲綠跌」）

**決策**：所有「報酬率」顯示位置採用台股慣例：
- 正報酬 → 紅色 + 顯示 `+` 號（如 `+0.47%`）
- 負報酬 → 綠色 + 顯示 `−` 號（如 `−5.59%`）
- 0 → 中性色（`default`）+ `0.00%`（無號）

**實作方式**：兩個 utility 函式集中處理：
```typescript
// 永遠帶正負號的百分比格式化
export function fmtPct(n: number, digits = 2): string {
  if (n === 0) return `0.${'0'.repeat(digits)}%`
  const sign = n > 0 ? '+' : '−'
  return `${sign}${(Math.abs(n) * 100).toFixed(digits)}%`
}

// 依報酬正負回傳 ResultCard 的 color prop
export function colorByReturn(n: number): 'red' | 'green' | 'default' {
  if (n > 0) return 'red'
  if (n < 0) return 'green'
  return 'default'
}
```

**適用位置**：
- 期望值 EV（單期 + 年化）
- Avg Gain / Avg Loss（注意 Avg Loss 既有實作為「絕對值」，需在顯示時補回負號）
- VaR 95% / VaR 99%（既有為負值，符號自然帶出）
- 報酬率相關副標數值

**不適用位置**（保留既有色彩語意）：
- 勝率 / 敗率（機率，非報酬率）
- Hurst H 值（無方向意義）
- MC 金額（萬）
- 風險等級徽章 low / mid / high（警示語意：高風險仍紅、低風險仍綠）
- 圖表填色（FanChart / VarHistogram / HurstLineChart）

**Avg Loss 處理細節**：既有 `EVResult.avgLoss` 是 `Math.abs(average(losses))` 的「正值」（虧損絕對值）。顯示時要：
- 數字：`fmtPct(-avgLoss)` 帶回負號 → `−5.59%`
- 顏色：`colorByReturn(-avgLoss)` → green

**理由**：
- 台股使用者習慣「紅漲綠跌」，與西方相反；原本「紅 = 警告」的語意在報酬率語境下會誤導
- 集中在兩個 utility 函式中，未來換主題只需改函式不需改各 page
- 顯式正負號（含 `+`）強化「方向」訊號，比單看顏色更明確

**Trade-off**：第一次切換可能讓習慣西方慣例的使用者短暫不適應 → 接受（目標族群為台股投資者）

## Risks / Trade-offs

- **年化假設過於樂觀/悲觀**：年化後的數字假設「該期表現持續延續一年」，極端值會被放大。例如月 EV = 5% 年化後 = 79.6%（複利），看起來不切實際 → 緩解：在 UI 上明確標注「年化」，並在副標附註「假設報酬持續一年的複利推估」
- **短期 60 日樣本標準誤大**：年化後誤差也會放大 → 緩解：短期卡片下方顯示「樣本較小，年化誤差較大」提示
- **與長期 EV 直觀不一致**：使用者習慣「月 EV = 0.5%」，現在主畫面變成「年化 6.2%」 → 緩解：副標保留原始月 EV，計算步驟詳細展示換算過程
- **PortfolioPage 不同步處理**：個股 / 組合兩頁體驗不一致 → 接受。組合頁的「短期日報酬」要對齊（所有股票都要日頻），實作門檻高，先個股驗證成功再考慮
- **月報酬不足 60 筆的個股無法使用**：實際上既有 EV 已要求 ≥ 10 筆，新版 60 筆會更嚴格 → 緩解：月報酬 < 60 筆時整個多尺度回傳 null，畫面 fallback 顯示「月報酬資料不足 5 年，無法使用多尺度 EV」說明列
