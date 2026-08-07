## ADDED Requirements

### Requirement: 跨頁輸入資料保留

系統 SHALL 以 Zustand store（`src/store/useAppStore.ts`）+ `persist` middleware 將所有使用者輸入的報酬率文字持久化至 localStorage，key 為 `rmh-app-v2`，切換頁面後資料不遺失。

Store 結構：
```ts
interface AppStore {
  individualRawText: string
  hurstRawText: string
  stocks: Stock[]         // Portfolio 頁股票清單（含名稱、比重、rawText）
  compareA: { name: string; rawText: string }
  compareB: { name: string; rawText: string }
  setIndividualRawText: (v: string) => void
  setHurstRawText: (v: string) => void
  setStocks: (stocks: Stock[]) => void
  setCompareA: (v: { name: string; rawText: string }) => void
  setCompareB: (v: { name: string; rawText: string }) => void
}
```

#### Scenario: 個股頁資料在切換後保留

- **WHEN** 使用者在個股頁輸入報酬率後切換至其他頁面，再切回個股頁
- **THEN** 輸入框顯示之前輸入的資料，計算結果自動重算並顯示

#### Scenario: 投資組合股票資料保留

- **WHEN** 使用者在投資組合頁新增 3 支股票並輸入資料後重新整理頁面
- **THEN** 頁面恢復 3 支股票的名稱、比重與報酬率資料

#### Scenario: Schema 版本衝突時清空

- **WHEN** localStorage 存有舊版 schema 資料（key 不符或解析錯誤）
- **THEN** 系統靜默清空舊資料並以預設值初始化，不顯示錯誤畫面

### Requirement: 清除資料按鈕

每個輸入頁面 SHALL 提供「清除資料」按鈕，點擊後清空該頁面的 store 欄位並重置 UI。

#### Scenario: 清除個股頁資料

- **WHEN** 使用者點擊個股頁「清除資料」按鈕
- **THEN** 輸入框清空，計算結果隱藏，localStorage 對應欄位移除

#### Scenario: 清除不影響其他頁面

- **WHEN** 使用者在個股頁點擊「清除資料」
- **THEN** 投資組合頁與 Hurst 頁的資料不受影響
