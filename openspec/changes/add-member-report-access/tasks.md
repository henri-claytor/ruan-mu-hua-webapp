## 1. 外部前置設定（作者/開發者在本專案之外完成）

- [ ] 1.1 Google Cloud Console 建立專案，啟用 Google Drive API
- [ ] 1.2 建立 OAuth 2.0 Client ID（Web 應用程式），設定授權網域（含正式機與本機開發網址）
- [ ] 1.3 建立 Service Account，下載 JSON 金鑰
- [ ] 1.4 將存放報告的 Google 雲端硬碟資料夾分享給 Service Account 的 email（唯讀權限）
- [ ] 1.5 在 Vercel 專案環境變數新增 `GOOGLE_OAUTH_CLIENT_ID`、`GOOGLE_SERVICE_ACCOUNT_JSON`、`SESSION_JWT_SECRET`，本機開發用 `.env.local`（加入 `.gitignore`，不提交）

## 2. 依賴套件

- [x] 2.1 新增 `google-auth-library`（驗證 Google ID token + 換取 Drive access token）
- [x] 2.2 ~~新增 `googleapis`~~（實作時改用 `google-auth-library` 取得 access token 後直接呼叫 Drive REST API，省去完整 `googleapis` 套件，減少依賴體積）
- [x] 2.3 新增 `jose`（簽發/驗證 session JWT）
- [x] 2.4 ~~新增 `cookie`~~（改直接手寫 Set-Cookie 字串 + Vercel Node 執行環境內建的 `req.cookies` 解析，不需額外套件；型別另用專案內 `api/_lib/http-types.ts` 取代 `@vercel/node`，避免其 transitive dependency 帶入的多個已知漏洞）

## 3. 後端：登入與 Session（member-auth）

- [x] 3.1 建立 `api/auth/session.ts`：接收前端傳來的 Google ID token，用 `google-auth-library` 驗證簽章與 audience
- [x] 3.2 實作 `isAuthorized(email)` 會員資格判斷點（目前恆回傳 true，附註未來白名單擴充位置）
- [x] 3.3 驗證通過後用 `jose` 簽發 session JWT（內容僅 `{ email, exp }`），以 httpOnly/Secure/SameSite=Lax cookie 回傳
- [x] 3.4 建立 `api/auth/me.ts`：解析 cookie 中的 session JWT，回傳目前登入狀態（已登入回傳 email，未登入/驗證失敗回傳未登入）
- [x] 3.5 建立 `api/auth/logout.ts`：清除 session cookie
- [x] 3.6 抽出共用的「驗證 session 並取得 email」中介邏輯（`api/_lib/session.ts`），供報告相關端點共用

## 4. 後端：報告代理（report-library）

- [x] 4.1 建立 `api/_lib/reports.ts`：維護報告 metadata 設定（`id`、`title`、`date`、`summary`、`driveFileId`），僅後端可讀取
- [x] 4.2 建立 `api/reports/index.ts`：驗證登入與會員資格後，回傳報告列表（僅 `id/title/date/summary`，不含 `driveFileId`）
- [x] 4.3 建立 `api/reports/[id]/view.ts`（唯一的檔案存取端點，不另建 download 端點）：驗證登入與會員資格 → 依 `id` 查出 `driveFileId` → 先查該檔案的實際 mime type，再透過 `api/_lib/googleDrive.ts` 用 Service Account 呼叫 Drive REST API 取得內容 stream → 以查到的 mime type 設定 `Content-Type`，`Content-Disposition: inline`，用 `Readable.fromWeb` 串流回應
- [x] 4.4 確認上述端點皆為 Node runtime（不加 Edge runtime 設定），與既有 `api/proxy.ts`（Edge）並存不衝突
- [x] 4.5 為所有報告端點補上「未登入/未通過會員資格一律回應 401，不回傳任何報告內容或錯誤細節」的錯誤處理

## 5. 前端：登入 UI

- [x] 5.1 在 `NavBar.tsx` 加入登入狀態顯示與「使用 Google 登入」按鈕（`GoogleLoginButton.tsx` 載入 Google Identity Services script）
- [x] 5.2 登入成功後呼叫 `/api/auth/session`，並更新全站登入狀態（新增 `useAuthStore`）
- [x] 5.3 頁面載入時呼叫 `/api/auth/me` 還原登入狀態（`App.tsx` 掛載時 `refresh()`）
- [x] 5.4 加入登出按鈕，呼叫 `/api/auth/logout` 並清除前端登入狀態

## 6. 前端：研究報告頁面

- [x] 6.1 新增路由 `/reports`（僅此一個列表頁，不設報告內頁），加入 `src/pages/ReportsPage.tsx`
- [x] 6.2 列表頁：未登入時顯示登入提示（不嘗試打報告 API）；已登入時呼叫 `/api/reports` 顯示日期 + 標題，標題為 `<a href="/api/reports/:id/view" target="_blank">`，新分頁開啟直接檢視 PDF/圖片
- [x] 6.3 在首頁（`HomePage.tsx`）新增「研究報告」入口卡片（獨立「會員專區」分區），與現有四個工具卡片並列

## 7. 驗證

> 本機以 Vite dev + `server/devApi.ts` 橋接執行 `api/` 函式，`.env.local` 載入真實憑證，Drive 資料夾實測 1 筆報告（`20260721-立隆電.pdf`）。
> 為驗證登入後畫面，另以後端相同密鑰簽發測試用 session（`devtest@local`）注入瀏覽器，繞過真人 Google 登入。

- [x] 7.1 登入 → 查看報告列表 → 點標題直接檢視 —— 已用測試 session 驗證：列表正確顯示「2026-07-21 立隆電」，view 端點回 HTTP 200 / `application/pdf` / 837KB（真實 PDF 串流）。**真人 Google 登入按鈕已渲染，實際點擊登入待作者用 OAuth 測試帳號在自己的瀏覽器（http://localhost:5173）確認**
- [x] 7.2 Network 檢查：報告列表 API 只回 `id/title/date`（不含 Drive fileId）；標題連結為自家路徑 `/api/reports/…/view`；view 回應 Content-Type 為 `application/pdf`、來源為 localhost，未出現任何 `drive.google.com` 網域或簽名網址
- [x] 7.3 未登入直接呼叫 `/api/reports`、`/api/reports/:id/view` —— 皆回 HTTP 401 `{"error":"Unauthorized"}`，不洩漏任何報告內容
- [x] 7.4 登出：`POST /api/auth/logout` 回 `Set-Cookie: session=; Max-Age=0`（清除 cookie），瀏覽器隨後即為未登入狀態
- [x] 7.5 確認既有四個分析工具（個股/組合/比較/績效）行為未受影響 —— 已在 preview 中操作驗證，無 console 錯誤、無行為變化
