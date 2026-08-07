## ADDED Requirements

### Requirement: HomePage 工具卡片涵蓋全部 4 個分析功能
HomePage SHALL 在工具卡片區塊呈現全部 4 個分析功能（個股、組合、比較、績效），並依「前向 / 後向」分析方向分為兩個視覺群組。

#### Scenario: 前向分析群組（3 張卡）
- **WHEN** HomePage 渲染
- **THEN** 顯示「進場前評估」H2 標題，下方為 3 欄 grid（md:grid-cols-3）含「個股分析」、「投資組合」、「比較分析」三張卡片，連結指向 `/individual`、`/portfolio`、`/compare`

#### Scenario: 後向分析群組（1 張卡）
- **WHEN** HomePage 渲染
- **THEN** 顯示「出場後反思」H2 標題，下方為 1 欄 grid 含「績效分析」卡片，連結指向 `/performance`

#### Scenario: 績效分析卡片內容
- **WHEN** 績效分析卡片渲染
- **THEN** 顯示 Icon.ClipboardCheck、標題「績效分析」、說明「上傳已完成的交易紀錄，計算勝率、賠率、獲利因子；自動診斷打法品質與資金管理問題，可匯出 PDF / Excel 報告。」、配色為紫色 hover 變色（hover:border-purple-300 hover:bg-purple-50）

### Requirement: HomePage Hero 副標反映前後向分析
HomePage 的 Hero 區塊副標 SHALL 兩句結構強化「進場前 + 出場後」的閉環概念。

#### Scenario: 副標文字
- **WHEN** Hero 區塊渲染
- **THEN** 副標顯示兩句：「進場前用市場資料評估標的；出場後用交易紀錄反思績效」+「一站式投資分析工具」

### Requirement: HomePage 計算邏輯說明涵蓋績效指標
HomePage 的「計算邏輯說明」區塊 SHALL 由 3 欄擴為 4 欄，新增「賠率與獲利因子」一欄。

#### Scenario: 4 欄並列顯示
- **WHEN** 計算邏輯說明區塊渲染
- **THEN** 顯示 4 個說明卡片：EV、VaR、Hurst、賠率 / 獲利因子，使用 `md:grid-cols-2 lg:grid-cols-4` 響應式 layout

#### Scenario: 賠率與獲利因子內容
- **WHEN** 第 4 個說明卡片渲染
- **THEN** 標題「賠率與獲利因子」，公式內容包含「賠率 = Avg Gain / Avg Loss」與「獲利因子 = Σ獲利金額 / |Σ虧損金額|」

### Requirement: HomePage 使用說明涵蓋績效分析流程
HomePage 的「如何使用」區塊 SHALL 在既有 4 步驟（前向流程）後，加上第 5 條獨立段落（後向流程）。

#### Scenario: 既有 4 步驟保留
- **WHEN** 使用說明區塊渲染
- **THEN** 1–4 步驟與原版內容相同（不變動）

#### Scenario: 第 5 條獨立段落
- **WHEN** 使用說明區塊渲染
- **THEN** 第 4 條後顯示「—— 或 ——」分隔提示，下方為第 5 條：「前往「績效分析」上傳已完成的交易紀錄（CSV 或手動輸入），系統自動產生勝率、賠率、獲利因子分析、4 象限診斷與 PDF / Excel 報告」
