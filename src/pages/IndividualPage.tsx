import { useState } from 'react'
import DataInput from '../components/DataInput'
import ResultCard from '../components/ResultCard'
import QuadrantBadge from '../components/QuadrantBadge'
import { calcEV, type EVResult } from '../lib/ev'

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

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
}

export default function IndividualPage() {
  const [result, setResult] = useState<EVResult | null>(null)

  function handleData(returns: number[]) {
    if (returns.length >= 10) {
      setResult(calcEV(returns))
    } else {
      setResult(null)
    }
  }

  function loadSample() {
    handleData(SAMPLE_DATA.split('\n').map(Number))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">個股期望值計算</h1>
        <p className="text-gray-500 text-sm mt-1">輸入 120 筆月報酬率，計算 EV、賠率與象限判斷</p>
      </div>

      {/* ── 結果置頂區塊 ── */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-800">計算結果</h2>
            <QuadrantBadge quadrant={result.quadrant} />
          </div>

          {/* 核心指標 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ResultCard
              title="期望值 EV"
              value={fmt(result.ev)}
              color={result.ev >= 0 ? 'green' : 'red'}
              large
            />
            <ResultCard
              title="實際賠率"
              value={result.actualOdds.toFixed(2)}
              subtitle="Avg Gain ÷ Avg Loss"
              color="blue"
            />
            <ResultCard
              title="損益平衡賠率"
              value={result.breakEvenOdds.toFixed(2)}
              subtitle="敗率 ÷ 勝率"
            />
            <ResultCard
              title="賠率優勢"
              value={result.actualOdds > result.breakEvenOdds ? '有優勢' : '無優勢'}
              color={result.actualOdds > result.breakEvenOdds ? 'green' : 'red'}
            />
          </div>

          {/* 基礎統計 */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              基礎統計
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="勝率" value={fmt(result.winRate)} color="green" />
              <ResultCard title="敗率" value={fmt(result.lossRate)} color="red" />
              <ResultCard title="Avg Gain" value={fmt(result.avgGain)} color="green" />
              <ResultCard title="Avg Loss" value={fmt(result.avgLoss)} color="red" />
            </div>
          </div>

          {/* 賠率計算步驟 */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              計算步驟
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono space-y-1 text-gray-700">
              <p>EV = 勝率 × Avg Gain − 敗率 × Avg Loss</p>
              <p>
                EV = {fmt(result.winRate)} × {fmt(result.avgGain)} − {fmt(result.lossRate)} ×{' '}
                {fmt(result.avgLoss)}
              </p>
              <p className={`font-bold ${result.ev >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                EV = {fmt(result.ev)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 輸入區塊 */}
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
          label="月報酬率（120 筆）"
          placeholder={'每行一筆，例如：\n0.0412\n-0.0231\n0.0587\n...'}
          onChange={handleData}
          minCount={10}
        />
        {!result && (
          <p className="text-sm text-gray-400">輸入數據後，計算結果將自動顯示於上方。</p>
        )}
      </div>
    </div>
  )
}
