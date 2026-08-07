# Design: 績效分析頁基礎建設

## Context

web-app 目前 4 個分析頁面都屬於「進場前評估」（forward-looking）：基於 CMoney 市場資料計算 EV / VaR / Hurst / MC。新功能屬於「出場後反思」（backward-looking）：讀取使用者的實際交易紀錄，計算勝率、賠率、獲利因子等指標。

**兩端使用相同的「勝率 / 賠率 / EV」概念但語意不同**：
- 前向：每筆「報酬」是市場月報酬或日報酬
- 後向：每筆「報酬」是一筆完整買賣交易的實現損益

這個對比本身就是後續 Change 3 的最大價值點（市場賠率 vs 我的賠率）。

## Goals / Non-Goals

**Goals:**
- 建立 `Trade` 資料模型與本機 zustand 儲存基礎建設
- 提供手動輸入 + CSV 上傳兩種資料來源
- 核心指標計算正確（勝率、賠率、獲利因子、期望值、最大回撤、年化）
- 整體 Dashboard 採既有三層視覺層次（Hero / Normal / Muted）
- 紅漲綠跌色彩與 `+/−` 號慣例延續
- 為後續 Change 2/3/4 鋪好資料 / 元件 / store 基礎

**Non-Goals:**
- 不做個股 4 象限矩陣（→ Change 2）
- 不做累積損益曲線、長條圖、散佈圖（→ Change 3）
- 不做完整診斷規則引擎（→ Change 4）
- 不做 PDF / Excel 匯出（→ Change 4）
- 不做後端 API 持久化（暫時只 zustand persist 本機）
- 不做券商 Excel 對帳單格式（先做通用 CSV）
- 不做交易紀錄與既有 stockList 的雙向連結（→ Change 3）

## Decisions

### D1 — 資料模型（Trade）

**決策**：

```typescript
export interface Trade {
  id: string                  // crypto.randomUUID()
  stockId: string             // "2330"
  stockName: string           // "台積電"
  buyDate: string             // ISO 'YYYY-MM-DD'
  sellDate: string            // ISO 'YYYY-MM-DD'
  buyPrice: number            // 買進均價
  sellPrice: number           // 賣出均價
  shares: number              // 股數
  buyAmount: number           // 買進價金（含手續費）
  sellAmount: number          // 賣出價金（扣除費用）
  pnl: number                 // 實現損益（元）
  returnRate: number          // 報酬率（小數，如 0.0587 = 5.87%）
  note?: string               // 備註（選填）
}
```

**衍生欄位（運行時計算，不存入）**：
- `holdingDays = daysBetween(buyDate, sellDate)`

**理由**：
- 用 ISO 日期字串而非 Date 物件：JSON 序列化友善、persist 不出問題
- `pnl` 與 `returnRate` 都儲存而非運算：使用者可能輸入券商給的數字（含手續費等微調），不必我們重算
- `id` 用 UUID：方便編輯、刪除單筆
- 衍生欄位（持有天數、四象限）不存：避免快取不一致

### D2 — 儲存策略（zustand persist，本機）

**決策**：新增獨立的 `useTradeStore`（不與既有 `useAppStore` 合併）。

```typescript
interface TradeStore {
  trades: Trade[]
  addTrade: (trade: Trade) => void
  updateTrade: (id: string, patch: Partial<Trade>) => void
  removeTrade: (id: string) => void
  importTrades: (trades: Trade[]) => void  // CSV 匯入（合併、去重）
  clearAll: () => void
}

persist(store, { name: 'rmh-trades-v1', version: 1 })
```

**理由**：
- 獨立 store：避免與既有 `rmh-app-v3` 的 schema 互相影響；後續加後端 API 持久化時也容易切換
- 版本前綴 `-v1`：未來 schema 變更時可平滑遷移
- 全本機：使用者隱私敏感資料不上雲，UI 上明確說明

**UI 提示**：頁面頂部固定一行 banner：「💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端」+「清除全部」按鈕。

### D3 — CSV 格式設計

**決策**：通用格式，13 欄與 `Trade` interface 一一對應。

```csv
stock_id,stock_name,buy_date,sell_date,buy_price,sell_price,shares,buy_amount,sell_amount,pnl,return_rate,note
2330,台積電,2025-03-15,2025-09-20,580.5,720.0,1000,580500,720000,139500,0.2403,獲利了結
```

**規則**：
- 第一行為 header（必填）
- 日期格式：`YYYY-MM-DD`（其他格式不支援，明確報錯）
- `return_rate` 用小數（0.2403）或百分比（24.03%）皆可，自動偵測
- 缺欄位 → 顯示錯誤（不容錯）
- 空白行、註解行（`#` 開頭）跳過

