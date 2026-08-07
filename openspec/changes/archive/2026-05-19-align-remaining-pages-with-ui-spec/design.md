# Design: 其餘分析頁 ui-spec 對齊

## Context

`apply-course-theme-redesign` 已完成全站 tokens 與 HomePage / IndividualPage 的對齊。本 change 處理 Portfolio / Compare / Performance 三頁，使用 ui-spec.html 範本作為視覺真實值。

ui-spec 的標準頁面結構：
```
.inner
├── .page-hd (h1 + tag + 清除連結)
├── .page-sub
├── .field（含 input / chips / 雙欄）
├── .actions（按鈕列：btn-ghost + btn-solid）
└── .panel × N（含 panel-title + panel-sub + 內容）
```

## Goals / Non-Goals

**Goals:**
- 三頁套用 ui-spec 範本結構與元件樣式
- 元件視覺對齊：port-row / stock-chips / cmp-table / metrics-grid / upload-area / diag-item / sbadge
- 不改任何計算邏輯、資料流、tests

**Non-Goals:**
- 不改 ResultCard 結構（已在前一 change 處理）
- 不改 Recharts 配色（前一 change 已對齊）
- 不改頁面內容資訊架構（只動排版與配色）
- 不改 PDF / Excel 匯出格式
- 不做手機 RWD（後續另一 change）

## Decisions

### D1 — Portfolio 加入股票區與 chips

**決策**：

```tsx
<div className="bg-surface border border-base rounded-lg p-[18px_22px] mb-[18px]">
  <div className="text-[11px] text-dim tracking-[1px] mb-2.5">加入股票</div>
  <div className="flex gap-2.5">
    <StockSelector className="flex-1" />
    <button className="btn-solid whitespace-nowrap">＋ 加入</button>
  </div>
  <div className="flex flex-wrap gap-2 mt-3">
    {portfolio.stocks.map((s) => (
      <span className="chip">
        {s.id} {s.name}
        <span className="chip-rm" onClick={() => remove(s.id)}>×</span>
      </span>
    ))}
  </div>
</div>
```

**chip CSS（全域）**：

```css
.chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; background:rgba(154,122,46,0.1); border:1px solid rgba(154,122,46,0.2); border-radius:20px; font-size:12px; color:var(--color-gold-dark); }
.chip-rm { cursor:pointer; color:var(--color-dim); line-height:1; font-size:14px; transition:color .15s; }
.chip-rm:hover { color:var(--color-red); }
```

### D2 — Portfolio 組合加權配置 port-row

**決策**：在「組合加權配置」panel 中替換為 port-row 排版（5 欄：名稱 / 權重% / 進度條 / 貢獻 EV / × 移除）：

```tsx
<div className="flex items-center gap-3 py-2.5 border-b border-[rgba(154,122,46,0.08)] last:border-b-0">
  <span className="flex-1 text-[13px] text-main">{stock.name}</span>
  <span className="w-[60px] text-right text-[12px] text-dim">{weight}%</span>
  <div className="flex-[2] h-1.5 bg-[rgba(154,122,46,0.1)] rounded-full overflow-hidden">
    <div className="h-full bg-gold-dark rounded-full transition-[width] duration-400" style={{ width: `${weight}%` }} />
  </div>
  <span className="w-[70px] text-right text-[12.5px] font-semibold text-red-700">{fmtPct(stock.ev)}</span>
  <span className="cursor-pointer text-dim hover:text-red-700 text-base leading-none">×</span>
</div>
```

### D3 — Portfolio 風險與報酬概覽 — 3 cols + stats-row + sbadge

**決策**：保留現有 PortfolioPerformanceBlock 但**改用 ui-spec 的 3 cols + stats-row + sbadge 樣式**（或新增專屬 block 替換）。三個 cols：EV / VaR / Hurst。

```tsx
<div className="grid grid-cols-3 gap-3">
  <Evcol label="組合年化 EV" value={`+${ev}%`} hint="加權平均期望報酬" valueColor="text-red-700" />
  <Evcol label="組合 VaR (95%)" value={`-${var}%`} hint="最大可能損失下限" valueColor="text-green-700" />
  <Evcol label="組合 Hurst" value={hurst.toFixed(2)} hint={hurstHint} valueColor="text-gold-dark" />
</div>
<div className="stats-row">
  <span>模擬結果</span><Sdiv />
  <span>P5 <span className="sv neg">{p5}%</span></span><Sdiv />
  <span>P50 <span className="sv pos">{p50}%</span></span><Sdiv />
  <span>P95 <span className="sv pos">{p95}%</span></span>
</div>
<div className="sbadge"><div className="sdot" /> 整體配置具正期望值，建議維持現有比例</div>
```

### D4 — Compare 雙欄輸入 + cmp-table + 綜合建議

**決策**：

```tsx
<div className="field">
  <div className="grid grid-cols-2 gap-3">
    <div><div className="field-label">股票 A</div><StockSelector ... /></div>
    <div><div className="field-label">股票 B</div><StockSelector ... /></div>
  </div>
</div>
<div className="actions">
  <button className="btn-ghost">複製摘要</button>
  <button className="btn-solid">開始比較</button>
</div>
<Panel title="指標對比總覽" sub="綠色底色為該指標優勢方">
  <CmpTable rows={comparisonRows} />
</Panel>
<Panel title="綜合建議" sub="基於多維度指標的配置參考">
  <DiagItem type="ok">...</DiagItem>
  <DiagItem type="warn">...</DiagItem>
</Panel>
```

**CmpTable 樣式**：

