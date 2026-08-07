## ADDED Requirements

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
