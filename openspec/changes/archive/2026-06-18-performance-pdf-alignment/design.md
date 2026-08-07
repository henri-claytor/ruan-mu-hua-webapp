## Context

Phase 1 完成後，Web /performance 頁版型已對齊 PDF 範本。PDF 匯出採 `html2canvas` 截 DOM 模式（`exportPdf.ts`），按 `PDF_SECTION_IDS` 陣列依序截圖各 section 拼成多頁 A4。目前 `PDF_SECTION_IDS` 為：

```
performance-banner, performance-recommendations, performance-diagnosis,
performance-dashboard, performance-matrix, performance-charts, performance-trades
```

差異：
1. 沒有 ReportHeaderBlock 的 id → 標頭不會被截入 PDF
2. 沒有 ComplianceFooter 的 id → 末頁免責文字不會被截入 PDF
3. `performance-charts` 與 `performance-trades` 在 PDF 範本中沒有對應章節 → 應從 PDF 拿掉
4. PDF 範本順序：標頭 → 章一（含 dashboard + diagnosis narrative）→ 章二（matrix）→ 章三（recommendations）→ footer
5. 檔名「performance-report」沒對齊範本中文標題「投資績效分析報告」

## Goals / Non-Goals

**Goals:**
- PDF 截圖順序與內容對齊範本 5 個區塊：標頭 / 章一 / 章二 / 章三 / footer
- ReportHeaderBlock + ComplianceFooter 加 DOM id 供截圖
- PDF 檔名中文化

**Non-Goals:**
- 不動 `exportPdf.ts` 的截圖核心邏輯（html2canvas + jsPDF）
- 不引入新套件
- 不重做 PDF 版型樣式（沿用 Web 截圖）
- 不影響 Excel / CSV 匯出
- 不改 Web 視覺呈現

## Decisions

### 1. PDF_SECTION_IDS 新順序
**決定**：
```
['performance-report-header',
 'performance-dashboard',     // 含 PortfolioPerformanceBlock + DiagnosisPanel narrative
 'performance-matrix',        // 含 QuadrantLegendBlock + StockQuadrantMatrix
 'performance-recommendations',
 'performance-compliance-footer']
```

**理由**：對齊 PDF 範本的 5 區塊順序。`performance-banner` 移除（隱私 banner 是 Web-only UI，PDF 範本沒有）。Charts 與 trades 移除（PDF 範本沒這兩章）。

### 2. 新 id 命名
- ReportHeaderBlock → `performance-report-header`
- ComplianceFooter → `performance-compliance-footer`

**理由**：與既有命名空間一致（`performance-*`）。

### 3. PDF 檔名中文化
**決定**：`投資績效分析報告_${YYYY-MM-DD}.pdf`

**理由**：對齊 PDF 範本標題；符合使用者「檔名含日期不要流水號」鐵律；中文檔名在 Windows / macOS 下載皆無編碼問題。

### 4. ReportHeaderBlock 空資料時不渲染的影響
**決定**：保留既有「空資料不渲染」邏輯不變。PDF 匯出按鈕本身在 `trades.length === 0` 時即 disabled，所以 ReportHeaderBlock 一定會在 PDF 匯出時存在。

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| PDF 拿掉 Charts/Trades 後，使用者若仍需要這兩節 → 體驗倒退 | 範本本來就沒這兩章，且 Excel 匯出仍含完整交易明細與圖表資料，使用者有完整資料來源 |
| 中文檔名在某些舊版瀏覽器下載可能編碼異常 | 主流瀏覽器（Chrome / Edge / Safari / Firefox）均支援 UTF-8 檔名；若使用者反映可改 fallback ASCII |
| html2canvas 截圖品質依 DOM 渲染狀態 → 標頭 / footer 渲染後若有 transition 動畫 → 截圖可能殘缺 | ReportHeaderBlock / ComplianceFooter 都是靜態元件無動畫，風險低 |
