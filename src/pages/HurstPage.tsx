import { useState } from 'react'
import DataInput from '../components/DataInput'
import ResultCard from '../components/ResultCard'
import { calcHurst, type HurstResult } from '../lib/hurst'
import HurstLineChart from '../components/charts/HurstLineChart'
import { useAppStore } from '../store/useAppStore'
import { buildHurstSummary, copyTextToClipboard } from '../utils/export'

const interpretationStyle: Record<string, { bg: string; text: string; icon: string; desc: string }> = {
  '趨勢延續型（Persistent）': {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    icon: '📈',
    desc: 'H > 0.6：市場具有動能，過去的趨勢傾向延續。適合趨勢跟蹤策略。',
  },
  '隨機遊走型（Random Walk）': {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: '〰️',
    desc: 'H 介於 0.4–0.6：接近隨機遊走，未來走勢難以預測。與效率市場假說一致。',
  },
  '均值回歸型（Anti-persistent）': {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: '↩️',
    desc: 'H < 0.4：市場具有均值回歸傾向，漲多容易跌、跌多容易漲。適合逆勢策略。',
  },
}

function CopyButton({ onCopy, disabled }: { onCopy: () => Promise<void>; disabled: boolean }) {
  const [copied, setCopied] = useState(false)
  async function handle() {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handle}
      disabled={disabled}
      className="px-3 py-1.5 text-small bg-elevated border border-base rounded-lg text-dim
                 hover:text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {copied ? '已複製 ✓' : '複製摘要'}
    </button>
  )
}

export default function HurstPage() {
  const rawText = useAppStore((s) => s.hurstRawText)
  const setRawText = useAppStore((s) => s.setHurstRawText)
  const clearHurst = useAppStore((s) => s.clearHurst)

  const [result, setResult] = useState<HurstResult | null>(null)
  const [showTable, setShowTable] = useState(false)

  function handleData(text: string, returns: number[]) {
    setRawText(text)
    setResult(returns.length >= 10 ? calcHurst(returns) : null)
  }

  function handleClear() {
    clearHurst()
    setResult(null)
  }

  async function handleCopy() {
    if (!result) return
    await copyTextToClipboard(buildHurstSummary({ result }))
  }

  const style = result ? interpretationStyle[result.interpretation] : null

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 font-bold text-main">Hurst 指數（H 值）</h1>
          <p className="text-small text-dim mt-0.5">R/S Analysis — 分析報酬率序列的市場行為特性</p>
        </div>
        <button onClick={handleClear} className="text-small text-red-500 hover:text-red-700 underline">
          清除資料
        </button>
      </div>

      {/* 空態 */}
      {!result && rawText.trim() === '' && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">請在下方輸入月報酬率以開始計算</p>
          <p className="text-faint text-small mt-1">支援小數、百分比、CSV 或 Excel 貼上</p>
        </div>
      )}

      {/* 結果區 */}
      {result && style && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <CopyButton onCopy={handleCopy} disabled={!result} />
          </div>

          {/* H 值與解讀 */}
          <div className={`rounded-2xl border p-6 ${style.bg}`}>
            <div className="flex items-start gap-4">
              <span className="text-4xl">{style.icon}</span>
              <div>
                <p className={`text-h1 font-bold ${style.text}`}>{result.interpretation}</p>
                <p className={`text-small mt-1 ${style.text} opacity-80`}>{style.desc}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-caption text-dim uppercase tracking-wider">H 值</p>
                <p className={`text-display font-bold ${style.text}`}>{result.h.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* 計算步驟 */}
          <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-main">計算步驟</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="n（資料筆數）" value={result.n.toString()} />
              <ResultCard title="R（累積偏差全距）" value={result.r.toFixed(6)} subtitle="MAX(Xₜ) − MIN(Xₜ)" />
              <ResultCard title="S（標準差）" value={result.s.toFixed(6)} subtitle="STDEV(報酬率)" />
              <ResultCard title="R/S" value={(result.r / result.s).toFixed(4)} subtitle="= R ÷ S" />
            </div>
            <div className="bg-elevated rounded-lg p-4 text-small font-mono text-main space-y-1">
              <p>H = log(R/S) / log(n)</p>
              <p>H = log({(result.r / result.s).toFixed(4)}) / log({result.n})</p>
              <p className="font-bold text-blue-700">H = {result.h.toFixed(6)}</p>
            </div>

            <HurstLineChart cumDeviations={result.cumDeviations} />

            <div>
              <button
                onClick={() => setShowTable((v) => !v)}
                className="text-small text-blue-600 hover:text-blue-800 underline"
              >
                {showTable ? '▼ 隱藏' : '▶ 顯示'} 累積偏差數值表（{result.cumDeviations.length} 筆）
              </button>
              {showTable && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-base">
                  <table className="w-full text-caption font-mono">
                    <thead className="bg-elevated sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-dim">月份</th>
                        <th className="px-3 py-2 text-right text-dim">Xₜ（累積偏差）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.cumDeviations.map((x, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-elevated'}>
                          <td className="px-3 py-1 text-dim">{i + 1}</td>
                          <td className={`px-3 py-1 text-right ${x >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {x.toFixed(6)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 輸入區塊 */}
      <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
        <h2 className="text-h2 font-semibold text-main">輸入月報酬率</h2>
        <DataInput
          label="月報酬率序列"
          value={rawText}
          onChange={handleData}
          minCount={10}
        />
      </div>
    </div>
  )
}
