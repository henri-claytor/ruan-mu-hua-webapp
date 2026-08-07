## ADDED Requirements

### Requirement: 比較頁路由與入口

系統 SHALL 新增 `/compare` 路由，對應 `ComparePage` 元件，並在側邊欄 NavBar 新增「比較分析」導覽項目（icon：⚖️）。

#### Scenario: 導覽至比較頁

- **WHEN** 使用者點擊側邊欄「比較分析」
- **THEN** 頁面切換至 `/compare`，顯示比較頁標題「個股並排比較」

#### Scenario: 比較頁保留輸入資料

- **WHEN** 使用者在比較頁輸入股票 A/B 資料後切換至其他頁面再返回
- **THEN** 比較頁的輸入資料（透過 Zustand store）仍然存在

### Requirement: 兩股並排輸入區

比較頁 SHALL 以左右兩欄並排顯示股票 A 與股票 B 的輸入區塊，每欄含：名稱輸入、報酬率輸入框（textarea）、已讀取筆數。

#### Scenario: 並排輸入區渲染

- **WHEN** 使用者開啟比較頁
- **THEN** 頁面左半顯示「股票 A」輸入區，右半顯示「股票 B」輸入區

#### Scenario: 名稱可自訂

- **WHEN** 使用者修改股票 A 名稱輸入框
- **THEN** 比較結果標題欄位同步更新為使用者輸入的名稱

### Requirement: 並排指標比較表

比較頁結果 SHALL 以表格方式並排顯示兩股的以下指標，並以顏色高亮標示優勢方（綠色背景）：

| 指標 | 說明 |
|-----|-----|
| EV（期望值）| 較高者為優 |
| 勝率 | 較高者為優 |
| 實際賠率 | 較高者為優 |
| VaR 95% | 絕對值較小（虧損較少）者為優 |
| VaR 99% | 絕對值較小者為優 |
| Hurst H 值 | 依解讀說明顯示，不做單純大小比較 |

#### Scenario: EV 優勢方高亮

- **WHEN** 股票 A 的 EV 高於股票 B
- **THEN** 比較表格中 A 的 EV 欄位背景顯示淡綠色（`bg-green-50`）

#### Scenario: VaR 優勢方高亮（絕對值小者勝）

- **WHEN** 股票 A 的 VaR 95% 絕對值小於股票 B
- **THEN** 比較表格中 A 的 VaR 95% 欄位背景顯示淡綠色

#### Scenario: H 值無高亮，只顯示解讀

- **WHEN** 比較表格渲染 Hurst H 值列
- **THEN** 顯示兩股各自的 H 值數字與「趨勢延續型 / 隨機遊走型 / 均值回歸型」文字，不做優勢高亮

### Requirement: 至少一股有資料時顯示結果

比較頁 SHALL 在兩股均有至少 10 筆有效資料時顯示完整比較表，若其中一股資料不足則顯示「待輸入」佔位。

#### Scenario: 兩股均有資料時顯示完整比較

- **WHEN** 股票 A 與股票 B 均輸入至少 10 筆報酬率
- **THEN** 完整比較表顯示所有指標

#### Scenario: 僅一股有資料時部分顯示

- **WHEN** 股票 A 有資料但股票 B 尚未輸入
- **THEN** 比較表顯示股票 A 的計算結果，股票 B 欄位顯示「－ 待輸入」

## ADDED Requirements (time-scale alignment with individual page)

### Requirement: 比較頁期望報酬率採「最近 1 年」尺度

`ComparePage` 的期望報酬率、勝率、實際損益比 SHALL 採用個股頁的 medium scale（最近 1 年，日報酬 240 筆），與個股頁主判斷一致。

#### Scenario: 兩股皆 daily ≥ 240 筆

- **WHEN** A、B 兩股的 dailyReturns 都 ≥ 240
- **THEN** 期望報酬率 / 勝率 / 損益比皆來自 `calcMultiScaleEV.medium.ev`
- **AND** scale label 為「最近 1 年」

#### Scenario: 某股 daily 60–239 → fallback short

