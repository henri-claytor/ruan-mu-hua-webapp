## Context

網站目前是純前端 SPA（React + Vite），部署在 Vercel，唯一後端邏輯是 `api/proxy.ts`（Edge runtime，轉發 CMoney 公開資料，無狀態、無驗證）。沒有資料庫、沒有使用者系統。

現在要新增：(1) 登入能力、(2) 會員限定的報告檢視/下載能力，且報告原始檔存放在作者的 Google 雲端硬碟。安全要求是雲端硬碟的真實存取方式（無論是分享連結還是簽名網址）絕對不能出現在瀏覽器可見的任何地方（HTML、JS、Network 面板、iframe src）。

## Goals / Non-Goals

**Goals:**
- 登入後才能看到「研究報告」頁面與內容。
- 報告檔案的實際存取完全在後端發生，瀏覽器只跟自家網域的 API 溝通。
- 不需要資料庫也能上線（報告 metadata 用專案內設定檔維護）。
- 架構要能在之後加入「付費會員白名單」時，只改一個檢查點，不用重做登入或代理機制。

**Non-Goals:**
- 不做付費/訂閱機制本身（目前所有登入者都視為會員）。
- 不做報告的後台上傳介面（作者直接把檔案丟到 Google 雲端硬碟資料夾，metadata 由開發者手動維護設定檔）。
- 不做浮水印、下載追蹤等進階防外流機制（列入 proposal 的 Impact 之外，未來可另開 change）。
- 不修改現有四個分析工具的行為。

## Decisions

### 1. 登入方式：Google Identity Services「Sign in with Google」（ID Token 流程），不做完整 OAuth 導頁流程
- 前端載入 Google 官方按鈕元件，使用者登入後前端拿到一個 Google 簽發的 ID token（JWT）。
- 前端把這個 ID token POST 到 `/api/auth/session`，後端用 `google-auth-library` 的 `OAuth2Client.verifyIdToken` 驗證簽章與 audience（Client ID），驗證通過取出 email。
- **為什麼不用完整 OAuth Authorization Code 流程**：我們不需要以使用者身份呼叫 Google API（Drive 存取是用獨立的 service account，跟登入者身份無關），只需要確認「這是誰」，ID token 流程更輕量、不需要 refresh token 管理。

### 2. Session 機制：後端簽發 httpOnly JWT cookie，無伺服器端 session store
- 驗證 Google ID token 成功後，後端用 `jose` 簽發一個短期（如 7 天）的 JWT，內容只放 `{ email, exp }`，以 `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax` 回傳。
- 之後每次打受保護的 API，後端解 cookie 裡的 JWT 驗證簽章即可，不需要查資料庫或記憶體 session store。
- **為什麼不用資料庫存 session**：專案目前沒有資料庫，Vercel serverless 每個 request 是獨立執行環境，維護記憶體 session 也留不住。Stateless JWT 符合現況，且未來要加白名單檢查時，只要在核發或驗證時多查一個 email 清單即可。
- **會員判斷**：本次「任何驗證通過的 Google 帳號＝會員」，不做白名單過濾。**擴充點**：驗證 email 的那一行程式碼旁預留 `isAuthorized(email)` 檢查點（目前恆為 true），未來加白名單只改這一個函式。

### 3. 報告存取：單一後端代理端點串流，不回傳雲端硬碟網址或檔案 ID 以外的任何連結
- 報告 metadata（`id`、`title`、`date`、`summary`、對應的 Google Drive `fileId`）存在專案內一個設定檔（如 `api/_lib/reports.ts` 匯出的陣列），不建資料庫。
- `GET /api/reports`：驗證 session 後，只回傳 `id/title/date/summary`，**不回傳 `fileId`**（fileId 不需要讓前端知道，前端只需要用 report `id` 打自家的 view 端點）。
- `GET /api/reports/:id/view`（唯一的檔案存取端點，不另外提供 download 端點）：
  1. 驗證 session cookie，未通過一律 401。
  2. 用 `id` 查出對應的 Drive `fileId`（伺服器端查表，不經過前端）。
  3. 先用 `drive.files.get({ fileId, fields: 'mimeType,name' })` 取得檔案的實際 mime type（`application/pdf` 或 `image/*`），再用 `drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })` 向 Drive API 要檔案內容。
  4. 把回傳的 stream 直接 pipe 到 HTTP response，`Content-Type` 用查到的實際 mime type，`Content-Disposition: inline`（讓瀏覽器直接顯示，不觸發強制下載；使用者仍可用瀏覽器內建檢視器的「另存新檔」自行下載）。
