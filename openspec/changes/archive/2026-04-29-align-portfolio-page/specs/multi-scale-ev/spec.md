## ADDED Requirements

### Requirement: MultiScaleEVBlock 支援 title / subtitle override
`MultiScaleEVBlock` 元件 SHALL 接受可選 `titleOverride?: string` 與 `subtitlePrefixOverride?: string` props，供呼叫端（如組合頁）覆寫預設標題文字。

#### Scenario: 個股頁不傳 override
- **WHEN** 個股頁使用 `<MultiScaleEVBlock result={...} monthlyCount={...} dailyCount={...} />`（無 override）
- **THEN** 顯示既有預設標題「期望報酬與賠率優勢」與既有副標格式

#### Scenario: 組合頁傳入 titleOverride
- **WHEN** 組合頁使用 `<MultiScaleEVBlock ... titleOverride="組合期望報酬與賠率優勢" />`
- **THEN** 標題顯示為「組合期望報酬與賠率優勢」，其他內容（Hero / 三卡片 / 弱化 inline / 計算步驟）行為不變

#### Scenario: 同樣支援 MultiScaleHurstBlock
- **WHEN** 組合頁使用 `<MultiScaleHurstBlock ... titleOverride="組合趨勢延續性偵測" />`
- **THEN** 標題顯示為「組合趨勢延續性偵測」，其他內容行為不變
