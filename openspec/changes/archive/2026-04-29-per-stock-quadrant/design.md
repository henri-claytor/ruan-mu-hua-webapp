# Design: 個股賠率 vs 獲利因子矩陣表

## Context

Change 1 已建立 `Trade` 資料模型與整體層級指標計算 + Dashboard。本 change 把分析從「整體」下鑽到「每一檔股票」，並建立**績效分析頁與個股分析頁之間的雙向連結基礎**（本 change 做單向：績效 → 個股）。

## Goals / Non-Goals

**Goals:**
- 個股層級指標計算：交易筆數、勝率、賠率、獲利因子、總損益、損益貢獻度、4 象限
- 矩陣表 UI：每一檔股票一列，含 4 象限徽章 + 進度條視覺化 + 篩選 + 排序
- 深度連結：點股票 → 自動載入個股分析頁
- 不重複造輪子：4 象限沿用 Change 1 的 `classifyPerformanceQuadrant`、徽章用既有 `QuadrantBadge`

**Non-Goals:**
- 個股時間序列圖（→ Change 3）
- 反向連結（個股頁底部摘要）（→ Change 3）
- 加碼分析（同股多次進場）（→ Change 4 或更後）
- 全敗標的特殊判讀（→ Change 4 診斷引擎）

## Decisions

### D1 — StockStats 資料模型

**決策**：

```typescript
export interface StockStats {
  stockId: string
  stockName: string
  nTrades: number
  nWins: number
  nLosses: number
  winRate: number
  avgWinReturnRate: number
  avgLossReturnRate: number    // 負值
  payoffRatio: number           // Infinity if no losses
  totalWinPnl: number
  totalLossPnl: number          // 負值
  profitFactor: number          // Infinity if no losses
  totalPnl: number
  pnlContribution: number       // 個股總損益 / 整體總損益（可正可負）
  avgHoldingDays: number
  quadrant: PerformanceQuadrant
}
```

**理由**：
- 沿用 `PerformanceQuadrant` 型別（Change 1 已建立），避免重複定義
- `pnlContribution` 是新概念：佔整體損益比例（用於後續 Change 3 / 4 的集中度警示）
- `avgWinReturnRate` / `avgLossReturnRate` 與 `totalWinPnl` / `totalLossPnl` 都保留：報酬率算賠率、金額算獲利因子

### D2 — calcStockStats / calcAllStockStats

**決策**：

```typescript
export function calcStockStats(
  trades: Trade[],
  stockId: string,
  totalPortfolioPnl: number,
): StockStats | null

export function calcAllStockStats(
  trades: Trade[],
): StockStats[]
```

- `calcStockStats`：對單一股票過濾 trades，計算所有指標
- `calcAllStockStats`：先算整體 `totalPnl`，再對每個唯一 stockId 呼叫 `calcStockStats`，回傳 sorted by `|totalPnl|` desc 的陣列

**邊界**：
- 沒有該股票交易 → `null`
- `totalPortfolioPnl === 0` → `pnlContribution = 0`（避免除以 0）

### D3 — 矩陣表 UI 結構

**決策**：

```
┌─────────────────────────────────────────────────────────────────┐
│ 個股分析（賠率 × 獲利因子矩陣）                                  │
│ 共 N 檔個股 · 總損益 +xxx 元 / 平均勝率 X%                       │
├─────────────────────────────────────────────────────────────────┤
│ [全部] [Q1] [Q2] [Q3] [Q4]   ← 4 象限篩選 chips                │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────┬─────┬────┬─────┬───────────┬───────────┬────────┬─────┐│
│ │ 股票 │ Q1  │筆數 │勝率│   賠率    │  獲利因子 │ 損益    │貢獻 ││
│ │ ────│徽章 │    │    │ ▓▓▓░  1.85│ ▓▓▓▓░ 2.5│ +XX 元│ XX%││
│ └──────┴─────┴────┴─────┴───────────┴───────────┴────────┴─────┘│
└─────────────────────────────────────────────────────────────────┘
```

