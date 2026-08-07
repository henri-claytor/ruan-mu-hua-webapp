## Context

`setup_sheet.gs` 以函數為單位建立各分頁（`setupIndividual`、`setupVaR`、`setupMonteCarlo`、`setupPortfolio`），每個函數內用硬編碼列號（row numbers）定位所有元素。目前各分頁的排版順序：

- **Individual**：標題 → 基礎統計（rows 5–11）→ 賠率（rows 13–18）→ 期望值結果（rows 20–26）→ 象限對照（rows 28–32）
- **VaR**：標題 → 結果（rows 4–5）→ 解讀（rows 7–9）→ 排序數據表（rows 12–133）
- **MonteCarlo**：標題 → 基礎參數（rows 4–7）→ 統計結果（rows 9–13）→ 圖表數據（H 欄）→ 路徑明細（rows 15–116）→ 圖表（row 121）
- **Portfolio**：比重輸入 → 數據表 → 期望值 → VaR → 蒙地卡羅

目標排版（結果優先）：

- **Individual**：結果摘要（EV、賠率、象限）→ 計算步驟
- **VaR**：結果卡片 → 解讀 → 排序數據表
- **MonteCarlo**：統計結果 + 圖表 → 基礎參數 → 路徑明細
- **Portfolio**：比重輸入 → 即時摘要結果 → 詳細計算 → 數據表

## Goals / Non-Goals

**Goals:**
- 每個分頁開啟後，不需捲動即可看到核心結果數字與圖表
- 公式邏輯不變，只調整區塊順序與列號
- 圖表位置隨結果區塊一起往上移

**Non-Goals:**
- 不改變計算公式本身
- 不改變視覺樣式（顏色、字型）
- 不新增功能，不改變命名範圍定義

## Decisions

**決策 1：直接重寫各 setup 函數的列號配置，而非插入新列**

- 選擇原因：Apps Script 沒有「插入列後自動更新公式列號」的機制，直接重排比操作現有 Sheet 更可靠
- 替代方案：在 Sheet 中用 `insertRowsBefore()` 插入空列再移動內容——風險高，公式參照容易斷裂
- 結論：重寫函數列號，一次性產生正確排版

**決策 2：各分頁新列號規劃**

Individual（目標排版）：
```
rows  1–2  : 標題 + 資料來源說明
rows  4–10 : ▌ 結果摘要（EV、賠率、象限判斷）← 移至最上
rows 12–16 : ▌ 課程象限對照表
rows 18–26 : ▌ 基礎統計（勝率、敗率、Avg Gain/Loss）
rows 28–34 : ▌ 賠率計算步驟
```

VaR（已大致合理，微調）：
```
rows  1    : 標題
rows  3–6  : ▌ 計算結果（VaR 95%/99% 數字）← 保持頂部
rows  8–11 : ▌ 如何解讀
rows 13+   : ▌ 排序數據表（供驗算）
```

MonteCarlo（主要調整）：
```
rows  1–2  : 標題 + 說明
rows  4–8  : ▌ 統計結果（P5/P50/P95）← 移至最上
rows  9–10 : 圖表錨點（靠近統計結果）
rows 12–15 : ▌ 基礎參數（μ, σ）
rows 17–21 : ▌ 圖表數據（H 欄）
rows 23+   : ▌ 路徑明細
rows ~130  : ▌ 如何解讀
```

Portfolio（Section 5 內部調整）：
```
Section 1：比重輸入（不動）
Section 2：數據輸入表（不動）
Section 3：期望值 — 結果先，計算後
Section 4：VaR（不動，結果已在頂）
Section 5：蒙地卡羅 — 統計結果 + 圖表先，參數與路徑明細後
```

## Risks / Trade-offs

- [風險] 列號變動後 Section 3/5 的公式參照（如 `=B147*B149`）需全部更新 → 改用變數追蹤列號，不直接寫死數字
- [風險] MonteCarlo 圖表若錨定在路徑明細上方，圖表會浮在數據上 → 統計結果區塊完成後立即建立圖表，`setPosition` 跟著統計列號走
- [Trade-off] 重新執行 `rebuildIndividual()` 等函數會完全重建分頁，使用者若有手動備註會消失 → 這是現有設計限制，不在本次範圍內處理
