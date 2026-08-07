# Design: UI Patch P1–P3

## D1 — 雙軌字型策略（P1）

**決策**：不全面替換字型，而是建立兩條軌道：
- **中文 / 標籤軌道**：`system-ui`（body 預設，不動）
- **數字軌道**：`JetBrains Mono` + `font-variant-numeric: tabular-nums`，以 `.num` CSS class 切換

**理由**：中文需要跟隨系統字型以保持可讀性；純數字需要等寬以利對齊。混用兩套字型是業界標準做法（如 Bloomberg, Robinhood）。

**實作**：
- `@theme` 中定義 `--font-sans` / `--font-num`
- `.num` utility 同時設定 `font-family`、`font-variant-numeric`、`font-feature-settings`
- 最高槓桿點：`ResultCard` 的 value `<span>` 加 `num`，一個元件覆蓋 12+ KPI 顯示點

## D2 — SVG 圖標集（P2）

**決策**：自建極小 `icons.tsx`，不引入第三方圖標套件（如 lucide-react）

**理由**：
- App 只需 9 個圖標，引入完整套件會增加 bundle size
- SVG 以 `currentColor` 上色，自動跟隨容器的 text color，不需要額外維護顏色
- `stroke-width: 1.5` 在 14px–28px 的顯示尺寸下線條清晰一致

**移除 /hurst 首頁卡片**：/hurst 路由已在前一個 change（api-stock-integration）中 redirect 至首頁，首頁工具卡片同步移除，避免用戶點擊後被重導向造成困惑。

## D3 — CSS 變數色彩系統（P3）

**決策**：新增 11 個語意色彩 token 到 `@theme`，`chartStyle.ts` 用 `token()` helper 在執行時讀取 CSSOM

**理由**：
- Recharts 的 `stroke`、`fill` 屬性只接受 string，無法直接用 Tailwind class
- 將 hex 提升為 CSS 變數後，改主題只需改 `:root` 的變數定義，圖表自動更新
- `token()` helper 包含 SSR fallback（`typeof window === 'undefined'`）與空值 fallback

**token 命名原則**：語意優先（`--color-positive` 而非 `--color-green`），避免顏色名稱與語意耦合，為未來換色品牌留空間。

**注意事項**：`CHART_COLORS` 在 module import 時就求值（非 lazy），因此字型載入前 fallback 值會被使用。這在實務上問題不大（Google Fonts 先於 JS 執行，@theme 變數在 CSS 解析時即確定）。
