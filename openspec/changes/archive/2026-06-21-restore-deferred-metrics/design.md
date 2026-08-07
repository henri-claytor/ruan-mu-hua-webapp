## Context

Phase 1 簡化 `PortfolioPerformanceBlock` 時把 Hero 列、細節 inline 行、計算依據摺疊都拿掉，只留 4×2 KPI grid 對齊 PDF 範本。年化報酬率與最大回撤是「Phase 1 之前就已計算、有顯示」的指標，被連帶拿掉。

`KpiCard` 元件已有 `base` prop（Phase 1 內部結構保留）支援副資訊顯示，目前只「整體勝率」「平均持有天數」兩張卡片用到，其他 6 張沒給 base。

## Goals / Non-Goals

**Goals:**
- 「整體報酬率」KpiCard base 顯示年化報酬率
- 「總實現損益」KpiCard base 顯示最大回撤金額 + 百分比
- 紅綠跌色：最大回撤負值綠、零值中性
- 不擴 KPI grid（仍 4×2）

**Non-Goals:**
- 不動計算邏輯
- 不補持有天數×報酬相關性（下次再做，需新增計算 + 散布圖）
- 不改 PDF 截圖區塊清單
- 不改其他頁面

## Decisions

### 1. 為什麼擺 base 不是新增 KPI 卡
**決定**：擺進既有 KPI 卡的 base 副資訊位置，不擴 grid 成 5×2 或新增延伸區塊。

**理由**：
- 對齊 PDF 範本是 Phase 1 的承諾，擴 grid 會破壞此承諾
- Phase 1 之前的設計（commit history 可查）也是用 base 副資訊呈現年化報酬，是回到既有設計
- base 副資訊不夠醒目的弱點可接受 — 這 2 個指標是「延伸資訊」性質

### 2. 為什麼最大回撤擺「總實現損益」base
**決定**：最大回撤 → 總實現損益卡 base；年化報酬率 → 整體報酬率卡 base。

**理由**：
- 語意配對：絕對損益（元）配絕對回撤（元）；百分比報酬配百分比年化
- 視覺平衡：兩個「絕對表現」相關放一起、兩個「比例表現」相關放一起

### 3. maxDrawdownPct === 0 的處理
**決定**：顯示「無回撤」而非「0%」或不顯示。

**理由**：
- 「0%」可能讓使用者誤以為計算錯誤
- 不顯示則跟其他卡片有 base 不一致（破壞 grid 美感）
- 「無回撤」明確說明狀態

### 4. 格式
**決定**：
- 年化：`年化 +X.X%` 或 `年化 −X.X%`（沿用 fmtPct）
- 最大回撤：`最大回撤 −X,XXX 元（−Y.Y%）` 或 `無回撤`（依 maxDrawdownPct）

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| 加 base 後 KpiCard 高度不一致（有 base vs 沒 base）| Phase 1 已有此問題（部分卡片有 base 部分沒），CSS `h-full` 已處理對齊 |
| 最大回撤金額過大導致 base 文字截斷 | 沿用 fmtMoney 千分位 + Tailwind text-caption 字級，實測安全 |
| 紅綠跌色用錯（最大回撤是負面指標，但 PDF 範本沒有方向） | 沿用 colorByReturn 邏輯（負值綠、台股慣例），與 Phase 1 一致 |
