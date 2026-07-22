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
- 不做報告的後台上傳介面（作者直接把檔案丟到 Google 雲端硬碟資料夾，網站自動列出該資料夾內容、以檔名帶出標題與日期，免改程式）。
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

### 3. 報告存取：資料夾自動列出 + 後端代理，不回傳雲端硬碟網址或 fileId
- **不建 metadata 設定檔、不建資料庫**：以整個 Google 雲端硬碟資料夾為報告來源（`GOOGLE_DRIVE_FOLDER_ID`）。作者只要把檔案丟進資料夾就會自動出現，新增/下架完全免改程式、免重新部署。
- **檔名即顯示資訊**，命名規則 `日期-標題.副檔名`：日期為 `YYYYMMDD` 或 `YYYY-MM-DD`，接一個分隔符（`-`/`_`/空白）再接標題。例 `20260721-立隆電.pdf` → 日期 2026-07-21、標題「立隆電」。無日期前綴時日期欄留空、整個檔名（去副檔名）當標題。
- `GET /api/reports`：驗證 session 後，呼叫 Drive `files.list`（`q='{folderId}' in parents and trashed=false`）取得資料夾內檔案，解析檔名後只回傳 `id(=檔名)/title/date`，**不回傳 Drive fileId**。
- `GET /api/reports/:id/view`（唯一的檔案存取端點，不另外提供 download 端點）：
  1. 驗證 session cookie，未通過一律 401。
  2. 依前端傳來的 `id`（= 檔名），用 `name + parent` 雙條件查 `files.list` 取回該檔案（限定在資料夾內，也擋掉任意檔名探測）；找不到回 404。
  3. 用 `google-auth-library` 的 `GoogleAuth` 換取 service account access token 後直接 `fetch` Drive `alt=media` 取得檔案內容（不引入完整 `googleapis` 套件）。
  4. 把內容**完整讀入為 Buffer 再回傳**，`Content-Type` 用該檔案實際 mime type，並帶 **`Content-Length`**（Chrome PDF 檢視器需要它才肯渲染，圖片則不需要；Drive 上游不提供，故讀入後自算），`Content-Disposition: inline; filename*=...`。研究報告檔案不大（數 MB 內），完整讀入可接受。
- 前端列表頁的標題本身就是 `<a href="/api/reports/:id/view" target="_blank">`，不設中間內頁、不做 iframe 內嵌——`href` 永遠是自家網域路徑，瀏覽器任何時候都看不到 Google 雲端硬碟的網址；Network 面板攔到的也只是自家 API URL。
- Google 雲端硬碟資料夾維持「非公開」，只分享給 service account 的 email（唯讀）。

### 4. Runtime：Drive 代理端點用 Node runtime，不用 Edge runtime
- `google-auth-library`、`Readable.fromWeb`（`node:stream`）等依賴 Node API，無法在 Vercel Edge runtime 執行。新的 `/api/auth/*`、`/api/reports/*` 端點都用預設 Node serverless function（不加 `export const config = { runtime: 'edge' }`），與既有的 `api/proxy.ts`（Edge）並存，兩者互不影響。
- 型別上不引入 `@vercel/node` 套件（其 transitive dependency 含多個 high/critical 已知漏洞，且專案的 `tsconfig.app.json` 本來就不含 `api/` 目錄、不會被本地型別檢查覆蓋，引入它對本地開發沒有實質檢查效益）。改在 `api/_lib/http-types.ts` 自行定義最小化的 `VercelRequest`/`VercelResponse` 型別，欄位與方法皆由 Vercel 執行環境在部署時實際提供。

## Risks / Trade-offs

- **[風險] JWT session 沒有伺服器端撤銷機制**（例如作者想立即踢掉某個帳號，JWT 在過期前仍有效）→ **緩解**：session 效期設短（7 天），且未來加白名單時，`isAuthorized(email)` 檢查是在「每次 API 呼叫」都執行，不是只在登入時檢查一次，所以撤銷白名單資格會在下一次 API 呼叫就生效，不用等 JWT 過期。
- **[取捨] 報告來源＝整個 Drive 資料夾、以檔名帶出標題與日期**，作者需遵守命名規則（`日期-標題`），否則日期會解析錯誤或留空 → **緩解**：規則簡單，且解析錯誤只影響顯示、不影響安全；view 端點以「資料夾內 + 檔名」雙條件查檔，天然限制只能讀到資料夾內的檔案。
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
