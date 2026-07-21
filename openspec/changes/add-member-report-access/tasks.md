## 1. 外部前置設定（作者/開發者在本專案之外完成）

- [ ] 1.1 Google Cloud Console 建立專案，啟用 Google Drive API
- [ ] 1.2 建立 OAuth 2.0 Client ID（Web 應用程式），設定授權網域（含正式機與本機開發網址）
- [ ] 1.3 建立 Service Account，下載 JSON 金鑰
- [ ] 1.4 將存放報告的 Google 雲端硬碟資料夾分享給 Service Account 的 email（唯讀權限）
- [ ] 1.5 在 Vercel 專案環境變數新增 `GOOGLE_OAUTH_CLIENT_ID`、`GOOGLE_SERVICE_ACCOUNT_JSON`、`SESSION_JWT_SECRET`，本機開發用 `.env.local`（加入 `.gitignore`，不提交）

## 2. 依賴套件

- [ ] 2.1 新增 `google-auth-library`（驗證 Google ID token）
- [ ] 2.2 新增 `googleapis`（Drive API 存取）
- [ ] 2.3 新增 `jose`（簽發/驗證 session JWT）
- [ ] 2.4 新增 `cookie`（解析/序列化 cookie，若未內建）

## 3. 後端：登入與 Session（member-auth）

- [ ] 3.1 建立 `api/auth/session.ts`：接收前端傳來的 Google ID token，用 `google-auth-library` 驗證簽章與 audience
- [ ] 3.2 實作 `isAuthorized(email)` 會員資格判斷點（目前恆回傳 true，附註未來白名單擴充位置）
- [ ] 3.3 驗證通過後用 `jose` 簽發 session JWT（內容僅 `{ email, exp }`），以 httpOnly/Secure/SameSite=Lax cookie 回傳
- [ ] 3.4 建立 `api/auth/me.ts`：解析 cookie 中的 session JWT，回傳目前登入狀態（已登入回傳 email，未登入/驗證失敗回傳未登入）
- [ ] 3.5 建立 `api/auth/logout.ts`：清除 session cookie
- [ ] 3.6 抽出共用的「驗證 session 並取得 email」中介邏輯（`api/_lib/session.ts`），供報告相關端點共用

## 4. 後端：報告代理（report-library）

- [ ] 4.1 建立 `api/_lib/reports.ts`：維護報告 metadata 設定（`id`、`title`、`date`、`summary`、`driveFileId`），僅後端可讀取
- [ ] 4.2 建立 `api/reports/index.ts`：驗證登入與會員資格後，回傳報告列表（僅 `id/title/date/summary`，不含 `driveFileId`）
- [ ] 4.3 建立 `api/reports/[id]/view.ts`（唯一的檔案存取端點，不另建 download 端點）：驗證登入與會員資格 → 依 `id` 查出 `driveFileId` → 先查該檔案的實際 mime type，再用 Service Account 呼叫 Drive API `files.get(alt: media, responseType: stream)` → 以查到的 mime type 設定 `Content-Type`，`Content-Disposition: inline` 串流回應
- [ ] 4.4 確認上述端點皆為 Node runtime（不加 Edge runtime 設定），與既有 `api/proxy.ts`（Edge）並存不衝突
- [ ] 4.5 為所有報告端點補上「未登入/未通過會員資格一律回應 401，不回傳任何報告內容或錯誤細節」的錯誤處理

## 5. 前端：登入 UI

- [ ] 5.1 在 `NavBar.tsx` 加入登入狀態顯示與「使用 Google 登入」按鈕（載入 Google Identity Services script）
- [ ] 5.2 登入成功後呼叫 `/api/auth/session`，並更新全站登入狀態（可用既有 `useAppStore` 或新增一個 auth store）
- [ ] 5.3 頁面載入時呼叫 `/api/auth/me` 還原登入狀態
- [ ] 5.4 加入登出按鈕，呼叫 `/api/auth/logout` 並清除前端登入狀態

## 6. 前端：研究報告頁面

- [ ] 6.1 新增路由 `/reports`（僅此一個列表頁，不設報告內頁），加入 `src/pages/ReportsPage.tsx`
- [ ] 6.2 列表頁：未登入時顯示登入提示（不嘗試打報告 API）；已登入時呼叫 `/api/reports` 顯示日期 + 標題，標題為 `<a href="/api/reports/:id/view" target="_blank">`，新分頁開啟直接檢視 PDF/圖片
- [ ] 6.3 在首頁（`HomePage.tsx`）新增「研究報告」入口卡片，與現有四個工具卡片並列

## 7. 驗證

- [ ] 7.1 本機以測試 Google 帳號完整跑過：登入 → 查看報告列表 → 點標題直接檢視，確認全程未出現 Google 登入或授權畫面
- [ ] 7.2 開發者工具檢查 Network 面板，確認所有報告相關請求皆為本站網域路徑，未出現 Google 雲端硬碟網域或任何雲端硬碟簽名網址
- [ ] 7.3 測試未登入直接呼叫 `/api/reports`、`/api/reports/:id/view`，確認皆回應 401 且不洩漏報告內容
- [ ] 7.4 測試登出後，原本的 session cookie 不能再用於存取受保護端點
- [ ] 7.5 確認既有四個分析工具（個股/組合/比較/績效）行為未受影響
