## 1. 研究與驗證 R/S 公式

- [x] 1.1 確認 Google Sheet 的累積加總寫法：`=MMULT(IF(ROW(B2:B121)>=TRANSPOSE(ROW(B2:B121)),1,0), B2:B121-AVERAGE(B2:B121))` 可正確產生累積偏差序列
- [x] 1.2 在測試 Sheet 中手動驗算 H 值公式：R = MAX(累積偏差) - MIN(累積偏差)，S = STDEV(returns)，H = LOG(R/S)/LOG(120)
- [x] 1.3 確認公式對 `returns` 與 `portfolio_returns` 命名範圍均可正確引用

## 2. Individual 分頁新增 Hurst Exponent 區塊

- [x] 2.1 在 `setupIndividual()` 末段（row 40 之後）新增 Section 標題「▌ 赫斯特指數（Hurst Exponent）」
- [x] 2.2 寫入 H 值計算公式（R、S、H 三個步驟分列，E/F 欄放中間計算）
- [x] 2.3 設定 H 值儲存格格式：小數兩位、字體加大、黃底（`#fff3cd`）
- [x] 2.4 寫入三區間判斷公式：`=IF(H>0.6,"趨勢延續型",IF(H<0.4,"均值回歸型","隨機遊走型"))`
- [x] 2.5 新增解讀說明文字（H > 0.6 / 0.4–0.6 / H < 0.4 三段說明）

## 3. Portfolio 分頁新增 Hurst Exponent 區塊

- [x] 3.1 在 `setupPortfolio()` Section 5 蒙地卡羅之後（row 280 左右）新增 Section 6 標題「▌ Section 6：赫斯特指數（Hurst Exponent，基於加權組合）」
- [x] 3.2 寫入 H 值計算公式，參照 `portfolio_returns`（L20:L139）
- [x] 3.3 設定格式（同 Individual 版）
- [x] 3.4 寫入三區間判斷公式與解讀說明

## 4. 驗收測試

- [x] 4.1 執行 `rebuildIndividual()`，確認 Hurst Exponent 區塊正確出現
- [x] 4.2 貼入測試數據，確認 H 值在合理範圍（0 到 1 之間）且判斷文字正確
- [x] 4.3 執行 `rebuildPortfolio()`，確認 Portfolio Section 6 正確出現
- [x] 4.4 確認更換比重後加權組合 H 值自動更新
- [x] 4.5 確認 Individual 與 Portfolio 原有計算（EV、VaR、MonteCarlo）未受影響
