## MODIFIED Requirements

### Requirement: HomePage 主視覺與功能入口

系統 SHALL 在 HomePage 提供 hero 主視覺、5 大功能入口卡片、與使用步驟說明，採課程質感風格。

#### Scenario: Hero 區塊

- **WHEN** HomePage 載入
- **THEN** 頁面頂部置中顯示 hero：
  - 主標「獲利加速輔助系統」（serif 34px / weight 900 / letter-spacing 5px / 色 `text-main`）
  - 副標兩行（sans 13px / 色 `text-dim`）：「進場前用市場資料評估標的；出場後用交易紀錄反思績效」+「一站式投資分析工具」

#### Scenario: 進場前評估 — 3 卡片 grid

- **WHEN** Hero 之後
- **THEN** 顯示 section label「進場前評估」（serif 15px / 色 `text-gold-dark` / letter-spacing 2px）
- **AND** 下方 3 欄等寬卡片（grid-cols-3，間距 13px）：
  - 個股分析（icon Bars） → `/individual`
  - 投資組合（icon Folder） → `/portfolio`
  - 比較分析（icon Pulse） → `/compare`
- **AND** 每張卡含：icon、serif 標題 16px、sans 描述 12px、底部「開始使用 →」cta

#### Scenario: 出場後反思 — 寬卡片

- **WHEN** 3 卡片之後
- **THEN** 顯示 section label「出場後反思」
- **AND** 下方寬卡片（card-wide，水平佈局）：績效分析 → `/performance`

#### Scenario: 使用步驟 howto

- **WHEN** 寬卡片之後
- **THEN** 顯示 howto 區塊（背景 `bg-card2`、padding 30px）
- **AND** 含標題「如何使用」（serif 13px / 金棕 / letter-spacing 3px）
- **AND** 下方 2×2 grid 4 個 step（圓形編號徽章 + 步驟說明文字）

#### Scenario: 卡片互動

- **WHEN** 滑鼠 hover 卡片
- **THEN** 卡片向上位移 3px + 加 shadow + 頂部金棕漸層橫條 scale 動畫
- **AND** 點擊卡片時觸發 ripple 效果，並導航到對應路由

### Requirement: 頁面進入動畫

系統 SHALL 為所有頁面主要區塊加上「漸入 + 上滑」動畫，提升質感。

#### Scenario: 主要元素逐項漸入

- **WHEN** 頁面切換進入
- **THEN** 主要元素套用 `u1`–`u6` class，依序在 0.05s 延遲遞增的時間點完成淡入 + 上滑動畫（duration 0.45s）

### Requirement: 全站採 Sidebar Layout

系統 SHALL 在 `App.tsx` 採左側固定 sidebar + 置中內容區架構，所有頁面共用此 layout。

#### Scenario: 全站佈局

- **WHEN** 任何路由渲染
- **THEN** 畫面結構為：左側 196px 固定 sidebar（深棕底 + 5 nav item）+ 右側主內容區（bg-app、`<Outlet />` 或頁面元件）
- **AND** 主內容區包在 `.inner`（max-width 980px、padding 52px 28px 100px）
