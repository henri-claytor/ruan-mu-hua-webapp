# Design: 組合 Hurst 嚴格對齊個股

## Context

`align-portfolio-page` change 讓組合頁的 Hurst 採用「多尺度 + 單尺度 fallback」雙模式，當時的設計理由是「不少組合會包含日報酬不足的股票，fallback 才不會沒 Hurst」。

但實際使用後，使用者發現：
1. 個股頁日報酬不足時直接顯示「資料不足」（無 fallback）
2. 組合頁日報酬不足時 fallback 單尺度
3. 兩頁體驗不一致

使用者明確要求嚴格對齊個股頁——資料不足就明確告知，不做 fallback。

## Goals / Non-Goals

**Goals:**
- 組合頁與個股頁的 Hurst 行為 100% 一致
- 簡化 PortfolioPage 的 Hurst 計算分支邏輯
- 刪除不再使用的 `PortfolioHurstBlock` 子元件

**Non-Goals:**
- 不動 `calcHurst` 函式本身（其他地方可能仍會用到）
- 不改 `MultiScaleHurstBlock` 元件
- 不調整 240 日門檻
- 不改個股頁

## Decisions

### D1 — 直接移除 fallback 邏輯

**決策**：刪除 PortfolioPage 中的 `hurstSingle` 計算與 `PortfolioHurstBlock` 子元件，Hurst 區塊只剩兩種狀態：

```jsx
{hurstMulti ? (
  <MultiScaleHurstBlock result={hurstMulti} titleOverride="組合趨勢延續性偵測" />
) : (
  <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
    <p className="text-small text-dim">
      <span className="font-semibold text-main">組合趨勢延續性偵測未顯示：</span>
      所有股票日報酬必須 ≥ 240 筆才能計算多尺度 Hurst。
      {stocksLackingDaily.length > 0 && (
        <>目前 {stocksLackingDaily.join('、')} 不足。</>
      )}
    </p>
  </div>
)}
```

**理由**：
- 與個股頁的「資料不足」說明列風格一致
- 額外列出哪些股票不足（複用既有 `stocksLackingDaily` 計算），幫助使用者知道要補哪支股票的資料
- 消除 fallback 邏輯後，PortfolioPage 計算分支從 3 個減為 2 個

### D2 — 移除 `PortfolioHurstBlock` 子元件

**決策**：直接刪除 `PortfolioHurstBlock` 函式（連同其 props 介面）。

**理由**：
- 該元件僅在 fallback 路徑被呼叫
- 沒有其他地方引用（已搜尋確認）
- 刪除可簡化 PortfolioPage.tsx 約 50 行

### D3 — 移除相關 import

**決策**：清掉以下不再使用的 import：

```typescript
// 移除
import { calcHurst, type HurstResult } from '../lib/hurst'  // calcHurst, HurstResult 不再用
import HurstLineChart from '../components/charts/HurstLineChart'  // 單尺度元件用的
```

保留：
```typescript
import { calcMultiScaleHurst, type MultiScaleHurstResult } from '../lib/hurst'
```

**理由**：清乾淨避免日後混淆。

### D4 — `stocksLackingDaily` 提示閾值調整

**決策**：既有 `stocksLackingDaily` 用 252 作為 fallback 判斷門檻；多尺度 Hurst 需要 240。改為兩個變數：

```typescript
// 既有：給 VaR 用，門檻 252
const useDailyFreq = stocks.every((s) => s.dailyReturns.length >= 252)
const stocksLackingDaily = useDailyFreq ? [] : stocks.filter(...)

// 新增：給 Hurst 用，門檻 240
const stocksLackingHurstDaily = stocks.filter(
  (s) => s.code && s.dailyReturns.length < 240
).map((s) => s.name || s.code)
```

**理由**：240 與 252 雖近但不同，保持各自正確的門檻。提示訊息使用 240 版本更精確。

## Risks / Trade-offs

- **使用者組合包含 ETF 等新標的時看不到 Hurst**：fallback 取消後此情境會直接顯示「資料不足」 → 接受。這是嚴格對齊個股頁的代價，使用者明確要求
- **既有有 fallback 邏輯的單尺度 Hurst 可能曾被某些使用者參考**：移除後體驗有差 → 接受。資料不足時的單尺度 Hurst 統計意義本來就有限
- **`PortfolioHurstBlock` 元件刪除後若未來想加回**：可從 git 歷史復原，無實際阻礙
