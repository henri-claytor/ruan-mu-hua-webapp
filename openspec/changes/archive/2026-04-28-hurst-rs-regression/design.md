# Design: Hurst R/S Regression

## Context

R/S 分析法（rescaled range analysis）由 Hurst (1951) 提出。**正規做法**：

1. 把長度 N 的序列切成若干尺寸 `n_1 < n_2 < ... < n_k`
2. 對每個尺寸 `n_i`，把序列切成 `floor(N/n_i)` 個不重疊子窗口，計算每個子窗口的 R/S 值，取平均得到 `<R/S>_{n_i}`
3. 對 `(log(n_i), log(<R/S>_{n_i}))` 點集做線性迴歸
4. 迴歸斜率即為 Hurst 指數 H

**目前實作的「單點公式」`H = log(R/S) / log(n)`** 等價於只用 `(log(n), log(R/S))` 一個點，並假設另一端通過原點。這在 R/S 真的滿足冪律 `R/S ∝ n^H` 時是對的，但實務上：
- 短序列下 R/S 是不穩定的（單一窗口 noise 大）
- 沒有用多個 n 互相校正
- 結果對 n 的選取極為敏感

診斷測試證實單點公式有「small-sample 偏差」：白噪音 240 筆下平均 H = 0.528，理論應為 0.50。

## Goals / Non-Goals

**Goals:**
- 把 `calcHurst()` 升級為標準 R/S 迴歸法
- 維持公開介面相容：`result.h` / `result.cumDeviations` / `result.interpretation` 不變
- 在 `HurstResult` 新增 `points: RSPoint[]` 供 UI 展示迴歸過程
- 合成資料測試：白噪音 H 應更接近 0.5、強自相關 H 應 ≥ 0.7、強反趨勢 H 應 ≤ 0.2
- 計算耗時保持 < 10 ms / 240 筆

**Non-Goals:**
- 不改 `MultiScaleHurstResult` 的對外結構（仍是三個 `HurstResult`）
- 不引入第三方統計套件（線性迴歸 5 行可寫完）
- 不換成 DFA / 其他 Hurst 估計法
- 不改變 `MIN_N=10` 與「資料 < 10 筆回傳 null」的既有行為

## Decisions

### D1 — 子窗口尺寸選擇

**決策**：採用幾何級數 `[10, 20, 40, 80, 160]`，過濾「`size <= floor(N/2)`」的可用值。

**理由**：
- 幾何級數在 log 空間等距，對線性迴歸最友善
- 下限 10 與既有 `MIN_N` 一致
- 上限要求 `size <= N/2`，確保至少能切出 2 個不重疊子窗口（否則平均 R/S 退化為單點）
- 對 N=60（短期窗口）：可用尺寸為 [10, 20]——只有 2 個點，迴歸雖能算但誤差大；接受此限制
- 對 N=240（長期窗口）：可用尺寸為 [10, 20, 40, 80]——4 個點，迴歸品質好

**替代方案考慮**：
- 線性級數 `[15, 30, 45, 60, 75]`：在 log 空間距離不均，迴歸不平衡，拒絕
- 動態 `2^k` 至 N/2：點數隨 N 變動，不利測試一致性，拒絕
- 加入更多尺寸 `[8, 12, 16, 24, 32, 48, 64, 96, 128, 192]`：點數多但相鄰太近，子窗口數差異小，邊際效益低，拒絕

### D2 — 子窗口切片策略

**決策**：取序列尾部對齊，不重疊切片。例如 N=237、size=80 → 從 index 237-3*80 = -3 開始，取 3 個 80-window：`returns.slice(-240, -160)`、`slice(-160, -80)`、`slice(-80)`。剩餘的前 -3 筆丟棄。

**理由**：
- 尾部對齊符合「最近資料優先」原則（與 multi-scale Hurst 的 `slice(-60)` 對齊一致）
- 不重疊避免人工提高自相關
- 丟棄前段少量資料（< size 筆）對 R/S 平均影響微小

