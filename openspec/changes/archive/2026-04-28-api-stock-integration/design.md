## Context

現有 Web App 使用 textarea 手動貼入報酬率，使用者需自行整理數據格式才能使用。CMoney 提供三支固定格式 API，可直接取得台股清單與個股月/日報酬率，是本次整合的數據來源。

**API 規格（固定不可更動）：**

| API | URL（固定） | 可變參數 | 回傳格式 |
|-----|-----------|---------|---------|
| 股票清單 | `DtNo=133054167` | 無 | `{ Title: ["股票代號","股票名稱","收盤價"], Data: [["2330","台積電",2265],...] }` |
| 月報酬 | `DtNo=133066054&ParamStr=AssignID={CODE}` | AssignID | `{ Title: ["年月","漲幅(%)"], Data: [["202604","5.87"],...] }` |
| 日報酬 | `DtNo=133057193&ParamStr=AssignID={CODE}` | AssignID | `{ Title: ["日期","漲幅(%)"], Data: [["20260427","-0.41"],...] }` |

Base URL: `https://www.cmoney.tw/MobileService/ashx/GetDtnoData.ashx`

**數據特性：**
- 月報酬：~488 筆（2005～今），字串百分比 `"5.87"` → `0.0587`
- 日報酬：~400 筆（~2年），字串百分比 `"-0.41"` → `-0.0041`
- 股票清單：2000+ 支台股

## Goals / Non-Goals

**Goals:**
- 以 API 取代手動 textarea 輸入，降低使用門檻
- 股票選擇器支援代號/名稱搜尋，選取後自動抓取雙頻數據
- 雙頻計算：月報酬 → EV + 蒙地卡羅；日報酬 → VaR + Hurst
- Hurst 整合進個股頁與投資組合頁結果區，移除獨立 /hurst 頁
- 若日報酬不足（< 252 筆），自動降級用月報酬計算 VaR + Hurst 並標注

**Non-Goals:**
- 不修改 API 端點或回傳格式
- 不支援台股以外的股票（國際股、ETF 視 API 回傳結果決定）
- 不做後端快取（每次選股重新呼叫 API）
- 不做離線模式

## Decisions

### D1：API Client 封裝 — `src/lib/api.ts`

**選擇**：集中封裝成三個 async function，統一處理 fetch + 格式解析 + 錯誤：

```ts
fetchStockList(): Promise<Stock[]>
fetchMonthlyReturns(code: string): Promise<number[]>
fetchDailyReturns(code: string): Promise<number[]>
```

**解析邏輯**：
- 字串百分比 → 數值：`parseFloat("5.87") / 100 = 0.0587`
- 過濾空值、"0.00" 不等於無效（0 報酬是合法的），只過濾 NaN

**理由**：集中管理 URL，若 CMoney 調整 base URL 只需改一處。

### D2：股票選擇器 UX — 搜尋下拉選單

**選擇**：`<input>` 輸入代號或名稱關鍵字 → 即時過濾清單 → 下拉顯示最多 10 筆 → 點選確認

**清單載入時機**：App 初始化時一次載入股票清單並快取在 Zustand store（`stockList`），後續搜尋在本地過濾，不重複呼叫 API。

**理由**：清單 2000+ 筆但每筆僅 3 欄，一次載入約 50-100KB，可接受。避免每次搜尋都打 API。

### D3：雙頻數據抓取時機 — 選股後並行呼叫

**選擇**：選股確認後，`Promise.all([fetchMonthlyReturns, fetchDailyReturns])` 並行呼叫

**降級邏輯**：
```
日報酬筆數 >= 252 → VaR + Hurst 使用日頻，標注「日頻」
日報酬筆數 < 252  → VaR + Hurst 使用月頻，標注「月頻」
日報酬 API 失敗   → 同上，標注「月頻（日頻不可用）」
```

### D4：Hurst 整合位置 — 個股頁最後一個區塊

**個股頁結果順序**：EV → VaR（標注頻率）→ 蒙地卡羅 → Hurst（標注頻率）

**理由**：EV 是最核心指標，Hurst 是補充性的市場行為分析，放最後符合重要性遞減順序。

### D5：投資組合日頻處理 — 全部股票都有日頻才啟用

**選擇**：Portfolio 中所有股票都成功取得 ≥ 252 筆日報酬，才計算日頻 VaR + Hurst；否則用月頻加權組合。

**理由**：避免部分股票缺日頻時，加權計算產生長度不一致的問題。

### D6：Zustand store 新增欄位

新增 `stockList: Stock[]`（股票清單快取）。Individual / Portfolio / Compare 的 store 欄位從 `rawText` 改為 `stockCode: string`，API 數據不存 store（只存選取的代號，重進頁面重新抓）。

## Risks / Trade-offs

| 風險 | 緩解方案 |
|------|---------|
| CMoney API CORS 限制（瀏覽器直接呼叫可能被擋）| 先測試；若被擋需透過 Vercel Edge Function 作 proxy |
| 股票清單 API 回應慢（2000+ 筆）| App 啟動時非同步載入，搜尋前顯示「載入中...」 |
| 特定股票無日報酬數據 | 降級到月頻並標注，不阻止計算 |
| 月報酬最早到 2005 年，但使用者可能只需近 5 年 | 預設取最新 120 筆月報酬（可擴充讓使用者選期間）|
| Portfolio 日頻需全部股票都有數據 | 明確提示哪支股票缺日頻，並說明降級原因 |

## Migration Plan

1. 新增 `src/lib/api.ts` + `src/components/StockSelector.tsx`
2. 更新 Zustand store（新增 stockList，修改個股/組合欄位）
3. 重寫 IndividualPage（移除 textarea，加入 StockSelector + 雙頻載入）
4. 重寫 PortfolioPage（每支股票改為 StockSelector）
5. 移除 HurstPage + /hurst route + NavBar 項目
6. 更新 ComparePage（改用 StockSelector）
7. Build + Test + Deploy

**CORS 測試優先**：任務 1 完成後立即在瀏覽器測試 API 呼叫，若有 CORS 問題在後續任務開始前解決。

## Open Questions

- CMoney API 是否有 CORS header 允許瀏覽器直接呼叫？（需實測）
- 月報酬是否預設取最新 120 筆，還是全部 488 筆？（建議預設 120，但全部計算也可）