**理由**：
- 通用 CSV 比券商 Excel 更穩定（不受券商格式變動影響）
- 13 欄一一對應，使用者可從券商對帳單手動整理或用 ChatGPT 轉換
- 嚴格報錯比靜默吞掉壞資料安全

**未來擴充**：Change 4 之後可加「券商格式自動轉通用 CSV」工具。

### D4 — 核心指標計算

**決策**：在 `src/lib/trade.ts` 新增純函式：

```typescript
export interface PortfolioPerformance {
  // 計數
  nTrades: number
  nWins: number
  nLosses: number
  nFlat: number              // pnl === 0
  // 報酬
  totalPnl: number           // 元
  totalInvested: number      // sum(buyAmount)
  overallReturn: number      // totalPnl / totalInvested
  annualizedReturn: number   // 依操作天數年化
  // 勝率與打法
  winRate: number
  payoffRatio: number        // avgWinReturnRate / abs(avgLossReturnRate)
  profitFactor: number       // sum(winPnl) / abs(sum(lossPnl))
  // 期望值
  expectedValue: number      // 每筆期望值（元）
  expectedReturnRate: number // 每筆期望報酬率
  // 部位
  avgWinPnl: number
  avgLossPnl: number          // 負值
  avgWinReturnRate: number
  avgLossReturnRate: number   // 負值
  // 風險
  maxWinPnl: number
  maxLossPnl: number
  maxDrawdown: number         // 元（負值）
  maxDrawdownPct: number      // 比例（負值）
  // 持有期間
  avgHoldingDays: number
  maxHoldingDays: number
  minHoldingDays: number
  // 4 象限
  quadrant: PerformanceQuadrant
}
```

**4 象限分類規則**（沿用原文件並對齊既有 EV 4 象限風格）：

| 賠率 | 獲利因子 | 象限 |
|------|---------|------|
| ≥ 1.5 | ≥ 2.0 | Q1 打法好・結果好 |
| ≥ 1.5 | < 2.0 | Q3 打法好・結果差（資金管理） |
| < 1.5 | ≥ 2.0 | Q2 打法差・結果好（靠重倉） |
| < 1.5 | < 2.0 | Q4 打法差・結果差 |

**最大回撤計算**：依 sell_date 排序、累積損益、滾動高點、回撤最低值。

**年化報酬率**：`(1 + overallReturn)^(365 / 操作天數) − 1`，操作天數 = `max(sellDate) − min(buyDate) + 1`。

**邊界處理**：
- `nTrades === 0` → 整個函式回傳 `null`（UI 顯示空態）
- `avgLossReturnRate === 0`（沒虧損交易）→ payoffRatio = `Infinity`，UI 顯示「全勝」
- `sum(lossPnl) === 0` → profitFactor = `Infinity`

### D5 — Dashboard 三層視覺層次

延續既有 IndividualPage 設計：

```
┌──────────────────────────────────────────────────┐
│ 整體交易績效                                      │
│ 期間 2025/01/01 – 2026/04/29 · 共 47 筆交易      │
├──────────────────────────────────────────────────┤
│ ┌────────────────┐                              │
│ │ 總實現損益      │  Q1 打法好・結果好            │
│ │ +320,500 元    │  整體報酬率：+15.2% / 年化 12% │
│ │ (text-display) │                              │
│ └────────────────┘                              │
├──────────────────────────────────────────────────┤
│ [勝率 65%] [賠率 1.85] [獲利因子 2.4] [期望值 +6,820] │
│ [平均持有 45 天] [...]                          │
├──────────────────────────────────────────────────┤
│ 弱化細節：總筆數、勝/敗場、平均獲利/虧損、         │
│           最大獲利/虧損、最大回撤、最長/最短持有    │
├──────────────────────────────────────────────────┤
│ ▶ 展開計算依據                                   │
└──────────────────────────────────────────────────┘
```

**Hero 主數字**：總實現損益（元，以「+xx,xxx」或「−xx,xxx」格式 + 紅漲綠跌色）

**理由**：使用者最關心的是「我賺了多少」，比報酬率更直覺。

### D6 — 資料輸入 UX

**決策**：上方一個區塊，採用 Tab 切換兩種模式。

```
┌─────────────────────────────────────┐
│  資料輸入  ［手動輸入｜CSV 上傳］    │
├─────────────────────────────────────┤
│ (依 Tab 切換顯示對應 UI)            │
└─────────────────────────────────────┘
```