**替代方案考慮**：
- 重疊切片（每次前進 size/2）：增加樣本數但引入相關性 bias，拒絕
- 隨機切片：失去 reproducibility，拒絕

### D3 — 線性迴歸實作

**決策**：用最小平方法閉合解：

```typescript
function linearRegressionSlope(xs: number[], ys: number[]): number {
  const n = xs.length
  const meanX = average(xs)
  const meanY = average(ys)
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  return num / den
}
```

**理由**：5 行純函式、無依賴、O(n) 時間。不需要載入 numpy/regression 等套件。

**邊界處理**：
- 若可用尺寸 < 2 個（極短序列），fallback 回原本單點公式
- 若任何 R/S = 0（資料常數），回傳 null（既有行為）

### D4 — `HurstResult` 介面演變

**決策**：

```typescript
export interface RSPoint {
  n: number              // 子窗口尺寸
  rs: number             // 該尺寸下的 average R/S
  subWindowCount: number // 該尺寸切了幾個不重疊子窗口
}

export interface HurstResult {
  h: number                   // 從 log-log 迴歸得到的斜率
  r: number                   // 全序列 R（保留供舊 UI 顯示）
  s: number                   // 全序列 S
  n: number                   // 全序列長度
  mu: number
  cumDeviations: number[]
  interpretation: HurstInterpretation
  points: RSPoint[]           // ★ 新欄位：迴歸資料點
}
```

**理由**：
- 公開的 `h` / `cumDeviations` / `interpretation` 不變，所有現有呼叫端無感
- `r` / `s` / `n` 仍以全序列計算，保留給「對照用」（不再是 H 公式輸入但仍是有意義的統計量）
- `points` 為新欄位，UI 想顯示迴歸過程才用

### D5 — 計算步驟 UI 重新設計

**決策**：`MultiScaleHurstBlock` 的計算步驟摺疊區塊改為：

```
計算步驟（長期窗口 240 日，多窗口 R/S 迴歸法）

子窗口 n=10：切成 24 個子窗口，平均 R/S = 3.421
子窗口 n=20：切成 12 個子窗口，平均 R/S = 4.873
子窗口 n=40：切成 6 個子窗口，平均 R/S = 7.215
子窗口 n=80：切成 3 個子窗口，平均 R/S = 11.082

線性迴歸：log(R/S) = H × log(n) + c
H = 斜率 = 0.526
```

**理由**：
- 把「點集 + 迴歸結果」用文字表達清楚，使用者能跟著驗算
- 不畫迴歸散點圖（避免增加 UI 複雜度，未來若有需求再加）

**替代方案考慮**：
- 加 log-log 散點圖 + 迴歸線：學術上很經典，但 4 個點的散點圖視覺資訊量低，先不做

## Risks / Trade-offs

- **短期窗口（N=60）只有 2 個 R/S 點，迴歸統計意義較弱** → 緩解：仍照做但保留「樣本較小，誤差較大」UI 提示；極端情況（迴歸發散到 H < 0 或 H > 1）clip 到 [0, 1]
- **改寫後既有測試的 `r` `s` 斷言部分需要調整** → 已預期。`r` `s` 仍以全序列計算，原本的測試斷言（如 `r = MAX - MIN`）仍成立。只有「`H = log(r/s)/log(n)`」這個斷言會失效——將其重寫為「`H ≈ slope of log(R/S) vs log(n)`」
- **使用者升級後看到 H 值不同**：是否解釋給使用者？→ 不主動解釋（多數使用者只看「趨勢/隨機/回歸」三分類），僅在 ActionGuide 與計算步驟區塊呈現新邏輯
- **R/S 點數過少時 fallback 單點公式**：兩種演算法並存，行為差異可能造成測試 flakiness → 緩解：fallback 邊界明確（`points.length < 2 → fallback`），測試覆蓋兩條 path
