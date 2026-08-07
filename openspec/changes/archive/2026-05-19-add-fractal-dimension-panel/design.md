# Design: 分形維度 D 值技術指標 panel

## Context

分形維度 D（Hausdorff–Besicovitch dimension）是 1D 時間序列的「粗糙度量化」，與 Hurst 指數 H 的關係：

```
D = 2 − H
```

- H = 0.5 → D = 1.5（隨機漫步）
- H > 0.5 → D < 1.5（趨勢持續、平滑）
- H < 0.5 → D > 1.5（均值回歸、鋸齒）

D 範圍 [1, 2]：1 為直線、2 為純隨機。

## Goals / Non-Goals

**Goals:**
- 在個股頁加入「技術指標」panel，顯示 D 值
- 三尺度（短/中/長）並列，呼應 Hurst panel 結構
- 狀態分類 5 級（強趨勢 / 偏趨勢 / 接近隨機 / 偏均值回歸 / 強均值回歸）
- 純函式 + 測試

**Non-Goals:**
- 不重新計算 Hurst（直接從現有 MultiScaleHurstResult 推算）
- 不改 Hurst panel
- 不加 D 值歷史趨勢圖（只顯示當前值）
- 不影響其他頁面

## Decisions

### D1 — D 與 H 關係 + 狀態分類門檻

**決策**：

```typescript
export function hurstToFractalDimension(h: number): number {
  return 2 - h
}

export type FractalRegime =
  | 'strong-trend'      // D < 1.4 (H > 0.6)
  | 'mild-trend'        // 1.4 ≤ D < 1.48
  | 'random'            // 1.48 ≤ D ≤ 1.52 (H ≈ 0.5)
  | 'mild-mean-revert'  // 1.52 < D ≤ 1.6
  | 'strong-mean-revert'// D > 1.6

export function classifyFractalDimension(d: number): FractalRegime {
  if (d < 1.4) return 'strong-trend'
  if (d < 1.48) return 'mild-trend'
  if (d <= 1.52) return 'random'
  if (d <= 1.6) return 'mild-mean-revert'
  return 'strong-mean-revert'
}
```

**門檻選擇理由**：
- 1.5 ± 0.02 作為「隨機」中性區（H 0.48~0.52）
- 1.4 為 H ≥ 0.6 強趨勢（與 Hurst 業界共識相符）
- 1.6 為 H ≤ 0.4 強均值回歸

### D2 — 狀態文字 + 顏色

**決策**：

| Regime | 中文 | 色票 | chip 底色 |
|--------|------|------|----------|
| strong-trend | 強趨勢延續 | `text-red-700`（紅漲：趨勢正向）| `bg-red-50` |
| mild-trend | 偏趨勢 | `text-amber-700` | `bg-amber-50` |
| random | 接近隨機 | `text-dim` | `bg-elevated` |
| mild-mean-revert | 偏均值回歸 | `text-amber-700` | `bg-amber-50` |
| strong-mean-revert | 強均值回歸 | `text-green-700` | `bg-green-50` |

**注意**：紅漲綠跌語意 — 強趨勢 = 紅（正向），強均值回歸 = 綠（修正方向）。

### D3 — Panel 結構

**決策**：

```tsx
<div className="panel">
  <h2 className="panel-title">技術指標</h2>
  <p className="panel-sub">分形維度 D（Fractal Dimension）— 量化價格序列的「粗糙度」，D = 2 − H</p>
  <div className="grid grid-cols-3 gap-4">
    <ScaleDCard scale={hurst.short}  label="短期"   note="60 日窗口" />
    <ScaleDCard scale={hurst.medium} label="中期"   note="120 日窗口" />
    <ScaleDCard scale={hurst.long}   label="長期"   note="240 日窗口" />
  </div>
</div>
```

**ScaleDCard**：

```tsx
function ScaleDCard({ scale, label, note }: Props) {
  const d = hurstToFractalDimension(scale.h)
  const regime = classifyFractalDimension(d)
  return (
    <div className="bg-card2 border border-base rounded-lg px-[18px] py-4">
      <p className="text-[10.5px] text-dim tracking-[1.5px]">{label}</p>
      <p className="text-[10.5px] text-[#9a8a70] mb-3">{note}</p>
      <p className="text-[10.5px] text-dim tracking-[1px] mb-1">D 值</p>
      <p className="font-serif text-[24px] font-bold leading-none num">{d.toFixed(3)}</p>
      <span className={`inline-block mt-2 text-[10.5px] px-2 py-0.5 rounded-full ${chipClass(regime)}`}>
        {regimeLabel(regime)}
      </span>
    </div>
  )
}
```

### D4 — 位置

**決策**：個股頁區塊順序：

```
頁面結構：
1. Header
2. StockSelector + 查詢按鈕
3. Action buttons (Copy / Download)
4. 期望報酬與賠率優勢（EV）
5. 下行風險（VaR）
6. 趨勢延續性偵測（Hurst）
7. 🆕 技術指標（分形維度 D）       ← 新增
8. 未來資產淨值模擬（Monte Carlo）
9. 建議行動參考（ActionGuide）
10. 我在這檔的交易紀錄
```

### D5 — 資料來源與條件渲染

**決策**：

- 直接讀取 `results.hurst`（已存在 `MultiScaleHurstResult`）
- 條件：`hurst !== null` 才渲染（與 Hurst block 同條件）
- 若某個尺度 `h` 為 NaN（資料不足），該卡顯示「資料不足」

### D6 — 純函式 + 測試

**決策**：將 `hurstToFractalDimension` 與 `classifyFractalDimension` 放在 `src/lib/fractalDimension.ts`，並寫 6+ 個測試覆蓋邊界（D=1.4 / 1.48 / 1.5 / 1.52 / 1.6 / NaN）。

## Risks / Trade-offs

- **「分形維度」詞彙陌生**：副標已解釋「D = 2 − H」，並用「強趨勢 / 隨機 / 均值回歸」白話化判讀
- **與 Hurst 內容重疊**：兩者數學等價，但 D 對技術分析使用者更直觀。並列呈現可互相驗證
- **5 級分類門檻是經驗值**：未來可依使用者反饋微調