**手動輸入**：行內表格新增 → 即時驗證 → enter 換行。
**CSV 上傳**：拖放或選檔 → 預覽前 5 筆 → 確認匯入 → 顯示成功 / 失敗摘要。

**沒有交易資料時**：顯示空態說明卡片 + 範例 CSV 連結。

### D7 — 原始交易表格

**決策**：在 Dashboard 下方顯示，可摺疊（預設展開）。

| 欄位 | 顯示格式 |
|------|---------|
| 股票 | 2330 台積電 |
| 買入日 → 賣出日 | 2025-03-15 → 2025-09-20 |
| 持有天數 | 189 天 |
| 買入 / 賣出價 | 580.50 / 720.00 |
| 股數 | 1,000 |
| 損益 | `+139,500` 元（紅漲綠跌）|
| 報酬率 | `+24.03%`（紅漲綠跌）|
| 操作 | ✏️ 編輯 / 🗑 刪除 |

**排序**：預設 sell_date 倒序，欄位標題可點擊切換。

**理由**：使用者要能快速核對輸入正確、發現異常筆，編輯也直接在表格上完成。

### D8 — 與既有元件的重用矩陣

| 既有元件 | 在新頁面的用途 |
|---------|---------------|
| `ResultCard` (hero/normal/muted) | Dashboard 卡片 |
| `QuadrantBadge` | 4 象限結論徽章（large 版） |
| `fmtPct` | 報酬率欄位 |
| `colorByReturn` | 報酬率配色 |
| `SectionBlock`（IndividualPage 內部）| 區塊容器（可考慮提升為共用元件，本 change 暫不做）|

**新建元件**（放在 `src/components/trade/`）：
- `TradeInputTable`：手動表格輸入
- `TradeFileUpload`：CSV 上傳
- `RawTradeTable`：原始交易明細
- `PortfolioPerformanceBlock`：Dashboard 主體

### D9 — 4 象限與既有 EV 4 象限的關係

既有 EV 4 象限（前向）與新功能 4 象限（後向）**概念對齊**但**標籤不同**：

| 既有（EV 前向） | 新功能（交易後向） |
|---------------|------------------|
| 高賠率正期望值（最佳） | Q1 打法好・結果好 |
| 低賠率正期望值（勝率驅動） | Q2 打法差・結果好（隱藏風險） |
| 高賠率負期望值（賠率驅動但勝率不足） | Q3 打法好・結果差（資金管理） |
| 低賠率負期望值（避免） | Q4 打法差・結果差 |

**決策**：新功能的 4 象限**不重用** `Quadrant` 型別與標籤（語意不同），但**重用** `QuadrantBadge` 元件外觀（顏色 + icon 對應）。

新增 `PerformanceQuadrant` 型別與獨立的 mapping，`QuadrantBadge` 內部按需擴充支援兩種來源。

### D10 — NavBar 第 5 項 + 手機底部 tab 排版

**決策**：直接加第 5 個項目。

```
桌機 sidebar：5 項垂直排列（200px 固定寬，仍夠）
手機底部 tab：5 個圖標一字排開（圖標 size=20，平均寬 80px，iPhone SE 都還夠）
```

**圖標選擇**：`ClipboardCheck`（剪貼板打勾，符合「績效報告」語意）→ 在 `icons.tsx` 新增。

## Risks / Trade-offs

- **資料只在本機，換瀏覽器或清快取就消失** → 緩解：Banner 明確提示 + 提供「匯出 CSV」按鈕讓使用者自行備份（簡單實作，加進本 change）
- **CSV 格式錯誤的容錯**：嚴格報錯可能讓不熟 CSV 的使用者卡住 → 緩解：錯誤訊息明確指出哪一行哪一欄、提供範例 CSV 下載
- **大量交易（1000+ 筆）效能**：所有計算在 client side、表格全部渲染 → 第一版接受，未來如有需要再加分頁 / 虛擬列表
- **prevailing 既有 EV 4 象限與新功能 4 象限混淆**：使用者在不同頁看到「象限」可能誤認 → 緩解：標籤文字差異化（Q1 打法好・結果好 vs 高賠率正期望值），且新功能的 hero 副標明確寫「基於賠率 × 獲利因子」
- **使用者沒有交易資料**：空狀態如何引導 → 緩解：空態 UI 顯示「立即新增第一筆交易」按鈕 + 提供範例 CSV
- **返回鍵 / 切頁不會 Save** → 因為 zustand persist 是即時寫入，新增 / 編輯 / 刪除立刻持久化
