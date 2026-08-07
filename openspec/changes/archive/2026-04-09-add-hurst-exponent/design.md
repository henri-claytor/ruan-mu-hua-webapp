## Context

目前 `setup_sheet.gs` 的 `setupIndividual()` 與 `setupPortfolio()` 函數已採用結果置頂版面，各分頁末段有空間可新增分析區塊。

赫斯特指數（H）使用 **R/S 分析法**（Hrescaled Range Analysis）計算：

```
H = log(R/S) / log(n)
```

其中：
- R = 累積偏差序列的最大值 − 最小值（Range）
- S = 序列標準差（Scale）
- n = 資料筆數

Google Sheet 無原生 Hurst 函數，需用子計算欄位逐步拆解。

## Goals / Non-Goals

**Goals:**
- 在 Individual 分頁末段新增 Hurst Exponent 區塊（使用 `returns`）
- 在 Portfolio 分頁末段新增 Hurst Exponent 區塊（使用 `portfolio_returns`）
- 以純 Google Sheet 公式實作，不依賴 Apps Script 計算
- 提供清楚的三區間解讀（趨勢 / 隨機 / 均值回歸）

**Non-Goals:**
- 不實作多尺度 R/S 分析（log-log 迴歸法），僅用全樣本單一 H 值估算
- 不修改 MonteCarlo 或 VaR 的計算邏輯
- 不新增額外分頁

## Decisions

### 決策 1：使用單一全樣本 R/S 法，不用多尺度迴歸

**選擇：** 單一 n=120 的全樣本 R/S 估算  
**理由：** 多尺度迴歸需要 10–20 組不同 n 的 R/S 值再做 log-log 迴歸，Google Sheet 公式極難維護，且對課程用途（教學判斷）精度已足夠  
**替代方案考慮：** DFA（去趨勢波動分析）— 精度較高但需要 Apps Script，不符合純 Sheet 公式原則

### 決策 2：中間計算步驟放在輔助欄（E、F 欄）

**選擇：** 在每個 Hurst 區塊旁邊用 E、F 欄存放中間計算（累積偏差、R/S 子值）  
**理由：** 讓使用者可以驗算，也方便 debug；欄位淡灰色字，視覺上不干擾主要結果  
**替代方案：** 用 ARRAYFORMULA 合併成單格 — 公式過於複雜，可讀性差

### 決策 3：R/S 計算拆解為三個步驟

```
步驟一：平均值 μ = AVERAGE(returns)
步驟二：累積偏差序列 Xt = Σ(ri - μ)，i=1..t
         → R = MAX(累積偏差) - MIN(累積偏差)
步驟三：S = STDEV(returns)
         H = LOG(R/S) / LOG(120)
```

Individual 版：`returns` 命名範圍（120 筆，Raw Data!B2:B121）  
Portfolio 版：`portfolio_returns` 命名範圍（120 筆，Portfolio!L20:L139）

### 決策 4：Individual 放在賠率步驟之後（row 40+），Portfolio 放在 Section 5 之後（row 280+）

**理由：** 不破壞現有版面的列號結構，直接附加在各分頁末端

## Risks / Trade-offs

- **精度限制：** 單一 R/S 估算對 n=120 有偏誤（會低估 H）。Mitigation：在解讀說明中說明此為近似估算，並給出 ±0.1 的解讀容忍範圍
- **公式複雜度：** 累積偏差的 OFFSET/SUMIF 公式對非技術用戶難以理解。Mitigation：輔助欄使用淡色字，主結果只顯示最終 H 值
- **Google Sheet 公式限制：** ARRAYFORMULA 搭配累積和需要特定寫法（`MMULT` 法）。驗證寫法：`=MMULT(IF(ROW(B2:B121)>=TRANSPOSE(ROW(B2:B121)),1,0), B2:B121 - AVERAGE(B2:B121))`

## Open Questions

- 是否要在 Portfolio 頁顯示各個別股的 H 值（多欄對比）？目前設計只顯示加權組合整體 H 值 — 留待作者確認後決定
