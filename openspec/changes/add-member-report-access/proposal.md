## Why

作者目前透過群組分享「取得的第三方研究報告」（券商/法人/研究機構出品，非作者原創）。群組分享難以控管散布範圍，且報告本身有版權疑慮。作者希望改為只讓登入本網站的使用者檢視/下載，報告原始檔存放在 Google 雲端硬碟。目前網站沒有任何登入機制，需要先建立登入能力，再疊加報告檢視功能。

## What Changes

- 新增 Google 帳號登入（Sign in with Google），登入後由後端核發自家 session（httpOnly cookie）。
- 目前無付費分級：任何成功以 Google 帳號登入的使用者皆視為會員，可檢視報告（預留白名單擴充點，供未來加入付費會員限制時使用，不在本次實作）。
- 新增「研究報告」頁面區塊（與現有個股分析/投資組合/比較分析/績效分析平行的獨立入口）：
  - 報告列表頁（需登入）：一列表，含日期與標題，標題本身是超連結
  - 點擊標題直接開啟報告內容（PDF 或圖片），不需要中間的報告內頁，也不提供另外的下載功能——瀏覽器內建的 PDF/圖片檢視器本身就能另存新檔
- 新增後端代理端點：所有報告檔案存取一律透過後端向 Google Drive API（service account）抓取內容並串流回應，瀏覽器全程只接觸自家網域路徑，任何情況下都不會拿到 Google 雲端硬碟的原始網址或可直接存取的連結；使用者只要有本站登入 session 即可檢視，不需要額外對 Google Drive 進行任何登入或授權。
- 新增報告 metadata 清單（標題、日期、摘要、對應 Drive 檔案 ID），本次先以專案內設定檔維護，不建資料庫。
- **BREAKING**：無。純新增功能，不影響現有四個分析工具的既有行為。

## Capabilities

### New Capabilities
- `member-auth`：Google 登入、後端 session 核發與驗證、登入狀態查詢
- `report-library`：會員限定的研究報告列表、檢視、下載，皆透過後端代理存取 Google 雲端硬碟檔案

### Modified Capabilities
（無，現有四個分析工具的 spec 行為不變）

## Impact

- **新增後端 API**（Vercel Serverless Functions，Node runtime）：
  - `POST /api/auth/session`：驗證 Google ID token，核發本站 session cookie
  - `GET /api/auth/me`：查詢目前登入狀態
  - `POST /api/auth/logout`：清除 session
  - `GET /api/reports`：回傳報告 metadata 列表（需登入）
  - `GET /api/reports/:id/view`：以 `inline` 串流回傳報告內容（PDF 或圖片，依實際檔案類型決定 `Content-Type`；需登入）
- **新增前端路由**：`/reports`（列表頁，標題直接連到 `/api/reports/:id/view`，不設中間內頁），以及全站可見的登入入口（NavBar 加登入狀態顯示）
- **新增依賴**：Google ID token 驗證用的函式庫（如 `google-auth-library`）、Google Drive API 用的函式庫（如 `googleapis`）、簽發/驗證 session cookie 的 JWT 函式庫（如 `jose`）
- **新增環境變數/外部設定**（需作者在 Google Cloud Console / Google Drive 完成，屬本專案外的一次性設定）：
  - Google OAuth Client ID（給前端 Google Sign-In 按鈕用）
  - Google Service Account 憑證（給後端 Drive API 用；對應的 Drive 資料夾需分享給此 service account 的 email）
  - Session cookie 簽章密鑰
- **不影響**現有 `api/proxy.ts`（CMoney 資料代理）與四個既有分析工具的行為。
- 部署上，`api/proxy.ts` 目前是 Edge runtime；新的 Drive 代理端點因需要 Node 專用套件（`googleapis`），需以 Node runtime 建立，兩者可並存。