- **WHEN** 某股 dailyReturns 60–239
- **THEN** 該股的期望報酬率採 `calcMultiScaleEV.short`
- **AND** scale label 為「最近 3 個月」

#### Scenario: 某股 daily < 60 → fallback long

- **WHEN** 某股 dailyReturns < 60
- **THEN** 該股的期望報酬率採 `calcMultiScaleEV.long`（月報酬 60 筆）
- **AND** scale label 為「最近 5 年」

### Requirement: 比較表標示資料時間尺度

`ComparePage` 比較表頂部 SHALL 明確標示每個指標的時間尺度。

#### Scenario: 表頂說明區

- **WHEN** 比較表渲染
- **THEN** 表頂 banner 含兩行資訊：
  - 「🟢 綠色背景 = 該項目較佳」
  - 「資料尺度 — 期望報酬率：{scaleLabel} · 下行虧損 / 趨勢強度：{freqLabel}」

#### Scenario: 綜合勝出方副標

- **WHEN** 綜合勝出方主判斷卡渲染
- **THEN** 副標含「6 項指標統計 · 基於 {scaleLabel} 表現」

### Requirement: 不同股票尺度不一致時取 A 的尺度標示

當 A、B 兩股使用不同 scale（因樣本不足）時，表頂統一顯示 A 的 scale label，避免混淆。

#### Scenario: A medium、B short

- **WHEN** A 用 medium、B 用 short
- **THEN** 表頂 scale label 顯示「最近 1 年（A）/ 最近 3 個月（B）」雙標

## ADDED Requirements (dual recommendation cards)

### Requirement: 近期累積報酬指標

`ComparePage` SHALL 提供「近期累積報酬」指標，反映最近 60 個交易日（≈3 個月）的複利累積回報。

#### Scenario: 樣本足夠

- **WHEN** 某股 `dailyReturns.length >= 20`
- **THEN** 計算 `cumulativeReturn = Π(1 + ri) − 1` for `dailyReturns.slice(-60)`

#### Scenario: 樣本不足

- **WHEN** `dailyReturns.length < 20`
- **THEN** 近期累積報酬為 null，比較表該列顯示「—」

### Requirement: 比較表分兩段呈現

`ComparePage` 比較表 SHALL 分為「近期動能」與「長期穩定」兩段，每段含 section header row + 多個指標 row。

#### Scenario: 近期動能段

- **WHEN** 比較表渲染
- **THEN** 第一段為「近期動能（最近 3 個月 · 60 日）」，含 3 項：
  - 近期累積報酬
  - 近期勝率
  - 近期損益比

#### Scenario: 長期穩定段

- **WHEN** 近期動能段之後
- **THEN** 第二段為「長期穩定（最近 1 年 / 400 日）」，含 4 項：
  - 年化期望報酬率
  - 95% 下行虧損
  - 99% 下行虧損
  - 趨勢強度 H

### Requirement: 雙推薦卡（短線主判斷 + 長線次要）

`ComparePage` SHALL 提供雙推薦卡，並排顯示「短線推薦」與「長線推薦」。

#### Scenario: 短線推薦為主判斷

- **WHEN** 兩股都有完整近期資料
- **THEN** 「短線推薦」卡採金邊主判斷樣式 + 「🏆 主判斷」chip + 40px 大字
- **AND** 基於近期動能 3 項統計勝出方
- **AND** 副值顯示「A 勝 N / B 勝 M / 平手 K」

#### Scenario: 長線推薦為次要

- **WHEN** 兩股都有完整長期資料
- **THEN** 「長線推薦」卡採普通樣式（cream 底、1px 邊框）+ 28px 中字
- **AND** 基於長期穩定 4 項統計勝出方
- **AND** 副值顯示「A 勝 N / B 勝 M / 平手 K」

#### Scenario: 短線 / 長線結論可不同

- **WHEN** 兩段統計結果不同
- **THEN** 兩卡顯示不同的勝出方名稱，使用者依交易風格自行選擇

### Requirement: 移除舊單一「綜合勝出方」卡

`ComparePage` SHALL 移除舊版「綜合勝出方」單卡（6 項加總），改由雙推薦卡取代。
