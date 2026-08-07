## ADDED Requirements

### Requirement: Pearson 相關係數計算
系統 SHALL 提供 `calcPearsonCorrelation(xs, ys)` 純函式，輸入兩個等長的數字陣列，輸出 Pearson 相關係數 r ∈ [−1, +1]。

#### Scenario: 等長陣列輸入
- **WHEN** `xs.length === ys.length` 且 `length >= 2`
- **THEN** 函式回傳 Pearson r 值

#### Scenario: 完全正相關
- **WHEN** xs = [1, 2, 3]、ys = [2, 4, 6]
- **THEN** r 接近 +1.0（容許誤差 < 0.0001）

#### Scenario: 完全負相關
- **WHEN** xs = [1, 2, 3]、ys = [3, 2, 1]
- **THEN** r 接近 −1.0

#### Scenario: 無相關（隨機）
- **WHEN** xs = [1, 2, 3, 4]、ys = [3, 1, 4, 2]
- **THEN** |r| < 0.5

#### Scenario: 分母為 0
- **WHEN** 所有 xs 相同（std = 0）或所有 ys 相同
- **THEN** r = 0（無法計算則視為無相關）

#### Scenario: 樣本太少
- **WHEN** `length < 2`
- **THEN** r = 0

#### Scenario: 陣列長度不一致
- **WHEN** `xs.length !== ys.length`
- **THEN** throw Error（呼叫端錯誤）

### Requirement: 相關性解讀文字
系統 SHALL 提供 `interpretCorrelation(r)` 函式，將 Pearson r 值轉為中文解讀文字。

#### Scenario: 強正相關
- **WHEN** `r >= 0.7`
- **THEN** 回傳「強正相關：持有越久報酬越高」

#### Scenario: 中度正相關
- **WHEN** `0.3 <= r < 0.7`
- **THEN** 回傳「中度正相關：持有時間略有助於報酬」

#### Scenario: 無顯著關聯
- **WHEN** `-0.3 < r < 0.3`
- **THEN** 回傳「無顯著關聯：持有期間不影響報酬」

#### Scenario: 中度負相關
- **WHEN** `-0.7 < r <= -0.3`
- **THEN** 回傳「中度負相關：持有越久報酬略差」

#### Scenario: 強負相關
- **WHEN** `r <= -0.7`
- **THEN** 回傳「強負相關：持有越久報酬越差」

### Requirement: 持有天數 vs 報酬率散布圖
系統 SHALL 提供 `HoldingReturnScatter` 元件，輸入 Trade 陣列，渲染 Recharts ScatterChart。

#### Scenario: 樣本不足不渲染圖
- **WHEN** `trades.length < 5`
- **THEN** 元件回傳 null 或顯示「樣本不足無法計算相關性（需要至少 5 筆）」訊息，不渲染圖表

#### Scenario: 散布圖渲染
- **WHEN** `trades.length >= 5`
- **THEN** 渲染 Recharts ScatterChart，每筆 trade 一點，x = 持有天數（`daysBetween(buyDate, sellDate)`），y = 報酬率（`returnRate × 100` 換成 %）

#### Scenario: 點配色紅綠跌
- **WHEN** 渲染散布圖點
- **THEN** `returnRate > 0` 紅色、`returnRate < 0` 綠色、`returnRate === 0` 中性灰

#### Scenario: r 值顯示
- **WHEN** 散布圖渲染
- **THEN** 圖表上方或下方顯示「相關係數 r = X.XX」+ 解讀文字

#### Scenario: 軸標籤
- **WHEN** 圖表渲染
- **THEN** x 軸標籤「持有天數」、y 軸標籤「報酬率 (%)」、標題「持有天數 vs 報酬率」

#### Scenario: Tooltip 樣式
- **WHEN** 滑鼠 hover 某點
- **THEN** Tooltip 顯示「{stockName} | 持有 X 天 | 報酬 ±Y.Y%」，樣式沿用 `utils/chartStyle.ts` 的 `TOOLTIP_STYLE`
