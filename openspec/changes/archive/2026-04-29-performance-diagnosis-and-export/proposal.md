# Proposal: 績效診斷規則引擎 + 報告匯出

## Why

Change 1–3 已完成績效分析的**資料層、Dashboard、個股矩陣、圖表、跨頁連結**——使用者能看到所有數字與視覺化。但目前還缺兩塊：

### 1. 自動化解讀（診斷規則引擎）

數字本身不會說話。同樣是「賠率 0.85」，不同情境意義不同：
- 多筆全敗的個股 → 「停損紀律問題」
- 賠率好但獲利因子低 → 「資金管理問題」
- 前 2 大標的貢獻 > 40% → 「集中度風險」

目前使用者需要自己解讀矩陣表上的數字。Change 4 要把原始文件第 6 節的**完整診斷規則引擎**實作出來，自動產生組合層級與個股層級的具體建議文字，省去使用者自行判讀。

### 2. 報告分享（PDF / CSV 匯出）

使用者完成分析後，常見需求：
- 「想存成 PDF 給自己留紀錄 / 給投資夥伴看」
- 「想匯出 Excel / CSV 做進一步篩選或交叉比對」

目前績效分析頁只能截圖。Change 4 要提供原生匯出功能。

## What Changes

### 1. 完整診斷規則引擎

**新增 `src/lib/diagnosis.ts`**：

#### 組合層級診斷（6 條規則）
| 規則 | 觸發條件 | 訊息類型 |
|------|---------|---------|
| 集中度風險 | 前 2 大標的貢獻度 > 40% | 警示 |
| 停損紀律不足 | 全敗標的數 ≥ 3 且合計虧損 > 總損益 10% | 警示 |
| 獲利因子偏低 | profitFactor < 2.0 | 提醒 |
| 賠率偏低 | payoffRatio < 1.2 | 提醒 |
| 交易頻率過高 | 年均交易筆數 > 100 | 提醒 |
| 樣本不足 | 總交易筆數 < 30 | 資訊 |

#### 個股層級診斷（6 條規則）
| 規則 | 觸發條件 | 訊息類型 |
|------|---------|---------|
| 全敗（停損問題） | winRate === 0 且 nTrades >= 2 | 警示 |
| 全敗多筆（選股邏輯） | winRate === 0 且 nTrades >= 3 | 警示 |
| 賠率警示 | payoffRatio < 0.8 | 警示 |
| 資金管理警示 | payoff >= 1.5 且 profitFactor < 1.0 | 警示 |
| 集中度警示 | pnlContribution > 0.2 | 提醒 |
| 樣本不足 | nTrades < 5 | 資訊 |

每條規則回傳結構化物件 `{ id, level: 'alert'|'note'|'info', title, message, advice }`，支援未來擴充與測試。

### 2. 診斷顯示元件

**新增 `DiagnosisPanel`**：

- **組合層級**：放在績效分析頁的整體 Dashboard 與矩陣表之間（醒目位置）
- **個股層級**：每一檔股票對應的診斷以 hover 或展開方式顯示在矩陣表內（不破壞表格緊湊性）

UI 重用既有的 `ActionGuide` 樣式與「警示橫幅」配色（amber / red / blue / gray 對應 alert / warning / note / info）。

### 3. PDF / CSV 報告匯出

- **PDF 匯出**：使用既有 `html2canvas` 加上新增 `jsPDF`，把績效分析頁的關鍵區塊（Dashboard、矩陣、圖表、診斷）截圖組成多頁 PDF
- **多分頁 Excel 匯出**：使用 `xlsx` 套件，產生 4 個分頁
  - Sheet 1：整體指標總覽
  - Sheet 2：個股統計表
  - Sheet 3：原始交易明細
  - Sheet 4：診斷建議
- **既有 CSV 匯出**：保留 Change 1 的「匯出 CSV」（單純交易明細）

### 4. 新依賴

- `jspdf`（~85 KB gzip）
- `xlsx`（~200 KB gzip）

兩者皆為產業標準 client-side 套件，純前端執行，不需後端 API。

### 5. 範圍

- **本 change 完成**：診斷引擎 + UI + PDF + Excel 匯出
- **不在本 change**：分產業 / 時段分析（未來 Phase 3）、夏普比率（未來 Phase 3）、加碼分析（未來 Phase 4）

## Capabilities

### New Capabilities
- `diagnosis-engine`：組合層級與個股層級的診斷規則引擎，純函式 + 結構化輸出
- `report-export`：PDF（多頁，含 Dashboard / 矩陣 / 圖表 / 診斷）與 Excel（4 sheets）匯出

### Modified Capabilities
- `performance-page-layout`：新增診斷面板區塊；隱私 banner 旁的匯出按鈕擴充為「匯出 PDF / Excel / CSV」三選項
- `stock-quadrant-matrix`：每列旁可顯示該股的診斷標記（hover tooltip 或 inline icon）

## Impact

- `src/lib/diagnosis.ts`（新）：規則引擎
- `src/lib/diagnosis.test.ts`（新）：規則邏輯單元測試（每條規則的觸發 / 不觸發場景）
- `src/components/trade/DiagnosisPanel.tsx`（新）：組合層級診斷面板（Dashboard 後）
- `src/components/trade/StockQuadrantMatrix.tsx`：每列加入診斷 icon + tooltip
- `src/components/trade/ExportMenu.tsx`（新）：取代現有「匯出 CSV」按鈕，下拉選單含 PDF / Excel / CSV 三項
- `src/lib/exportPdf.ts`（新）：jsPDF + html2canvas 多頁 PDF 產生
- `src/lib/exportXlsx.ts`（新）：xlsx 多分頁 workbook 產生
- `src/pages/PerformancePage.tsx`：插入 DiagnosisPanel；Banner 換為 ExportMenu
- `package.json`：新增 `jspdf`、`xlsx` 依賴

無 store schema 異動、無 API 異動。
