import { Link } from 'react-router-dom'
import { useTradeStore } from '../../store/useTradeStore'
import { calcStockStats } from '../../lib/trade'
import QuadrantBadge from '../QuadrantBadge'
import { fmtMoney, fmtPct } from '../../utils/format'

interface Props {
  stockCode: string
  stockName: string
  /** 市場長期月賠率（來自 multi-scale EV 的 long.actualOdds），無資料時傳 null */
  marketPayoff: number | null
}

function compareInsight(market: number, mine: number): string {
  const diff = mine - market
  if (Math.abs(diff) < 0.2) return '市場面與你的執行相當，無顯著差距。'
  if (mine > market + 0.2) return '你比市場給的更好——進出場時機掌握優於平均。'
  return '市場機會夠好，但你的進出場時機可能要改善。'
}

function fmtRatio(n: number): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(2)
}

export default function MyTradeHistoryBlock({ stockCode, stockName, marketPayoff }: Props) {
  const allTrades = useTradeStore((s) => s.trades)
  const myTrades = allTrades.filter((t) => t.stockId === stockCode)

  // Empty 狀態
  if (myTrades.length === 0) {
    return (
      <div className="bg-elevated border border-base rounded-2xl p-6 space-y-2">
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">我在這檔的交易紀錄</h2>
        <p className="text-small text-dim">
          你尚未在「績效分析」中記錄這檔股票（{stockCode} {stockName}）的交易。
        </p>
        <Link
          to="/performance"
          className="inline-block text-small text-blue-600 hover:underline"
        >
          → 前往績效分析新增 / 上傳交易紀錄
        </Link>
      </div>
    )
  }

  // 取得 stockStats（用過濾後的 myTrades，整體 totalPnl 即為 myTotalPnl）
  const myTotalPnl = myTrades.reduce((s, t) => s + t.pnl, 0)
  const stats = calcStockStats(myTrades, stockCode, myTotalPnl)
  if (!stats) return null

  const hasMarket = marketPayoff !== null && isFinite(marketPayoff) && marketPayoff > 0
  const insight = hasMarket && isFinite(stats.payoffRatio)
    ? compareInsight(marketPayoff!, stats.payoffRatio)
    : null

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      {/* 標題 + 4 象限徽章 */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-h2 font-bold text-main tracking-wide">我在這檔的交易紀錄</h2>
          <p className="text-caption text-faint mt-0.5">
            來自本機儲存的「績效分析」資料
          </p>
        </div>
        <QuadrantBadge quadrant={stats.quadrant} compact />
      </div>

      {/* 摘要列 */}
      <p className="text-body num">
        共交易 <span className="font-semibold">{stats.nTrades}</span> 次 ·
        勝率 <span className="font-semibold">{(stats.winRate * 100).toFixed(0)}%</span> ·
        總損益{' '}
        <span className={`font-semibold ${stats.totalPnl > 0 ? 'text-red-700' : stats.totalPnl < 0 ? 'text-green-700' : 'text-main'}`}>
          {fmtMoney(stats.totalPnl)}
        </span>
      </p>

      {/* 市場 vs 我賠率對照 */}
      {hasMarket ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-label text-blue-700 uppercase tracking-wider">
            市場 vs 我的賠率對照
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-caption text-dim">市場長期月賠率</p>
              <p className="text-h1 num font-bold text-main">{fmtRatio(marketPayoff!)}</p>
              <p className="text-caption text-faint">來自 EV 多尺度長期資料</p>
            </div>
            <div>
              <p className="text-caption text-dim">你的交易賠率</p>
              <p className="text-h1 num font-bold text-main">{fmtRatio(stats.payoffRatio)}</p>
              <p className="text-caption text-faint">
                Avg Win {fmtPct(stats.avgWinReturnRate)} ÷ |Avg Loss {fmtPct(stats.avgLossReturnRate)}|
              </p>
            </div>
          </div>
          {insight && (
            <p className="text-small text-blue-700 pt-2 border-t border-blue-200">{insight}</p>
          )}
        </div>
      ) : (
        <p className="text-small text-faint italic">
          市場長期資料不足，無法對照
        </p>
      )}

      {/* 查看明細連結 */}
      <Link
        to={`/performance?stock=${stockCode}`}
        className="inline-block text-small text-blue-600 hover:underline"
      >
        → 查看完整交易明細（{stats.nTrades} 筆）
      </Link>
    </div>
  )
}
