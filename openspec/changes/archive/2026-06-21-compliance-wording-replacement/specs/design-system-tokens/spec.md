## ADDED Requirements

### Requirement: 合規詞彙集中表

系統 SHALL 在 `src/lib/wording.ts` 提供 `WORDING` 物件與 `COMPLIANCE_FOOTER` 常數，集中所有「使用者面對的合規敏感詞彙」。

#### Scenario: WORDING 內容

- **WHEN** 元件需要顯示區塊標題、chip、評級註記等
- **THEN** 從 `WORDING` 匯入，不直接寫死字串
- **AND** 至少包含：actionGuideTitle、recommendationTitle、diagnosisTitle、shortTermVerdict、longTermVerdict、excelDiagSheet、quadrantBestNote、quadrantWorstNote

#### Scenario: COMPLIANCE_FOOTER 內容

- **WHEN** 引用 `COMPLIANCE_FOOTER`
- **THEN** 為「本系統所有分析皆為統計教學示例，非投資建議，不構成買賣依據。投資人應依自身判斷負責。」
- **AND** 註解保留原始（替換前）值方便未來還原

### Requirement: Quadrant 標籤合規化

`Quadrant` type 字面量 SHALL 採中性「評級註記」用詞。

#### Scenario: 字面量內容

- **WHEN** `Quadrant` type 定義
- **THEN** 雙優：`'高賠率正期望值（雙優）'`、較弱：`'低賠率負期望值（較弱）'`
- **AND** 其他兩個維持：`'低賠率正期望值（勝率驅動）'`、`'高賠率負期望值（賠率驅動但勝率不足）'`

### Requirement: 4 個分析頁加合規 Footer

系統 SHALL 在 IndividualPage、PortfolioPage、ComparePage、PerformancePage 四個分析頁底部（結果區最末）渲染 `<ComplianceFooter />`。

#### Scenario: Footer 渲染條件

- **WHEN** 該頁有計算結果顯示
- **THEN** 結果區塊最底渲染 ComplianceFooter
- **AND** Footer 含 ⚠ 圖示 + `COMPLIANCE_FOOTER` 文字

### Requirement: ActionGuide 內 disclaimer 強化

`ActionGuide.tsx` 內既有的 disclaimer 字串 SHALL 改為與 `COMPLIANCE_FOOTER` 一致。

#### Scenario: 統一文字

- **WHEN** ActionGuide 渲染 footer
- **THEN** 文字與 `COMPLIANCE_FOOTER` 一致（含 ⚠ 圖示）
