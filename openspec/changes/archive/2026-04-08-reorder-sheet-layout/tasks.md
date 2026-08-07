## 1. Individual 分頁重排（結果置頂）

- [x] 1.1 重寫 `setupIndividual()`：將期望值結果、賠率、象限判斷移至 rows 4–16
- [x] 1.2 將課程象限對照表移至 rows 18–22
- [x] 1.3 將基礎統計（勝率、敗率、Avg Gain/Loss）移至 rows 24–32
- [x] 1.4 將賠率計算步驟移至 rows 34–40
- [x] 1.5 驗證公式列號參照正確（EV = 勝率列 × Avg Gain 列 − 敗率列 × Avg Loss 列）

## 2. VaR 分頁重排（已大致正確，微調確認）

- [x] 2.1 確認 VaR 結果卡片（rows 3–6）已在頂部，無需移動
- [x] 2.2 確認解讀說明（rows 8–11）緊接在結果下方
- [x] 2.3 確認排序數據表（rows 13+）在最下方

## 3. MonteCarlo 分頁重排（統計結果 + 圖表置頂）

- [x] 3.1 重寫 `setupMonteCarlo()`：將 P5/P50/P95 統計結果移至 rows 4–8（緊接標題）
- [x] 3.2 將圖表數據（H 欄）錨點調整至 rows 9–13
- [x] 3.3 將基礎參數（μ、σ）移至 rows 15–18
- [x] 3.4 將路徑明細區塊移至 rows 20+（simStartRow 更新）
- [x] 3.5 更新扇形圖與長條圖的 `setPosition` 列號，使圖表緊鄰統計結果
- [x] 3.6 更新解讀說明的列號（simEndRow + offset）

## 4. Portfolio 分頁 Section 5 重排

- [x] 4.1 重寫 `setupPortfolio()` Section 5：P5/P50/P95 統計結果移至 μ/σ 參數之前
- [x] 4.2 調整扇形圖數據欄（F-I）列號，使其對應新的統計結果列
- [x] 4.3 更新路徑終值 PERCENTILE 公式的列號參照（simStart/simEnd）
- [x] 4.4 更新圖表 `setPosition` 列號
- [x] 4.5 確認 `portfolio_returns` 命名範圍（L20:L139）未受影響

## 5. 驗收測試

- [x] 5.1 執行 `buildSheet()`，確認五個分頁均正確建立
- [x] 5.2 在 Raw Data 貼入測試數據，確認 Individual、VaR、MonteCarlo 計算結果正確
- [x] 5.3 在 Portfolio 貼入兩支股票數據，確認加權組合計算正確
- [x] 5.4 開啟各分頁確認不需捲動即可看到核心結果
- [x] 5.5 按 F9 確認 MonteCarlo 與 Portfolio 的蒙地卡羅公式正常重新計算
