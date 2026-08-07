# Design: 組合頁套用個股頁全套邏輯

## Context

個股頁的「主判斷金邊 + 副卡 + 參考橫列 + ActionGuide 頂部 + 白話命名 + 統一卡片結構」已完整呈現。組合頁需要同步以保持兩頁體驗一致。

## Goals / Non-Goals

**Goals:**
- 組合頁區塊順序：ActionGuide（頂） → EV → 個股 vs 組合對比 → VaR → Hurst → 走勢規律性 D → Monte Carlo
- 組合頁 VaR / MC 採與個股頁同結構（主判斷金邊卡 + 橫列參考 / 主判斷大卡 + 副卡）
- 新增「組合走勢規律性偵測」（FractalDimensionBlock）區塊
- 命名一致（VaR → 下行虧損、賠率 → 損益比）

**Non-Goals:**
- 不重構共用元件（短期容忍個股 / 組合各自的 VarBlock / McBlock 結構接近但獨立）
- 不動 calcPortfolio* 計算邏輯
- 不動股票選擇、加權配置 UI（屬輸入區）
- 不動 StockVsPortfolioComparison（屬個股對比，不適用「主判斷」單一結論邏輯）

## Decisions

### D0 — 手動「計算組合」按鈕

**決策**：

```tsx
const [computed, setComputed] = useState(false)

// 改變 stocks / weights → 重置 computed
useEffect(() => { setComputed(false) }, [stocks, weights, hasData, weightValid])

function handleCompute() {
  if (!ready) return
  setComputed(true)
}

// 按鈕渲染（放在加權配置區塊內部底）
<button
  onClick={handleCompute}
  disabled={!ready || isAnyLoading}
  className="btn btn-solid"
>
  {isAnyLoading ? '載入中...' : computed ? '重新計算' : '計算組合'}
</button>

// 結果區改為 computed && ready 才渲染
{computed && ready && evResult && ...}
```

**觸發 reset 的條件**：
- 新增 / 移除股票
- 改變權重
- 任何股票 dailyReturns / monthlyReturns 變化（fetch 完成後）

**理由**：
- 與個股頁「查詢」按鈕邏輯一致
- 使用者調整中不會看到結果跳動，按下後才看
- 已計算後改動 → reset 為 disabled「計算組合」，再次明確按下才更新

### D1 — 新區塊順序

```
1. Header（清除組合）
2. 股票選擇 + 加權配置（輸入區、可摺疊）
3. 操作建議（ActionGuide，金邊強化）   ← 移到這
4. 期望報酬與損益比優勢（EV，多尺度）
5. 個股 vs 組合對比                    ← 既有，保留位置
6. 下行風險（VaR）
7. 趨勢延續性偵測（Hurst）
8. 走勢規律性偵測（D）                  ← 新增
9. 未來資產淨值模擬（MC）
```

### D2 — PortfolioVarBlock 改造

採與個股 VarBlock 同款結構：
- 主卡：95% 下行虧損（金邊 2px + 主判斷 chip + 風險等級徽章 + 40px 大數字 + 底層「N 筆樣本第 5 百分位」）
- 99% 橫向參考列
- Histogram 在最下

### D3 — PortfolioMcBlock 改造

採與個股 McBlock 同款結構：
- 3 卡並排（1 年 / 3 年 / 5 年），5 年為主判斷
- 每卡：年期主標 + 中位情境大數字 + 悲觀/樂觀底層 + μ/σ（僅主卡）
- FanChart 在最下

### D4 — 新增 FractalDimensionBlock

```tsx
{hurstMulti && <FractalDimensionBlock hurst={hurstMulti} />}
```

加在 MultiScaleHurstBlock 之後。FractalDimensionBlock 已有 titleOverride 嗎？沒有。**接受**：組合頁顯示與個股頁相同的標題「走勢規律性偵測」，因 D 值是純數學推算，不需區分。

### D5 — 命名修正

- `PortfolioVarBlock` 內所有「VaR 95%」「VaR 99%」→「95% 下行虧損」「99% 下行虧損」
- 「組合 VaR 95%」→「組合 95% 下行虧損」（或統一去除「組合」前綴用「95% 下行虧損」即可）
- 各 subtitle 內「VaR」字眼移除

### D6 — Migration 順序

1. PortfolioVarBlock 完整改寫
2. PortfolioMcBlock 完整改寫
3. ActionGuide 移到頂部、調整區塊順序
4. 加 FractalDimensionBlock
5. 驗證 tsc / vitest / build / 瀏覽器確認 / 部署

## Risks / Trade-offs

- **重複代碼**：個股 / 組合各自的 VarBlock / McBlock 接近但獨立 — 短期 OK，未來可抽 `<MetricBlock>` 共用
- **「組合 VaR」主判斷 chip + 個股 EV 主判斷 chip + Hurst 主判斷 chip 同頁**：使用者看到多個「主判斷」可能困惑 — 接受，因每個區塊內部各有結論
- **StockVsPortfolioComparison 結構未套金邊** — 它是表格不是卡片，沿用既有
