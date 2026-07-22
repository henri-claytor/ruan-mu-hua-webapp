## ADDED Requirements

### Requirement: Google 帳號登入
系統 SHALL 提供「使用 Google 登入」的入口，使用者透過 Google 官方登入流程取得身份後，系統以後端驗證 Google 核發的 ID token 是否有效（簽章正確、audience 相符、未過期）。

#### Scenario: 成功登入
- **WHEN** 使用者點擊「使用 Google 登入」並完成 Google 帳號選擇
- **THEN** 前端取得 Google ID token 並送至後端驗證，驗證成功後系統核發本站 session 並將使用者導向為已登入狀態

#### Scenario: Google ID token 驗證失敗
- **WHEN** 後端收到的 ID token 簽章不正確、已過期，或 audience 與本站設定的 Client ID 不符
- **THEN** 系統拒絕核發 session，回應未授權錯誤，前端顯示登入失敗訊息

### Requirement: 登入 Session 維持與查詢
系統 SHALL 以 httpOnly、Secure cookie 保存登入狀態，並提供查詢目前登入狀態的方式，不需要每次都重新驗證 Google ID token。

#### Scenario: 已登入使用者重新整理頁面
- **WHEN** 使用者的瀏覽器攜帶尚未過期的 session cookie 重新載入頁面
- **THEN** 系統辨識為已登入狀態，不需要重新登入

#### Scenario: Session 過期
- **WHEN** session cookie 不存在、已過期，或簽章驗證失敗
- **THEN** 系統視為未登入，需要保護的頁面與 API 一律拒絕存取並要求重新登入

### Requirement: 登出
系統 SHALL 提供登出功能，登出後立即清除本站 session。

#### Scenario: 使用者登出
- **WHEN** 已登入使用者點擊登出
- **THEN** 系統清除 session cookie，使用者恢復未登入狀態，需要保護的頁面與 API 不再能存取

### Requirement: 會員資格判斷的擴充點
系統 SHALL 在核發與驗證 session 的流程中，保留一個獨立的會員資格判斷點，使未來加入付費會員白名單限制時，只需修改此判斷邏輯，不需修改登入或 session 機制本身。

#### Scenario: 目前所有登入者皆視為會員
- **WHEN** 任一使用者的 Google ID token 驗證通過
- **THEN** 系統於本次會員資格判斷點回傳「通過」，該使用者視為會員，可存取會員限定內容
