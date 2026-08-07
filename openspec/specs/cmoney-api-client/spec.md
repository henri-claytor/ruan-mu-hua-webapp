## ADDED Requirements

### Requirement: 股票清單 API 呼叫

系統 SHALL 透過固定 URL 呼叫 CMoney 股票清單 API，解析回傳資料為可搜尋的股票陣列。

API URL（固定不可更動）：
`https://www.cmoney.tw/MobileService/ashx/GetDtnoData.ashx?DtNo=133054167&Action=GetDtNoData&FilterNo=0`

回傳格式：`{ Title: ["股票代號","股票名稱","收盤價"], Data: [["2330","台積電",2265], ...] }`

#### Scenario: 成功取得股票清單

- **WHEN** App 初始化時呼叫股票清單 API
- **THEN** 系統解析 Data 陣列，轉換為 `{ code: string; name: string }[]` 並存入 Zustand store

#### Scenario: 清單 API 失敗時顯示錯誤

- **WHEN** 股票清單 API 回傳錯誤或網路逾時
- **THEN** 股票選擇器顯示「無法載入股票清單，請重新整理」，不阻止其他頁面功能

### Requirement: 個股月報酬 API 呼叫

系統 SHALL 依股票代號呼叫月報酬 API，解析字串百分比為 number[] 型態的月報酬率序列。

API URL（AssignID 為唯一可變參數）：
`https://www.cmoney.tw/MobileService/ashx/GetDtnoData.ashx?DtNo=133066054&Action=GetDtNoData&FilterNo=0&ParamStr=AssignID={CODE}`

回傳格式：`{ Title: ["年月","漲幅(%)"], Data: [["202604","5.87"], ...] }`

解析規則：`"5.87"` → `5.87 / 100 = 0.0587`；空字串或 NaN 值略過。

#### Scenario: 解析月報酬率成功

- **WHEN** 月報酬 API 回傳 488 筆數據
- **THEN** 系統解析為長度 ≤ 488 的 number[]，並取最新 120 筆供計算

#### Scenario: 解析百分比字串

- **WHEN** Data 包含字串 `"-40.03"`
- **THEN** 解析結果為 `-0.4003`

#### Scenario: 月報酬 API 失敗

- **WHEN** 指定股票的月報酬 API 呼叫失敗
- **THEN** 系統在個股頁顯示「無法取得 {代號} 月報酬數據」，結果區不顯示

### Requirement: 個股日報酬 API 呼叫

系統 SHALL 依股票代號呼叫日報酬 API，解析字串百分比為 number[] 型態的日報酬率序列。

API URL（AssignID 為唯一可變參數）：
`https://www.cmoney.tw/MobileService/ashx/GetDtnoData.ashx?DtNo=133057193&Action=GetDtNoData&FilterNo=0&ParamStr=AssignID={CODE}`

回傳格式：`{ Title: ["日期","漲幅(%)"], Data: [["20260427","-0.41"], ...] }`

#### Scenario: 解析日報酬率成功

- **WHEN** 日報酬 API 回傳約 400 筆數據
- **THEN** 系統解析為完整的 number[]，筆數標注於結果區

#### Scenario: 日報酬筆數不足時降級

- **WHEN** 日報酬筆數 < 252
- **THEN** 系統改用月報酬計算 VaR + Hurst，並在結果標題標注「（月頻）」

### Requirement: CORS 錯誤處理

若 CMoney API 不允許瀏覽器直接跨域呼叫，系統 SHALL 透過 Vercel Edge Function proxy 轉發請求，對使用者透明。

#### Scenario: 直接呼叫成功（無 CORS 問題）

- **WHEN** 瀏覽器直接呼叫 CMoney API 且收到正常回應
- **THEN** 系統直接使用回傳數據，不經 proxy

#### Scenario: CORS 錯誤時透過 proxy

- **WHEN** 直接呼叫產生 CORS 錯誤
- **THEN** 系統改透過 `/api/proxy?url=...` Vercel Edge Function 轉發，使用者無感知