```css
.cmp-table { width:100%; border-collapse:collapse; font-size:12.5px; }
.cmp-table th { font-family:serif; font-size:11px; letter-spacing:1px; color:var(--color-dim); padding:10px 14px; text-align:left; border-bottom:1px solid rgba(154,122,46,0.15); }
.cmp-table td { padding:12px 14px; border-bottom:1px solid rgba(154,122,46,0.08); color:var(--color-main2); }
.cmp-table tr:last-child td { border-bottom:none; }
.cmp-table tr:hover td { background:rgba(154,122,46,0.03); }
.cmp-table td.win { color:var(--color-grn); font-weight:600; background:rgba(46,125,82,0.05); }
.cmp-table td.metric { color:var(--color-dim); font-size:11.5px; }
.cmp-table td.num { font-family:serif; font-size:14px; font-weight:700; }
.cmp-table td.num.red { color:var(--color-red); }
.cmp-table td.num.grn { color:var(--color-grn); }
```

**注意**：ui-spec 用綠底高亮「優勢方」，但實務上我們有紅漲綠跌語意。決定：**沿用 ui-spec 的綠底**（這裡綠色代表「優勢/推薦」，不衝突報酬色語意，因為這是 cmp 上下文）。

### D5 — Performance Upload Area

**決策**：替換現有 TradeFileUpload 樣式為 ui-spec 風格：

```tsx
<div className="bg-surface border-2 border-dashed border-[rgba(154,122,46,0.25)] rounded-lg p-10 text-center cursor-pointer hover:border-[#9a7a2e] hover:bg-[rgba(154,122,46,0.04)] transition-all mb-[18px]">
  <input type="file" accept=".csv" className="hidden" />
  <Icon.Upload className="text-gold-dark mb-2.5 mx-auto" size={36} />
  <div className="text-[13.5px] text-main2 mb-1">上傳交易紀錄 CSV</div>
  <div className="text-[11.5px] text-dim">或拖曳檔案至此 · 支援 .csv 格式</div>
</div>
```

### D6 — Performance Metrics Grid

**決策**：PortfolioPerformanceBlock 已存在 8 metric cards。改造為 ui-spec 的 metric-card 樣式（cream + serif），網格從目前 8 個改回 ui-spec 範本的 6 個（勝率 / 賠率 / 獲利因子 / 平均獲利 / 平均虧損 / 最大連虧），或保留 8 個但全部套用新樣式。**決定：保留 8 個，全部套用 metric-card 樣式**（不刪除既有指標）。

```tsx
<div className="bg-card2 border border-base rounded-lg p-4">
  <div className="text-[10.5px] text-dim tracking-[1px] mb-1.5">{label}</div>
  <div className={`font-serif text-[22px] font-bold leading-none ${valueColor}`}>{value}</div>
  <div className="text-[10.5px] text-dim mt-1">{note}</div>
</div>
```

### D7 — Performance Diagnosis 三色 diag-item

**決策**：DiagnosisPanel 已有四色（advantage / alert / warning / note / info）。對齊 ui-spec 的三色 diag-item：

| level | ui-spec class | 背景 | 邊框 | 文字 | icon 色 |
|-------|---------------|------|------|------|---------|
| advantage / ok | `.diag-item.ok` | bg-neg-soft | rgba(46,125,82,0.15) | text-neg | green |
| warning / note | `.diag-item.warn` | #fef9ec | rgba(201,168,76,0.2) | text-gold-dark | gold-dark |
| alert / bad | `.diag-item.bad` | bg-pos-soft | rgba(192,57,43,0.15) | text-pos | red |
| info | （沿用 warn 樣式） | | | | |

icon 全部用 SVG 對應符號（check / alert-triangle / x-circle）。

### D8 — 共用元件抽取

**決策**：建立 3 個共用元件以避免重複：

- `src/components/ui/Panel.tsx`：`<Panel title sub>{children}</Panel>` → 取代 inline panel className 重複
- `src/components/ui/StatusBadge.tsx`：`<StatusBadge>{message}</StatusBadge>` → sbadge 樣式
- `src/components/ui/Sdiv.tsx`：`<Sdiv />` → stats-row 直線分隔

並在 index.css 加入 utility class：`.chip`, `.chip-rm`, `.cmp-table`, `.stats-row`, `.diag-item.ok/warn/bad`, `.upload-area`, `.port-row`, `.field-label`, `.btn-ghost`, `.btn-solid`，讓元件 markup 簡潔。

### D9 — Migration 順序

1. **Phase 1**：擴充 `index.css` 加入所有 ui-spec utility class（chip / cmp-table / stats-row / diag-item / port-row / btn / field / upload-area）
2. **Phase 2**：抽 `<Panel>` / `<StatusBadge>` / `<Sdiv>` 共用元件
3. **Phase 3**：Portfolio 頁改造（加入 stocks + port-row + 3 cols + stats-row + sbadge）
4. **Phase 4**：Compare 頁改造（雙欄 field + cmp-table + diag-items）
5. **Phase 5**：Performance 頁改造（upload-area + metrics-grid + 3 色 diag-item）
6. **Phase 6**：驗證（tsc / vitest / build / 瀏覽器 / Vercel）

## Risks / Trade-offs

- **既有 DiagnosisPanel 雙軸結構**：前一 change 引入「優勢 / 風險」雙欄。本 change 不動雙欄結構，只調個別 diag-item 配色細節
- **PortfolioPerformanceBlock 8 卡 vs ui-spec 6 卡**：保留 8 卡可訊息更完整，視覺仍對齊 metric-card 樣式
- **cmp-table 綠色高亮 vs 紅漲綠跌**：在「指標對比」這個上下文，綠色代表「優勢方」，不衝突，可接受
- **共用元件抽取增加檔案數**：3 個小元件值得，能簡化頁面 markup
- **既有 `bg-surface rounded-2xl border border-base p-6` 慣例**：改用 `<Panel>` 後可逐步替換，本 change 先動 3 頁
