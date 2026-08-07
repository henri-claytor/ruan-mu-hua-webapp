## Context

現有 Web App（`ruan-mu-hua/web-app/`）是 React 18 + TypeScript 5 + Vite 5 + Tailwind v4 SPA，已部署於 Vercel（https://ruan-mu-hua-webapp.vercel.app）。運算邏輯（ev / var / montecarlo / hurst / portfolio）已驗證正確。本次重規劃針對 UI 設計層、狀態管理層、功能完整性三個維度做大幅升級，不動運算核心邏輯。

## Goals / Non-Goals

**Goals:**
- 以 CLAUDE.md iOS Finance Light Theme token 統一全站視覺
- 新增 Zustand 全域狀態，讓輸入資料跨頁保留
- 個股頁補齊 VaR + Monte Carlo，三大工具功能對等
- 新增比較頁（/compare）支援兩股並排分析
- 資料匯入支援 CSV + 百分比；匯出支援複製文字 + PNG
- 側邊欄（桌機）+ 底部導覽（手機）替換現有 top NavBar
- 所有 Recharts 圖表統一套用 `chartStyle.ts` token

**Non-Goals:**
- 不引入後端或雲端儲存（純前端 SPA）
- 不做使用者帳號 / 登入
- 不做深色模式（Light Theme Only）
- 不改動運算邏輯（ev.ts / var.ts / montecarlo.ts / hurst.ts / portfolio.ts）

## Decisions

### D1：狀態管理 — Zustand over Context/Redux

**選擇**：`zustand` + `zustand/middleware/persist`（localStorage）

**理由**：
- Context 在多層巢狀時需 Provider 包覆，且缺少 persistence middleware
- Redux 對此規模過重
- Zustand 無 boilerplate，且 `persist` middleware 直接對接 localStorage，一行搞定跨頁保留

**Store 結構**：
```ts
interface AppStore {
  // 個股
  individualRawText: string
  // 投資組合
  stocks: Stock[]
  // Hurst
  hurstRawText: string
  // 比較
  compareA: { name: string; rawText: string }
  compareB: { name: string; rawText: string }
  // setters...
}
```

### D2：設計 Token — CSS Variables + Tailwind extend

**選擇**：在 `index.css` 以 `:root {}` 定義 CSS 變數，再於 `tailwind.config.ts` 用 `extend.colors` 對應 semantic utility class。

**理由**：Tailwind v4 允許 `@theme` 語法，但 extend 模式與現有 v4 `@import "tailwindcss"` 並存最穩定。

**Token 對照表**（對齊 CLAUDE.md）：
```
--color-app: #F2F2F7        → bg-app
--color-surface: #FFFFFF    → bg-surface
--color-elevated: #F9F9F9   → bg-elevated
--color-border: #C6C6C8     → border-base
--color-main: #1C1C1E       → text-main
--color-dim: #6C6C70        → text-dim
--color-faint: #AEAEB2      → text-faint
```

字型 token（`--font-size-*`）：display 36px / h1 18px / h2 14px / body 13px / small 12px / label 11px / caption 10px。

### D3：NavBar 改為側邊欄 + 底部導覽

**選擇**：
- 桌機（md+）：左側固定寬度 200px sidebar，active 項目 `border-l-[3px] border-blue-500 bg-blue-50 text-blue-700`
- 手機（<md）：底部固定 tab bar，active 項目 `border-t-[3px] border-blue-500 text-blue-600`

**理由**：工具型 app 側邊欄比頂部 NavBar 更節省垂直空間，手機底部 tab 為 iOS 慣例，與「iOS Finance」設計語言一致。

### D4：圖表樣式統一 — chartStyle.ts

**選擇**：新增 `src/utils/chartStyle.ts`，匯出：
```ts
export const TOOLTIP_STYLE = { ... }   // Recharts contentStyle
export const AXIS_TICK_STYLE = { ... } // Recharts tick style
export const CHART_COLORS = { p5: '#DC2626', p50: '#2563EB', p95: '#16A34A' }
```
所有 FanChart / VarHistogram / HurstLineChart 改為 import 使用。

### D5：PNG 匯出 — html2canvas

**選擇**：`html2canvas` 截圖結果區 div → 下載 PNG

**理由**：無需後端，純前端操作。缺點是字型 / 圖表動畫需等待渲染完成（加 100ms delay 解決）。

**替代方案考慮**：`@react-pdf/renderer` 太重，`dom-to-image` 社群維護較少。

### D6：比較頁資料架構

比較頁（ComparePage）從 Zustand store 讀取 `compareA` / `compareB`，分別對兩份 rawText 執行 calcEV + calcVaR + calcHurst，並排顯示結果，不新增獨立 lib。

## Risks / Trade-offs

| 風險 | 緩解方案 |
|------|---------|
| html2canvas 截圖在 Recharts SVG 上可能有渲染問題 | 提供「複製文字摘要」作為備選；截圖前等 500ms |
| Zustand persist 導致舊 schema 資料結構衝突 | 版本化 storage key（`rmh-app-v2`），首次讀取若解析失敗則清空 |
| 個股頁新增 VaR + MC 後內容過長 | 採用 accordion 展開/收合，預設展開 EV，VaR / MC 可折疊 |
| Tailwind v4 CSS 變數與 extend 衝突 | 先在開發環境驗證，若不相容改用 `@layer base` inline style approach |
| html2canvas 需要新增 npm 依賴 | 已評估套件大小可接受（gzip ~50KB）；替代方案：Clipboard API 複製文字 |

## Migration Plan

1. 以 feature branch `feat/web-tool-redesign` 開發
2. 先改設計系統（token），驗證視覺正確
3. 加入 Zustand store，驗證資料持久化
4. 擴充個股頁 VaR + MC
5. 新增 ComparePage
6. 加入匯入/匯出功能
7. `npx vercel --prod` 從 repo root 部署
8. 回滾：Vercel 一鍵切回上一個 deployment

## Open Questions

- 比較頁是否需要第三支股票（三角比較）？→ 本次先做兩股並排，後續再擴充
- FanChart 時間軸切換（1Y/3Y/5Y）是否保存在 store？→ 本次存 React local state 即可，不持久化