**進度條視覺化**：
- 賠率：以 `min(payoff / 3.0, 1.0)` 作為填充比例（0–3 為合理範圍，> 3 滿格）
- 獲利因子：以 `min(profitFactor / 4.0, 1.0)` 作為填充比例（0–4 為合理範圍）
- 進度條顏色依四象限對應（Q1 紅、Q4 綠、Q2/Q3 amber）——遵循台股紅漲綠跌

**理由**：進度條讓使用者一眼看出「打法品質」與「實際結果」的相對程度，比純數字更直覺。

### D4 — 排序與篩選互動

**決策**：

排序：點擊欄位標題（股票 / 筆數 / 勝率 / 賠率 / 獲利因子 / 損益 / 貢獻度）切換升降冪。預設 `|totalPnl|` desc。

篩選：象限 chips「全部 / Q1 / Q2 / Q3 / Q4」單選。預設「全部」。

**篩選與排序組合**：先篩選後排序。

### D5 — 深度連結（績效 → 個股）

**決策**：

矩陣表中的股票名稱欄位用 `<Link to={`/individual?code=${stockId}`}>...</Link>`，點擊後：

1. React Router 導航到 `/individual?code=2330`
2. IndividualPage 在 mount 時用 `useSearchParams` 讀 `?code=`
3. 若 `code` 存在且與目前 `individualStockCode` 不同 → 自動觸發 `handleSelect(code, '')`（name 由 stockList 自動補上）

**邊界**：
- `code` 為空 → 不觸發
- `code` 不在 stockList → handleSelect 仍會嘗試呼叫 API，失敗則顯示 error（既有行為）
- 使用者在個股頁手動切換股票後再次點擊矩陣表 → query string 變化觸發重新載入

**理由**：
- Query string 是 React Router 標準做法，狀態保留在 URL 上（可分享、可前進後退）
- 不破壞 IndividualPage 既有的手動選股邏輯（StockSelector 仍可用）

### D6 — 在 PerformancePage 的位置

**決策**：插入在 Dashboard 之後、原始交易表格之前。

```
頁面標題
隱私 banner
資料輸入區（可摺疊）
─────────────────────
整體績效 Dashboard       ← Change 1
─────────────────────
個股矩陣表               ← 本 change
─────────────────────
原始交易表格             ← Change 1
```

**理由**：使用者的閱讀順序為「整體 → 個股 → 明細」，由概觀到細節。

### D7 — 與 EV 4 象限分開的視覺呈現

**決策**：個股矩陣的 4 象限徽章使用 Change 1 已建立的 `PerformanceQuadrant` 標籤（Q1–Q4），但在矩陣表中採**簡短版**：

| 完整標籤（Hero 用） | 矩陣表簡短版 |
|------------------|------------|
| Q1: 打法好・結果好 | Q1 雙優 |
| Q2: 打法差・結果好（靠重倉或勝率撐場） | Q2 隱藏風險 |
| Q3: 打法好・結果差（資金管理需改善） | Q3 管理問題 |
| Q4: 打法差・結果差（全面檢討） | Q4 待檢討 |

**理由**：表格欄位空間有限，簡短版更清楚。完整 quadrant 字串在 hover tooltip 顯示。

**實作**：在 `QuadrantBadge` 新增 `compact?: boolean` prop，true 時顯示簡短版。

## Risks / Trade-offs

- **個股交易筆數少（如 1–3 筆）統計意義有限** → 緩解：在矩陣表筆數欄位 < 5 時顯示淡灰色（提示樣本不足），不影響排序
- **進度條最大值（賠率 3.0、獲利因子 4.0）為經驗值** → 接受。極端值（賠率 = 5）滿格顯示，配合數字本身仍能讀出
- **深度連結後 IndividualPage 自動載入可能與既有股票衝突** → 緩解：URL `?code=` 為單一真相來源，覆寫既有狀態，使用者預期此行為
- **沒有反向連結（個股頁不知道使用者交易過此股）** → 接受。Change 3 補上，避免本 change 範圍蔓延
