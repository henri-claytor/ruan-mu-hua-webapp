## 0. 手動「計算組合」按鈕

- [x] 0.1 新增 `computed` state（預設 false）
- [x] 0.2 加 useEffect：stocks / weights / 任何 returns 變動 → reset `computed = false`
- [x] 0.3 在「組合加權配置」區塊或頂部 actions 加「計算組合」`btn-solid`
- [x] 0.4 按鈕狀態：未 ready disabled / ready 且未計算 →「計算組合」/ 已計算 →「重新計算」/ 載入中 →「載入中...」
- [x] 0.5 結果區改為 `computed && ready` 才渲染

## 1. PortfolioVarBlock 改造

- [x] 1.1 完整改寫：主卡 95% 下行虧損（金邊 + 主判斷 chip + 風險等級徽章 + 40px 數字 + 底層樣本說明）
- [x] 1.2 99% 改為橫向參考列（與個股 VarBlock 同款）
- [x] 1.3 Histogram 移到區塊底
- [x] 1.4 命名修正：所有「VaR」字眼移除，使用「下行虧損」

## 2. PortfolioMcBlock 改造

- [x] 2.1 移除 Hero 大卡
- [x] 2.2 1 年 / 3 年 / 5 年三卡並排
- [x] 2.3 5 年卡採主判斷樣式（金邊 + 主判斷 chip + 40px + μ/σ）
- [x] 2.4 1 年 / 3 年卡採普通樣式（cream + 36px）
- [x] 2.5 FanChart 在最下

## 3. PortfolioPage 區塊順序調整

- [x] 3.1 ActionGuide 移到頂部（Action buttons 之後第一個）
- [x] 3.2 新增 FractalDimensionBlock 在 Hurst 之後
- [x] 3.3 確認區塊順序：操作建議 → EV → 對比 → VaR → Hurst → D → MC

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 通過
- [x] 4.2 `npx vitest run` 全部通過
- [x] 4.3 `npm run build` 通過
- [x] 4.4 瀏覽器確認 PortfolioPage：
  - 操作建議在頂、金邊強化
  - VaR 主卡金邊 + 99% 橫列
  - MC 3 卡並排、5 年主判斷
  - D 區塊出現
  - 命名一致
- [x] 4.5 部署 Vercel
