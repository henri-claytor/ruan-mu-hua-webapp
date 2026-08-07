# Design: 診斷引擎 + 報告匯出

## Context

Change 1–3 完成資料、計算、視覺化。本 change 加上「自動解讀」（診斷引擎）與「報告匯出」（PDF / Excel）。

兩塊都是「畫龍點睛」——讓使用者看完數字後**有具體建議**，並能**保留 / 分享**結果。

## Goals / Non-Goals

**Goals:**
- 實作原始文件 §6 的全部診斷規則（組合 6 條 + 個股 6 條）
- 規則引擎輸出結構化結果，便於 UI 顯示與未來擴充（如多語）
- PDF 多頁匯出涵蓋 Dashboard / 矩陣 / 圖表 / 診斷
- Excel 4 分頁分別存整體 / 個股 / 交易明細 / 診斷建議
- 既有「匯出 CSV」改為下拉選單的一項（不破壞既有功能）

**Non-Goals:**
- 不做完美 PDF 排版（接受截圖式 PDF，不重新繪製成 vector）
- 不做 Excel 公式或樞紐分析（純資料匯出）
- 不做加密 / 浮水印（個人工具，不必要）
- 不對既有 IndividualPage 加診斷（前向分析有 ActionGuide 已足夠；後向是 Performance 專屬）

## Decisions

### D1 — 診斷規則引擎結構

**決策**：

```typescript
export type DiagnosisLevel = 'alert' | 'warning' | 'note' | 'info'
//   alert  = 紅，需立即注意（如停損紀律）
//   warning = amber，需關注（如資金管理）
//   note   = 藍，提醒（如賠率偏低）
//   info   = 灰，資訊（如樣本不足）

export interface Diagnosis {
  id: string                    // 'concentration-risk' / 'stop-loss-discipline' …
  level: DiagnosisLevel
  scope: 'portfolio' | 'stock'
  stockId?: string              // scope='stock' 時必填
  title: string
  message: string               // 描述觀察到的事實
  advice: string                // 建議行動
}

export function diagnose(
  trades: Trade[],
  performance: PortfolioPerformance,
  stocks: StockStats[],
): Diagnosis[]
```

**理由**：
- 結構化 ≠ 純字串：UI 可以分組顯示、依 level 配色、未來可擴充（多語、可關閉某條等）
- 純函式：易測試
- 每條規則一個 id：未來個別啟用 / 停用方便

### D2 — 規則細節

#### 組合層級（6 條）

| ID | 條件 | level | title | advice |
|----|------|-------|-------|--------|
| `concentration-risk` | 前 2 大 \|pnlContribution\| 之和 > 0.4 | warning | 集中度風險 | 「分散持股，強勢標的達目標後部分減倉」 |
| `stop-loss-discipline` | 全敗標的數 ≥ 3 **且** 合計虧損 / abs(總損益) > 0.1（當總損益 ≠ 0） | alert | 停損紀律不足 | 「建立固定停損線機制（建議進場成本 -8% 至 -10%）」 |
| `low-profit-factor` | profitFactor < 2.0 且 isFinite | note | 獲利因子偏低 | 「全面檢視策略邏輯，優先改善賠率」 |
| `low-payoff` | payoffRatio < 1.2 且 isFinite | note | 賠率偏低 | 「改善停損或獲利了結節奏」 |
| `high-frequency` | 年均交易筆數（nTrades / 操作年數）> 100 | note | 交易頻率過高 | 「評估薄利多筆標的的交易成本侵蝕比例」 |
| `low-sample` | nTrades < 30 | info | 樣本不足 | 「現有統計僅供參考，建議累積更多交易後再評估」 |

#### 個股層級（6 條）

