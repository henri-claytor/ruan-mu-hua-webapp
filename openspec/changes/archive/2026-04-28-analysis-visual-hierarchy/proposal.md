# Proposal: 個股 / 組合分析頁視覺層次與命名調整

## Why

個股分析頁與投資組合頁的結果區塊存在三個共通問題：

1. **視覺權重扁平**：主要結論、中間指標、基礎統計、計算步驟全部以類似的卡片或區塊呈現，使用者無法第一時間鎖定結論
2. **區塊名稱不直覺**：「計算結果」「風險值（VaR）」「蒙地卡羅模擬」這些名稱要麼太籠統、要麼是技術術語，看了不知道在告訴你什麼
3. **資訊順序未反映認知流程**：蒙地卡羅是「未來推估」屬於補充資訊，目前緊跟在 EV 之後與「現況指標」混在一起

使用者的認知流程應該是：「現況評估（EV / VaR / Hurst）→ 未來推估（MC）→ 行動建議」。視覺與順序都應呼應這個流程。

## What Changes

### 區塊重新命名（主標 + 副標技術名稱）

| 原名稱 | 新名稱 | 副標 |
|--------|--------|------|
| 計算結果 | **期望報酬與賠率優勢** | EV 期望值分析 |
| ㄴ 基礎統計 | **勝敗率與平均盈虧** | — |
| ㄴ 計算步驟 | **EV 公式展開** | — |
| 風險值（VaR） | **下行風險：最壞情境虧損** | VaR 95% / 99% |
| 蒙地卡羅模擬（初始 100 萬） | **未來資產淨值模擬** | 蒙地卡羅，初始 100 萬 |
| Hurst 多尺度分析 | **趨勢延續性偵測** | Hurst 指數，60/120/240 日 |
| 建議行動參考 | （保留）| — |

### 區塊順序調整

新順序（IndividualPage 與 PortfolioPage 一致）：

```
1. 期望報酬與賠率優勢（EV）         ← 月頻
2. 下行風險：最壞情境虧損（VaR）     ← 日頻 / 月頻 fallback
3. 趨勢延續性偵測（Hurst）           ← 日頻 / 月頻 fallback
4. 未來資產淨值模擬（MC）            ← 月頻（補充推估）
5. 建議行動參考（ActionGuide）
```

- 移除「軌道分隔線」（MC 移走後語意弱）
- 改為在每個區塊副標附加頻率標注（如「使用月報酬 120 筆」）

### 三層視覺層次

每個分析區塊內部統一使用：
- **Hero 結論層**：主要結論值 + 標籤判讀（大字、深底色、加粗邊框）
- **中層指標**：支撐性指標（normal ResultCard）
- **弱化細節**：基礎統計改 inline 一行 + 計算步驟預設摺疊

### 適用範圍

- IndividualPage：四個區塊（EV / VaR / MC / Multi-Scale Hurst）+ 區塊順序調整
- PortfolioPage：四個區塊（EV / VaR / MC / 單尺度 Hurst）+ 區塊順序調整 + 命名同步

### PortfolioPage 額外改動：輸入設定區移到最上方並可摺疊

目前「股票選取與比重設定」區塊位於頁面最下方，使用者需要往下捲才能修改。改為：

- 移到頁面最上方（緊接頁面標題下）
- 包成可摺疊容器（disclosure），按鈕「▶ 展開股票選取 / ▼ 收折股票選取」
- 預設行為：未完成輸入時展開（讓使用者知道要選股）；輸入完成且結果已顯示時收合（讓結果聚焦）

## Capabilities

### New Capabilities
- （無新增 capability）

### Modified Capabilities
- `result-first-layout`：個股頁結果區塊改為三層視覺層次、區塊重新命名、調整順序、移除軌道分隔線
- `portfolio-analyzer`：投資組合頁套用同樣的視覺層次與命名規則

## Impact

- `src/components/ResultCard.tsx`：新增 `emphasis: 'hero' | 'normal' | 'muted'` prop
- `src/components/QuadrantBadge.tsx`：新增 `size: 'normal' | 'large'` prop
- `src/pages/IndividualPage.tsx`：四個區塊改造、移除軌道分隔線、MC 移到 ActionGuide 前、區塊重新命名
- `src/pages/PortfolioPage.tsx`：四個區塊套用同樣的視覺層次、命名、順序；股票選取與比重設定區塊移到頂部並改為可摺疊
- `src/components/charts/MultiScaleHurstBlock.tsx`：三尺度卡片標題弱化、套用新副標格式
- 無 API 異動、無 store 異動、無計算邏輯異動
