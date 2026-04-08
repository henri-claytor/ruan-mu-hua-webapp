import { useState } from 'react'
import DataInput from '../components/DataInput'
import ResultCard from '../components/ResultCard'
import { calcHurst, type HurstResult } from '../lib/hurst'
import HurstLineChart from '../components/charts/HurstLineChart'

const SAMPLE_DATA = [
  0.0412, -0.0231, 0.0587, 0.0123, -0.0345, 0.0678, -0.0156, 0.0289, 0.0445, -0.0112,
  0.0534, 0.0267, -0.0423, 0.0356, 0.0189, -0.0278, 0.0612, 0.0034, -0.0189, 0.0467,
  0.0523, -0.0312, 0.0278, 0.0145, -0.0234, 0.0589, 0.0023, -0.0445, 0.0378, 0.0212,
  0.0456, -0.0123, 0.0312, 0.0234, -0.0567, 0.0489, 0.0156, -0.0234, 0.0423, 0.0089,
  -0.0312, 0.0567, 0.0234, -0.0178, 0.0445, 0.0312, -0.0256, 0.0534, 0.0178, -0.0389,
  0.0456, 0.0234, -0.0312, 0.0567, 0.0089, -0.0234, 0.0412, 0.0178, -0.0145, 0.0523,
  0.0289, -0.0367, 0.0456, 0.0123, -0.0278, 0.0534, 0.0212, -0.0189, 0.0378, 0.0045,
  0.0489, -0.0234, 0.0312, 0.0178, -0.0312, 0.0567, 0.0234, -0.0145, 0.0423, 0.0089,
  -0.0256, 0.0512, 0.0267, -0.0389, 0.0445, 0.0156, -0.0178, 0.0523, 0.0312, -0.0234,
  0.0467, 0.0189, -0.0345, 0.0534, 0.0078, -0.0212, 0.0456, 0.0234, -0.0156, 0.0389,
  0.0312, -0.0278, 0.0523, 0.0145, -0.0234, 0.0489, 0.0178, -0.0312, 0.0412, 0.0234,
  -0.0189, 0.0567, 0.0289, -0.0345, 0.0456, 0.0123, -0.0256, 0.0512, 0.0189, -0.0278,
].join('\n')

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
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    icon: '↩️',
    desc: 'H < 0.4：市場具有均值回歸傾向，漲多容易跌、跌多容易漲。適合逆勢策略。',
  },
}

export default function HurstPage() {
  const [result, setResult] = useState<HurstResult | null>(null)
  const [showTable, setShowTable] = useState(false)

  function handleData(returns: number[]) {
    if (returns.length >= 10) {
      setResult(calcHurst(returns))
    } else {
      setResult(null)
    }
  }

  function loadSample() {
    handleData(SAMPLE_DATA.split('\n').map(Number))
  }

  const style = result ? interpretationStyle[result.interpretation] : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hurst 指數（H 值）</h1>
        <p className="text-gray-500 text-sm mt-1">
          R/S Analysis — 分析報酬率序列的市場行為特性
        </p>
      </div>

      {/* ── 結果區塊 ── */}
      {result && style && (
        <div className="space-y-4">
          {/* H 值與解讀 */}
          <div className={`rounded-2xl border p-6 ${style.bg}`}>
            <div className="flex items-start gap-4">
              <span className="text-4xl">{style.icon}</span>
              <div>
                <p className={`text-xl font-bold ${style.text}`}>{result.interpretation}</p>
                <p className={`text-sm mt-1 ${style.text} opacity-80`}>{style.desc}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">H 值</p>
                <p className={`text-5xl font-bold ${style.text}`}>{result.h.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* 計算步驟 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">計算步驟</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="n（資料筆數）" value={result.n.toString()} />
              <ResultCard
                title="R（累積偏差全距）"
                value={result.r.toFixed(6)}
                subtitle="MAX(Xₜ) − MIN(Xₜ)"
              />
              <ResultCard
                title="S（標準差）"
                value={result.s.toFixed(6)}
                subtitle="STDEV(報酬率)"
              />
              <ResultCard
                title="R/S"
                value={(result.r / result.s).toFixed(4)}
                subtitle="= R ÷ S"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700 space-y-1">
              <p>H = log(R/S) / log(n)</p>
              <p>
                H = log({(result.r / result.s).toFixed(4)}) / log({result.n})
              </p>
              <p className="font-bold text-blue-700">H = {result.h.toFixed(6)}</p>
            </div>

            {/* 累積偏差圖表 */}
            <HurstLineChart cumDeviations={result.cumDeviations} />

            {/* 累積偏差數值表（可折疊） */}
            <div>
              <button
                onClick={() => setShowTable((v) => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showTable ? '▼ 隱藏' : '▶ 顯示'} 累積偏差數值表（{result.cumDeviations.length} 筆）
              </button>
              {showTable && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs font-mono">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600">月份</th>
                        <th className="px-3 py-2 text-right text-gray-600">Xₜ（累積偏差）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.cumDeviations.map((x, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-1 text-gray-500">{i + 1}</td>
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

      {/* ── 輸入區塊 ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">輸入月報酬率</h2>
          <button
            onClick={loadSample}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            載入範例數據
          </button>
        </div>
        <DataInput
          label="月報酬率序列"
          placeholder={'每行一筆，例如：\n0.0412\n-0.0231\n0.0587\n...'}
          onChange={handleData}
          minCount={10}
        />
        {!result && (
          <p className="text-sm text-gray-400">輸入數據後，H 值計算結果將自動顯示於上方。</p>
        )}
      </div>
    </div>
  )
}