| ID | 條件 | level | title | advice |
|----|------|-------|-------|--------|
| `stock-all-loss-2` | winRate === 0 且 nTrades === 2 | alert | 連續虧損 | 「建議設定明確停損條件，達到觸發點立即執行」 |
| `stock-all-loss-3plus` | winRate === 0 且 nTrades >= 3 | alert | 全敗多筆 | 「持續進場代表選股邏輯可能整體有誤，而非執行問題」 |
| `stock-low-payoff` | payoffRatio < 0.8 且 isFinite | warning | 打法品質偏低 | 「賠率偏低，靠勝率撐場結構脆弱，重新評估進出場邏輯」 |
| `stock-money-management` | payoffRatio >= 1.5 且 profitFactor < 1.0 | warning | 資金管理問題 | 「打法尚可但虧損筆部位過重，需調整資金配置」 |
| `stock-concentration` | abs(pnlContribution) > 0.2 | note | 集中度警示 | 「設定單一標的損益貢獻上限（如 25%），達到後分批減倉」 |
| `stock-low-sample` | nTrades < 5 | info | 樣本不足 | 「建議累積更多樣本後再評估」 |

**規則評估順序**：個股規則中 `stock-all-loss-3plus` 比 `stock-all-loss-2` 優先（兩者互斥條件覆蓋）；其餘規則互不衝突，可同時觸發。

**理由**：直接對應原始文件 §6，使用者已熟悉這些診斷邏輯；門檻數值與既有 4 象限 (1.5 / 2.0) 對齊。

### D3 — DiagnosisPanel 元件

**決策**：放在 Dashboard 之後、矩陣表之前。

```
┌─────────────────────────────────────────────────────┐
│ 自動診斷與建議                                      │
│ 找到 N 條觀察項目（M 警示 / X 提醒 / Y 資訊）      │
├─────────────────────────────────────────────────────┤
│ 🔴 [alert]  停損紀律不足                            │
│            觀察：3 檔全敗標的合計虧損佔總損益 15%   │
│            建議：建立固定停損線機制...              │
├─────────────────────────────────────────────────────┤
│ 🟡 [warning] 集中度風險                             │
│            觀察：前 2 大標的貢獻 52.3%              │
│            建議：分散持股...                        │
├─────────────────────────────────────────────────────┤
│ ⚪ [note] 賠率偏低 (1.15)                           │
│ ⚪ [info] 樣本不足（25 筆 < 30）                    │
└─────────────────────────────────────────────────────┘
```

**只顯示組合層級**：個股層級的 stock-* 診斷顯示在矩陣表內（D4）。

**樣式對應**：
- alert：bg-red-50 border-red-200 text-red-700 + 🔴 emoji
- warning：bg-amber-50 border-amber-200 text-amber-700 + 🟡
- note：bg-blue-50 border-blue-200 text-blue-700 + ⚪
- info：bg-elevated border-base text-dim + ℹ️

**邊界**：
- 沒有任何診斷觸發 → 顯示「✓ 暫無需要關注的問題」綠色 banner
- trades.length === 0 → 不顯示

### D4 — 矩陣表內個股診斷顯示

**決策**：每列右側新增「診斷」欄位，顯示 icon 數量代表該股觸發的診斷條目數。Hover 顯示 tooltip 列出標題與 advice。

```
| 股票 | 分類 | ... | 損益 | 貢獻 | 診斷 |
| 2330 | Q1   | ... | +XX | +X% | 🔴 1 ⚪ 1  |   ← hover 看詳情
```

**理由**：
- 表格寬度緊張，icon + 計數比文字省空間
- Tooltip 顯示完整內容滿足想深入了解的使用者
- 沒有觸發任何診斷 → 顯示「—」或 emoji ✓

**互斥處理**：`stock-all-loss-3plus` 觸發時不顯示 `stock-all-loss-2`（後者只在 nTrades === 2 時觸發，前者 ≥ 3 時觸發，邏輯上自然互斥）。

### D5 — PDF 匯出設計

**決策**：用 `jspdf` + 既有 `html2canvas` 產生**截圖式 multi-page PDF**。

**流程**：
```typescript
async function exportPdf(elements: HTMLElement[], filename: string) {
  const pdf = new jsPDF({ format: 'a4', orientation: 'p', unit: 'mm' })
  for (const el of elements) {
    const canvas = await html2canvas(el, { scale: 2 })
    const img = canvas.toDataURL('image/png')
    // calculate scaling to fit A4 (210 × 297 mm)
    pdf.addImage(img, 'PNG', 10, 10, ...)
    if (notLast) pdf.addPage()
  }
  pdf.save(filename)
}
```

