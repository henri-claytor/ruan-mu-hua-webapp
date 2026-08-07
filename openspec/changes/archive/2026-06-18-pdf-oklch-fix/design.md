## Context

Tailwind v4 generated CSS 使用 `oklch()` 顏色函式（如 `bg-red-50` → `background-color: oklch(...)`）。`html2canvas@1.4.1` 解析器只支援傳統色彩值（hex、rgb、rgba、hsl），遇 `oklch()` 即拋錯：

```
Error: Attempting to parse an unsupported color function "oklch"
```

實測 `/performance` 頁面點 PDF 匯出按鈕即觸發此錯誤。

社群有兩個常見解法：
1. **`html2canvas-pro`**：社群 fork，加上 `oklch / lab / color-mix` 等現代 CSS 顏色函式支援。API 與 `html2canvas` 完全相同（drop-in）
2. **CSS workaround**：在截圖前注入一段 CSS 將 oklch 強制覆寫為 rgb fallback；缺點是要硬編顏色映射，每次 Tailwind 升級都要對

## Goals / Non-Goals

**Goals:**
- PDF 匯出能成功跑完，產出含 5 區塊（標頭 + 章一 + 章二 + 章三 + footer）的 A4 PDF
- 對 exportPdf.ts 改動極小（理想：1 行 import 改名）
- 不破壞 Excel / CSV 匯出

**Non-Goals:**
- 不重寫 PDF 截圖機制
- 不引入新 CSS-in-JS 框架
- 不調整 Tailwind 設定（不降級 oklch）

## Decisions

### 1. 換 `html2canvas-pro` 而非 CSS workaround
**決定**：使用 `html2canvas-pro`。

**理由**：
- CSS workaround 要硬編 oklch → rgb 顏色表，Tailwind 改色就壞
- `html2canvas-pro` 原生支援 oklch，未來新色函式（lab、color-mix）也順帶處理
- API 100% drop-in，僅換 import name
- 套件大小相近

**替代方案考量**：
- CSS workaround：維護負擔高
- 降級 Tailwind 至 v3：影響面太大，已踩到地雷不該回頭

### 2. 套件版本鎖定策略
**決定**：使用 `^` 寬鬆版本（與 html2canvas 既有寫法一致）。

**理由**：與專案既有寫法一致；`html2canvas-pro` 為穩定 fork，破壞性版本變化低。

### 3. 是否保留 html2canvas 作為 fallback
**決定**：不保留。直接移除 `html2canvas` 依賴。

**理由**：兩個套件 100% API 相容、檔案大小相近，雙保留只增加 bundle size。

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `html2canvas-pro` 未來停止維護 | 屆時可回退到 `html2canvas` 或評估新興替代品如 `modern-screenshot`；換回成本約 1 行 |
| API 行為細節差異（雖宣稱 drop-in） | 實測 PDF 匯出按鈕產出檔，比對與原版視覺差異；本 change 的驗證已涵蓋 |
| Bundle size 增加 | `html2canvas-pro` 大小與 `html2canvas` 相近，影響可忽略 |
| 套件未能解 oklch 問題（理論可能） | 截圖實測作為驗收條件；若失敗則 fallback 改 CSS workaround（不在本 change 範圍） |
