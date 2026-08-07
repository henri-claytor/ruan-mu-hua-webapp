## Why

目前手動輸入用「買入價 × 股數」自動算金額，未計入手續費（0.1425%）+ 證交稅（賣出 0.3%），會偏離實際入帳金額約 0.4–0.5%。

實務上：
- 券商對帳單顯示的是「成交金額（含費用後）」
- 使用者反思績效時看的是「實際賺/虧多少元」
- 用價×股數推估會讓報酬率 / 損益略有偏差

改為直接輸入「實際金額」可：
- 精確對應對帳單
- 損益計算精確
- 平均價從「金額/股數」反推

## What Changes

### 輸入欄位改為「金額」

```
[代號*] [買入日*] [賣出日*] [買入金額*] [賣出金額*] [股數*] [+ 新增]
```

從「買入價/賣出價」改為「買入金額/賣出金額」（含手續費/證交稅後的實際金額）。

### 自動推算

| 衍生欄位 | 公式 | 對應 Trade 欄位 |
|---------|------|----------------|
| 損益（元） | `sellAmount − buyAmount` | `pnl` |
| 報酬率 | `pnl / buyAmount` | `returnRate` |
| 平均買入價 | `buyAmount / shares` | `buyPrice` |
| 平均賣出價 | `sellAmount / shares` | `sellPrice` |

### Trade 物件不變

`Trade` 型別仍有 `buyPrice` / `sellPrice` / `buyAmount` / `sellAmount` 4 欄，只是來源換了：
- 舊：使用者輸入 `price`，系統算 `amount`
- 新：使用者輸入 `amount`，系統算平均 `price`

### 介面提示

- 欄位 label 改「買入金額」「賣出金額」
- placeholder 範例改為金額（如 `85,000` 而非 `85`）
- 加說明：「請填**含手續費 / 證交稅後**的實際入帳金額（對應對帳單）」

## Capabilities

### Modified Capabilities

- `data-import-export`：手動輸入由「價」改為「金額」+ 股數

## Impact

- **影響檔案**：
  - `src/components/trade/TradeInputTable.tsx`：欄位 label、placeholder、計算邏輯
- **不影響**：
  - `Trade` 型別、calcPortfolioPerformance、CSV 匯入（CSV 仍可帶完整 12 欄）
  - 既有資料、tests
- **風險**：
  - 使用者可能誤填「總價」與「總金額」 — 用 placeholder 與說明文字引導
  - 若使用者只知道「價」不知道「金額」，需手動算「價 × 股數」，但若想精確就應該找對帳單
