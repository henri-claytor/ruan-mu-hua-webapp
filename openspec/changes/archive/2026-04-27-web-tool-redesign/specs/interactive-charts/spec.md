## ADDED Requirements

### Requirement: 全站圖表樣式由 chartStyle.ts 統一管理

系統 SHALL 建立 `src/utils/chartStyle.ts`，匯出以下常數，所有 Recharts 元件 MUST 從此檔案匯入，不得在各元件內定義 inline style 物件：

```ts
export const TOOLTIP_STYLE = {
  contentStyle: { background: '#fff', border: '1px solid #C6C6C8', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#6C6C70', fontWeight: 600 },
  itemStyle: { color: '#1C1C1E' },
}

export const AXIS_TICK_STYLE = {
  fontSize: 10,
  fill: '#AEAEB2',
}

export const CHART_COLORS = {
  p5: '#DC2626',    // red-600
  p50: '#2563EB',   // blue-600
  p95: '#16A34A',   // green-700
  var95: '#D97706', // amber-600
  var99: '#DC2626', // red-600
  hurst: '#2563EB', // blue-600
  positive: '#16A34A',
  negative: '#DC2626',
}
```

#### Scenario: FanChart 使用 chartStyle.ts

- **WHEN** FanChart 元件渲染
- **THEN** Recharts Tooltip 的 contentStyle 與 CartesianAxis 的 tick style 均從 `chartStyle.ts` 匯入，不含 inline 硬編值

#### Scenario: VarHistogram 使用 chartStyle.ts

- **WHEN** VarHistogram 元件渲染
- **THEN** 長條圖的軸刻度與 Tooltip 樣式均從 `chartStyle.ts` 匯入

#### Scenario: HurstLineChart 使用 chartStyle.ts

- **WHEN** HurstLineChart 元件渲染
- **THEN** 折線圖的軸刻度與 Tooltip 樣式均從 `chartStyle.ts` 匯入

### Requirement: FanChart 時間軸範圍切換

FanChart SHALL 提供 1Y / 3Y / 5Y 三個切換按鈕，允許使用者選擇顯示的模擬期間（12 / 36 / 60 個月），切換時圖表即時更新，選中狀態以 `border-b-[3px] border-blue-500` 標示。

#### Scenario: 預設顯示 5Y（60 個月）

- **WHEN** FanChart 首次渲染
- **THEN** 預設選取 5Y 按鈕，圖表顯示 60 個月資料

#### Scenario: 切換至 1Y

- **WHEN** 使用者點擊 1Y 按鈕
- **THEN** 圖表 X 軸縮短至 12，只顯示前 12 個月的 P5/P50/P95

### Requirement: 個股 VaR 直方圖（新增於 Individual 頁）

VarHistogram 圖表 SHALL 同時用於個股頁，輸入為個股報酬率陣列，行為與投資組合頁的 VarHistogram 完全一致。

#### Scenario: 個股 VarHistogram 正確渲染

- **WHEN** 個股頁輸入有效資料且 VaR 計算完成
- **THEN** 個股頁顯示 VarHistogram，直方圖以 10-12 個 bin 分布，VaR 95% 橘線與 VaR 99% 紅線正確標示

## MODIFIED Requirements

### Requirement: 圖表響應式佈局

所有圖表 SHALL 在不同螢幕尺寸下自動調整寬度，在行動裝置（寬度 < 768px）上以全寬顯示。桌機版圖表改為配合新側邊欄佈局，最大寬度依容器（扣除 200px sidebar）計算，不再以百分比固定。

#### Scenario: 桌面版圖表寬度（有側邊欄時）

- **WHEN** 瀏覽器寬度 ≥ 768px 且側邊欄展開（200px）
- **THEN** 圖表寬度填滿內容區容器，使用 `ResponsiveContainer width="100%"`

#### Scenario: 行動版圖表全寬

- **WHEN** 瀏覽器寬度 < 768px
- **THEN** 圖表以全寬顯示，數字卡片在上、圖表在下堆疊排列
