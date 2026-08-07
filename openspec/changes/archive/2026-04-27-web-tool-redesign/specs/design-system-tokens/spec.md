## ADDED Requirements

### Requirement: 語意顏色 Token 定義

系統 SHALL 在 `src/index.css` 以 CSS 變數定義所有語意顏色 token，並在 `tailwind.config.ts` 以 `extend.colors` 對應 utility class，使全站禁止硬編 `text-[#xxx]` / `bg-[#xxx]`。

Token 清單（對齊 CLAUDE.md iOS Finance Light Theme）：

| CSS 變數 | 值 | Tailwind utility |
|---------|---|-----------------|
| `--color-app` | `#F2F2F7` | `bg-app` |
| `--color-surface` | `#FFFFFF` | `bg-surface` |
| `--color-elevated` | `#F9F9F9` | `bg-elevated` |
| `--color-border` | `#C6C6C8` | `border-base` |
| `--color-main` | `#1C1C1E` | `text-main` |
| `--color-dim` | `#6C6C70` | `text-dim` |
| `--color-faint` | `#AEAEB2` | `text-faint` |

#### Scenario: 背景色正確套用

- **WHEN** 頁面載入完成
- **THEN** `<body>` 背景色為 `#F2F2F7`，白色卡片背景為 `#FFFFFF`

#### Scenario: 禁止硬編色值

- **WHEN** 任何元件使用 `text-[#xxx]` 或 `bg-[#xxx]`（Recharts stroke 除外）
- **THEN** CI/Lint 應標示警告（或 code review 拒絕）

### Requirement: 字型大小 Token 定義

系統 SHALL 在 CSS 中定義字型大小 token，KPI 數字使用 `display`（36px），標題層級使用 `h1`/`h2`，禁止 Tailwind `text-2xl`/`text-3xl` 於數字展示。

| Token | 大小 | 用途 |
|-------|-----|-----|
| `--font-size-display` | 36px | KPI 大數字 |
| `--font-size-h1` | 18px | 頁面標題 |
| `--font-size-h2` | 14px | 區塊標題 |
| `--font-size-body` | 13px | 正文 |
| `--font-size-small` | 12px | 輔助說明 |
| `--font-size-label` | 11px | 標籤 |
| `--font-size-caption` | 10px | 圖表刻度 |

#### Scenario: EV 數字使用 display token

- **WHEN** 個股 EV 結果顯示
- **THEN** EV 數字字型大小為 36px，套用 `display` token class

#### Scenario: 頁面標題使用 h1 token

- **WHEN** 任何頁面標題渲染
- **THEN** 標題字型大小為 18px，套用 `h1` token class

### Requirement: Status 色塊規範

系統 SHALL 以 `bg-*-50 + text-*-700`（light-first）顯示所有狀態徽章，禁止 `bg-*-500/15 + text-*-400`（深色模式殘留寫法）。

#### Scenario: 成功狀態徽章

- **WHEN** 顯示「高賠率正期望值」等正面判斷
- **THEN** 背景為 `bg-green-50`，文字為 `text-green-700`

#### Scenario: 警示狀態徽章

- **WHEN** 顯示 VaR 警告等警示訊息
- **THEN** 背景為 `bg-amber-50`，文字為 `text-amber-700`

#### Scenario: 危險狀態徽章

- **WHEN** 顯示「低賠率負期望值（避免）」等負面判斷
- **THEN** 背景為 `bg-red-50`，文字為 `text-red-700`