**截圖區塊**（依序）：
1. 隱私 banner（含期間摘要）
2. PortfolioPerformanceBlock（整體 Dashboard）
3. DiagnosisPanel（診斷）
4. StockQuadrantMatrix（個股矩陣，含篩選 chips 但不含 hover tooltip）
5. PerformanceCharts（3 張圖）
6. RawTradeTable

**檔名**：`performance-report-YYYY-MM-DD.pdf`

**理由**：
- 截圖式比 vector PDF 簡單 10 倍（不必重畫圖表）
- A4 直式適合大多數 PDF 閱讀情境
- jspdf 是業界標準，社群活躍

**Trade-off**：
- PDF 檔較大（每張截圖 ~300KB，6 頁約 2 MB）
- 文字無法 select / search → 接受。對於一份「績效報告」這個權衡合理

### D6 — Excel 匯出設計

**決策**：用 `xlsx` 套件產生 4 sheets workbook。

**Sheet 1：整體指標總覽**
- 期間、總交易筆數、勝場、敗場、總損益、整體報酬率、年化報酬率
- 勝率、賠率、獲利因子、期望值、最大回撤、平均持有天數
- 4 象限分類

**Sheet 2：個股統計**
- 每列一檔股票，欄位 = StockStats 的所有欄位 + 觸發的診斷 ID 列表
- 排序與矩陣表一致（|totalPnl| desc）

**Sheet 3：原始交易明細**
- 與既有 CSV 匯出相同的欄位（13 欄）
- 排序：sellDate desc

**Sheet 4：診斷建議**
- 每列一條診斷：scope / level / stockId / title / message / advice

**檔名**：`performance-report-YYYY-MM-DD.xlsx`

**理由**：
- 4 sheets 對應使用者不同分析需求（整體看 sheet 1、找問題看 sheet 4）
- xlsx 是業界標準格式，可直接在 Excel / Numbers / Google Sheets 開
- 比 CSV 多了「結構化」優勢

### D7 — ExportMenu 元件

**決策**：取代既有「匯出 CSV」單一按鈕，改為下拉選單。

```
[⬇ 匯出 ▾]
  ├ PDF 報告（含圖表）
  ├ Excel 工作簿（4 分頁）
  └ CSV 交易明細（既有）
```

**位置**：與既有按鈕同位置（隱私 banner 右側）。

**清除全部按鈕**保留在右側，不變。

**理由**：3 種匯出統一在一個入口，UI 不擁擠。

### D8 — 既有 IndividualPage 不加診斷

**決策**：診斷功能僅限績效分析頁。IndividualPage 保留既有 ActionGuide 即可。

**理由**：
- IndividualPage 是前向分析（市場資料），ActionGuide 已對應該頁的訊號
- 績效分析頁是後向分析（交易紀錄），診斷規則對應該頁
- 兩邊概念不混淆，避免使用者困惑

## Risks / Trade-offs

- **PDF 檔案大（~2 MB）**：截圖式必然較大 → 接受。可在未來透過 dynamic import 減少初始 bundle
- **xlsx 套件 ~200 KB gzip 增加 bundle**：影響首次載入 → 緩解：使用 dynamic import，只在使用者點「匯出 Excel」時才載入
- **html2canvas 無法處理某些 CSS（如 backdrop-filter）**：可能截圖效果略差 → 接受。本 app 沒用 backdrop-filter
- **規則門檻是經驗值，不同投資風格適用度不同**：如「年均 100 筆交易頻率過高」對當沖客是低估 → 接受第一版用通用門檻；未來可加使用者自訂
- **個股診斷規則互斥處理錯誤可能重複顯示**：如 stock-all-loss-2 與 stock-all-loss-3plus 都觸發 → 緩解：實作時嚴格 mutex，並加單元測試覆蓋
- **匯出時間較長（PDF 可能 2–5 秒）**：截圖每個區塊都要 render → 緩解：UI 顯示 loading 狀態避免使用者重複點擊
