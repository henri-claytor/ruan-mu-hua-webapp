# Proposal: Hurst R/S Regression

## Why

目前 `calcHurst()` 使用「單點」R/S 公式：`H = log(R/S) / log(n)`。診斷測試顯示這個公式雖能區分不同性質的序列（白噪音 0.53、強自相關 0.75、強反趨勢 0.12），但實測 10 支台股後發現 H 值集中在 0.45–0.60，且**單一 H 值是迴歸線的點估計，雜訊大、不夠可靠**：例如鴻海長期 H = 0.619 看起來「趨勢」，但這個 0.619 是單一窗口算出的點，不能代表迴歸斜率。學術正規做法是「多窗口 R/S 迴歸」——對序列切成多個不同尺寸的子窗口，每個尺寸計算 R/S，再對 log(n) vs log(R/S) 做線性迴歸，**斜率才是真正的 Hurst 指數**。

## What Changes

- **將 `calcHurst()` 升級為多窗口 R/S 迴歸**：對輸入序列在多個窗口尺寸（如 [10, 20, 40, 80, 160] 中的可用值）計算平均 R/S，對 log-log 做線性迴歸，回傳斜率作為 H
- **新增 `RSPoint[]` 欄位**到 `HurstResult`：包含每個 (n, R/S) 點，供 UI 顯示迴歸過程
- **計算步驟區塊改寫**：原本顯示 `μ / R / S / H = log(R/S)/log(n)` 改為顯示 `(n_i, R/S_i)` 點清單 + 線性迴歸結果
- **保留 `cumDeviations`**：以「全序列」為基準產生（用於既有 HurstLineChart 不變）
- **驗證**：用 4 種合成資料測試（白噪音 / 強自相關 / 強反趨勢 / 飄移）+ 重跑 10 支實際個股對比舊新 H 值

## Capabilities

### New Capabilities
- （無新增 capability，這是既有 `hurst-calculator` 的算法升級）

### Modified Capabilities
- `hurst-calculator`：算法從單點 R/S 改為多窗口 R/S 線性迴歸，介面新增 `points: RSPoint[]` 欄位

## Impact

- `src/lib/hurst.ts`：重寫 `calcHurst()` 內部演算法；`HurstResult` 介面新增 `points`
- `src/lib/hurst.test.ts`：既有測試的 `result.r` / `result.s` 斷言需調整（單一 r/s 仍保留作為「全序列」的值，但 H 不再以此計算）
- `src/lib/hurst.diagnostic.test.ts`：新版本應更貼近理論值（白噪音更接近 0.5、強自相關 ≥ 0.75）
- `src/components/charts/MultiScaleHurstBlock.tsx`：計算步驟區塊改顯示 `points` 表格與迴歸式
- `web-app/scripts/diagnose-real-stocks.mjs`：複製升級後的 `calcHurst` 邏輯，重跑 10 支對比
- 其他使用 `calcHurst` 的 IndividualPage / PortfolioPage：無需改動（公開介面 `result.h` 不變）

無 API 異動、無 store 異動、無第三方依賴。