- 前端列表頁的標題本身就是 `<a href="/api/reports/:id/view">`（新分頁開啟），不設中間的報告內頁、不做 iframe 內嵌——瀏覽器對 `/api/reports/:id/view` 這個自家網域網址直接發請求並用內建 PDF/圖片檢視器開啟，`href` 永遠是自家網域路徑，瀏覽器任何時候都看不到 Google 雲端硬碟的網址。就算 Network 面板攔到這個請求，看到的也只是自家 API URL，不是雲端硬碟連結。
- Google 雲端硬碟資料夾維持「非公開」，只分享給 service account 的 email，這樣即使 `fileId` 外流（目前設計下也不會，因為 `/api/reports` 不回傳它），沒有 service account 憑證也無法直接存取。

### 4. Runtime：Drive 代理端點用 Node runtime，不用 Edge runtime
- `googleapis` 套件依賴 Node API，無法在 Vercel Edge runtime 執行。新的 `/api/auth/*`、`/api/reports/*` 端點都用預設 Node serverless function（不加 `export const config = { runtime: 'edge' }`），與既有的 `api/proxy.ts`（Edge）並存，兩者互不影響。

## Risks / Trade-offs

- **[風險] JWT session 沒有伺服器端撤銷機制**（例如作者想立即踢掉某個帳號，JWT 在過期前仍有效）→ **緩解**：session 效期設短（7 天），且未來加白名單時，`isAuthorized(email)` 檢查是在「每次 API 呼叫」都執行，不是只在登入時檢查一次，所以撤銷白名單資格會在下一次 API 呼叫就生效，不用等 JWT 過期。
- **[風險] 報告 metadata 用設定檔維護**，新增/下架報告需要改程式碼並重新部署 → **緩解**：現階段報告數量少、更新頻率低，可接受；量大時再考慮換成簡單資料庫或 CMS，屬未來 change。
- **[風險] Service Account 憑證是高權限敏感資訊**，一旦外流等於任何人都能讀該 Drive 資料夾 → **緩解**：只放在 Vercel 專案的環境變數（後端 runtime 才能讀到，不會打包進前端 bundle），絕不寫入程式碼或提交進 git。
- **[取捨] 沒有下載追蹤/浮水印**，若報告仍被會員截圖或轉傳，本設計無法防止 → 已在 proposal 的 Non-Goals 中明列，屬於已知限制，需要時再開新 change 處理。

## Migration Plan

1. 作者於 Google Cloud Console 建立專案，啟用 Drive API，建立 OAuth 2.0 Client ID（Web 應用程式，用於 Sign-In 按鈕）與一組 Service Account（含 JSON 金鑰）。
2. 作者把存放報告的 Google 雲端硬碟資料夾分享給該 Service Account 的 email（唯讀權限即可）。
3. 開發端在 Vercel 專案環境變數新增：`GOOGLE_OAUTH_CLIENT_ID`、`GOOGLE_SERVICE_ACCOUNT_JSON`（或拆成多個欄位）、`SESSION_JWT_SECRET`。
4. 部署新的 API 端點與前端頁面，先在 Preview 環境驗證整條登入 + 檢視 + 下載流程。
5. 確認無誤後合併到正式環境。這是純新增功能，沒有既有資料或路由需要遷移，發生問題可直接 revert 該次部署，不影響既有四個分析工具。

## Open Questions

- 報告數量與更新頻率？（影響 metadata 是否值得現在就做成資料庫）
- Session 效期 7 天是否符合作者對「登入多久要重新登入」的預期？
