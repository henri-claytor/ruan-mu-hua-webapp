## Why

現有 Web App 已具備基礎運算邏輯，但設計系統未對齊 iOS Finance Light Theme 規範、功能模組各自孤立（資料無法跨頁保留）、個股頁面缺少 VaR 與蒙地卡羅、也無資料匯入匯出支援，導致實際授課演示體驗不佳。本次全面重規劃，提升工具的完整性、視覺一致性與課堂可用性。

## What Changes

- **設計系統全面對齊**：以 CLAUDE.md 定義的 iOS Finance Light Theme token（bg-app / bg-surface / text-main / text-dim 等）替換現有的 generic Tailwind gray class，字型從 `display` 到 `caption` 依 token 使用，禁止硬編 `text-[#xxx]`
- **NavBar 重設計**：改為固定側邊欄（桌機）+ 底部導覽（手機），active 狀態顯示 `border-l-[3px] border-blue-500`
- **個股頁面擴充**：新增 VaR 95%/99%（含直方圖）與蒙地卡羅 1/3/5 年模擬（P5/P50/P95 扇形圖），與投資組合頁對齊
- **跨頁資料持久化**：輸入資料以 localStorage 儲存，切換頁面不遺失
- **資料匯入升級**：支援 CSV 貼上（逗號 / Tab 分隔）、百分比格式（`3.12%`）自動轉換
- **結果匯出**：提供「複製摘要文字」與「下載圖表 PNG」功能
- **個股比較**：可同時輸入兩支股票，並排顯示 EV / VaR / H 值比較表
- **Recharts 樣式統一**：所有圖表 tooltip / axis 從 `utils/chartStyle.ts` 匯入 `TOOLTIP_STYLE` / `AXIS_TICK_STYLE`

## Capabilities

### New Capabilities

- `design-system-tokens`: 在 CSS 與 Tailwind 中實作 iOS Finance Light Theme 設計 token，包含所有顏色語意、字型大小 token、間距規範，並建立 `chartStyle.ts` 供全站圖表使用
- `data-persistence`: 以 Zustand + localStorage 實作全域狀態管理，讓個股、組合、Hurst 三頁的輸入資料在頁面切換後保留
- `data-import-export`: 支援 CSV 貼上（含 Tab 分隔）、百分比字串自動解析；結果區提供「複製文字摘要」與「下載 PNG」按鈕
- `individual-var-montecarlo`: 個股頁面新增 VaR 95%/99%（直方圖）與蒙地卡羅模擬（扇形圖），分析完整度與投資組合頁對齊
- `stock-comparison`: 新增比較頁（/compare），支援兩支股票並排 EV / VaR / H 值對照，以顏色高亮標示優勢方

### Modified Capabilities

- `individual-ev-calculator`: 新增 VaR 與蒙地卡羅結果區塊，result-first layout 保留但內容擴充
- `interactive-charts`: 全站圖表改用 `chartStyle.ts` token；FanChart 新增時間刻度切換（1Y / 3Y / 5Y）
- `result-first-layout`: NavBar 改為側邊欄 + 底部導覽，Result-First 置頂邏輯保留，新增 skeleton 載入態與空態 illustration

## Impact

- `src/index.css`：新增設計 token CSS 變數與 Tailwind utility class
- `tailwind.config.ts`：擴充 theme 對應語意 token
- `src/store/`：新增 Zustand store（`useAppStore.ts`）
- `src/utils/chartStyle.ts`：新增 Recharts 共用樣式常數
- `src/components/NavBar.tsx`：重寫為側邊欄 + 底部導覽
- `src/pages/IndividualPage.tsx`：新增 VaR + Monte Carlo 結果區
- `src/pages/ComparePage.tsx`：全新比較頁
- `src/App.tsx`：新增 `/compare` route
- 新增依賴：`zustand`（狀態管理）、`html2canvas`（PNG 匯出）
