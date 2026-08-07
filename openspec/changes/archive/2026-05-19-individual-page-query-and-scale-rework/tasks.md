## 1. lib/ev.ts — 計算窗口與 tier/label

- [x] 1.1 `ScaleEV` 介面新增 `tier: 'primary' | 'reference'` 與 `label: string`
- [x] 1.2 `calcMultiScaleEV(monthly, daily)`：
  - short = daily.slice(-60) → label「最近 3 個月」、tier primary、periods 252
  - medium = daily.slice(-240) → label「最近 1 年」、tier primary、periods 252
  - long = monthly.slice(-60) → label「最近 5 年」、tier reference、periods 12
- [x] 1.3 `calcPortfolioMultiScaleEV` 同步加 tier / label（組合頁先保留舊標題，tier 全 primary，後續再對齊）
- [x] 1.4 Divergence 判讀只看 short + medium（兩 primary）
  - 兩者皆有資料且同號 + gap < 0.3 → stable
  - 同號 + gap ≥ 0.3 → mixed
  - 短低於中 + gap > 0.3 → short-deteriorating
  - 短高於中 + gap > 0.3 → short-improving
  - 任一為 null → stable
- [x] 1.5 更新 `src/lib/ev.test.ts`：
  - 移除舊「短期 60 / 中期 36 / 長期全部」測試
  - 新增窗口斷言（windowSize 60/240/60、freq daily/daily/monthly）
  - 新增 tier 斷言（short/medium 為 primary、long 為 reference）
  - 新增 label 斷言
  - 更新 divergence 測試（只看 short + medium）

## 2. MultiScaleEVBlock — 視覺權重區分

- [x] 2.1 ScaleCard：標題改用 `result.label`（不再寫死「短期 / 中期 / 長期」）
- [x] 2.2 ScaleCard 接受 `tier` prop，reference tier 套弱化樣式：
  - 背景 `bg-elevated`（取代 `bg-card2`）
  - 數字字級降為 20px（原 24px）
  - 整體文字 `text-dim`
  - 標題後加「參考用」chip（金棕淡 tag）
- [x] 2.3 三卡 layout：前 2 卡 `grid-cols-2` 並排、第 3 卡單獨整行 full-width
- [x] 2.4 Divergence banner 文字依新規格：
  - stable：「近 3 個月與近 1 年趨勢一致」
  - mixed：「近 3 個月與近 1 年趨勢有差異」
  - short-improving：「⚠ 短期動能轉強：近 3 個月年化 EV 顯著高於近 1 年」
  - short-deteriorating：「⚠ 短期動能轉弱：近 3 個月年化 EV 顯著低於近 1 年」
- [x] 2.5 Hero 列「長期年化 EV」改為「年化 EV（最近 5 年）」，並標記為參考；或改用「最近 1 年」作為 Hero 主結論（更貼近使用者主要判斷依據）。**決定改用「最近 1 年」作 Hero**

## 3. IndividualPage — 手動查詢

- [x] 3.1 新增 `pendingCode` / `queriedCode` 兩個 state
- [x] 3.2 StockSelector 的 onSelect 只 setPendingCode，不發 API
- [x] 3.3 新增「查詢」按鈕（`.btn-solid`），onClick 呼叫 handleQuery
- [x] 3.4 handleQuery：fetch monthly + daily → 計算 evMulti/var/hurst/mc → setQueriedCode + setResults
- [x] 3.5 按鈕狀態：未選 disabled / pending !== queried → 「查詢」/ pending === queried → 「重新查詢」 / loading → 「查詢中...」
- [x] 3.6 保留 `?code=` URL 自動觸發查詢（mount 時 setPendingCode + handleQuery）
- [x] 3.7 移除 StockSelector 的自動 fetch 邏輯（如有）

## 4. StockSelector — 下拉清單滾動

- [x] 4.1 找到下拉清單 `<ul>` 或 `<div>` 容器
- [x] 4.2 加 `max-h-[300px] overflow-y-auto`
- [x] 4.3 確認 scroll bar 視覺呈現（瀏覽器測試）

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過（含 ev.test.ts 更新後）
- [x] 5.3 `npm run build` 通過
- [x] 5.4 瀏覽器確認：
  - 選股後不自動觸發
  - 按查詢才取資料
  - 下拉清單可滾動
  - 三卡顯示「最近 3 個月 / 最近 1 年 / 最近 5 年（參考）」
  - 第 3 卡明顯弱化
  - Divergence banner 文字符合新規格
- [x] 5.5 部署 Vercel
