## 1. Utility class（Phase 1）

- [x] 1.1 `src/index.css`：新增 `.chip` / `.chip-rm` 樣式
- [x] 1.2 `src/index.css`：新增 `.cmp-table` + `.cmp-table th` / `td` / `td.win` / `td.metric` / `td.num` 樣式
- [x] 1.3 `src/index.css`：新增 `.stats-row` + `.stat` + `.sv.pos/.neg/.neu` 樣式
- [x] 1.4 `src/index.css`：新增 `.diag-item` + `.ok/.warn/.bad` + `.diag-icon/.diag-title/.diag-desc` 樣式
- [x] 1.5 `src/index.css`：新增 `.port-row` + `.port-bar-wrap/.port-bar` 樣式
- [x] 1.6 `src/index.css`：新增 `.field` + `.field-label` 樣式
- [x] 1.7 `src/index.css`：新增 `.btn` + `.btn-ghost` + `.btn-solid` 樣式
- [x] 1.8 `src/index.css`：新增 `.upload-area` + `.upload-icon` + `.upload-txt` 樣式
- [x] 1.9 `src/index.css`：新增 `.panel` + `.panel-title` + `.panel-sub` 樣式
- [x] 1.10 `src/index.css`：新增 `.actions` 樣式

## 2. 共用元件（Phase 2）

- [x] 2.1 新增 `src/components/ui/Panel.tsx`：含 title / sub props
- [x] 2.2 新增 `src/components/ui/StatusBadge.tsx`：自動加 pulse dot
- [x] 2.3 新增 `src/components/ui/Sdiv.tsx`：分隔線

## 3. PortfolioPage 改造（Phase 3）

- [x] 3.1 page-hd + page-sub（serif h1 + 清除組合連結）
- [x] 3.2 「加入股票」field：含 StockSelector + 「＋ 加入」btn-solid + chips（既有 stocks）
- [x] 3.3 chips：每個股票 chip + × 移除（hover 紅色）
- [x] 3.4 actions row：複製摘要 btn-ghost + 計算組合 btn-solid
- [x] 3.5 「組合加權配置」panel + port-row（5 欄佈局：名稱 / 權重 / 進度條 / EV / ×）
- [x] 3.6 「組合風險與報酬概覽」panel：3 cols evcol + stats-row（P5/P50/P95，sdiv 分隔）+ sbadge 結論

## 4. ComparePage 改造（Phase 4）

- [x] 4.1 page-hd + page-sub
- [x] 4.2 field 雙欄 grid-cols-2（股票 A / 股票 B），各帶 field-label
- [x] 4.3 actions：複製摘要 + 開始比較
- [x] 4.4 「指標對比總覽」panel：實作 cmp-table 樣式（5 行 metric + 兩股值 + .win 高亮）
- [x] 4.5 「綜合建議」panel：2 個 diag-item（ok + warn）

## 5. PerformancePage 改造（Phase 5）

- [x] 5.1 `TradeFileUpload`：upload-area 樣式（dashed 金邊 + 金色 hover）
- [x] 5.2 actions：手動輸入 btn-ghost + 匯出報告 btn-solid
- [x] 5.3 `PortfolioPerformanceBlock`：8 個 metric-card 對齊 ui-spec metric-card 樣式（cream + serif）
- [x] 5.4 metric-cards 之後加 sbadge 整體結論
- [x] 5.5 `DiagnosisPanel`：每個 diag-item 改三色（ok / warn / bad），advantage→ok、warning→warn、alert→bad、note→warn、info→warn

## 6. 驗證（Phase 6）

- [x] 6.1 `npx tsc --noEmit` 通過
- [x] 6.2 `npx vitest run` 全部通過
- [x] 6.3 `npm run build` 通過
- [x] 6.4 瀏覽器手動確認：Portfolio / Compare / Performance 三頁視覺對齊 ui-spec
- [x] 6.5 部署 Vercel
