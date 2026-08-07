## 1. Draft 結構與欄位

- [x] 1.1 `Draft` 介面：`buyPrice` / `sellPrice` 改為 `buyAmount` / `sellAmount`
- [x] 1.2 `emptyDraft()` 對應
- [x] 1.3 placeholder 改為金額典型值（`85000` / `88000`）

## 2. 計算邏輯

- [x] 2.1 `handleSubmit` 內改為：
  - `buyPrice = buyAmount / shares`
  - `sellPrice = sellAmount / shares`
  - `pnl = sellAmount − buyAmount`
  - `returnRate = pnl / buyAmount`

## 3. UI label / 提示

- [x] 3.1 Field label：「買入價」→「買入金額」、「賣出價」→「賣出金額」
- [x] 3.2 下方說明文字更新：強調「含手續費、證交稅後」並對應對帳單
- [x] 3.3 移除原本「金額、損益、報酬率將自動計算」說明（已被新提示取代）

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 通過
- [x] 4.2 `npx vitest run` 通過
- [x] 4.3 `npm run build` 通過
- [x] 4.4 瀏覽器確認：
  - 6 欄改為金額版本
  - 提交後 Trade 物件 pnl / returnRate 由金額相減算出
  - 顯示在 RawTradeTable 數字符合預期
- [x] 4.5 部署 Vercel
