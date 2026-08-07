## MODIFIED Requirements

### Requirement: 側邊欄導覽（桌機）+ 底部 Tab Bar（手機）

系統 SHALL 將 NavBar 設計為：
- **桌機（md+）**：左側固定寬 200px 的 sidebar，含 Logo、頁面項目清單、active 項目以 `border-l-[3px] border-blue-500 bg-blue-50 text-blue-700` 標示
- **手機（<md）**：底部固定 tab bar，active 項目以 `border-t-[3px] border-blue-500 text-blue-600` 標示

導覽項目清單（順序）：
1. 🏠 首頁（/）
2. 📊 個股分析（/individual）
3. 🗂️ 投資組合（/portfolio）
4. ⚖️ 比較分析（/compare）
5. 📋 績效分析（/performance）

#### Scenario: 桌機側邊欄渲染

- **WHEN** 使用者在 768px 以上裝置開啟網站
- **THEN** 頁面左側顯示 200px 固定 sidebar，包含 5 個導覽項目，右側為主內容區

#### Scenario: 手機底部 tab bar 渲染

- **WHEN** 使用者在 768px 以下裝置開啟網站
- **THEN** 頁面底部顯示固定 tab bar，包含 5 個圖標（一字排開），頂部無 NavBar

#### Scenario: 績效分析項目 Active 標示

- **WHEN** 使用者在 `/performance` 頁面
- **THEN** 側邊欄（或底部 tab）的「績效分析」項目以藍色邊框與淡藍背景標示為 active

#### Scenario: 既有 4 個項目順序不變

- **WHEN** NavBar 渲染
- **THEN** 既有「首頁 / 個股分析 / 投資組合 / 比較分析」順序與圖示維持不變，「績效分析」加在最後一項
