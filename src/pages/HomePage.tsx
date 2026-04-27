import { Link } from 'react-router-dom'

const tools = [
  {
    to: '/individual',
    icon: '📊',
    title: '個股期望值計算',
    desc: '輸入月報酬率，計算勝率、EV、VaR 95%/99%、蒙地卡羅 1/3/5 年模擬，並判斷四象限。',
    color: 'hover:border-blue-300 hover:bg-blue-50',
  },
  {
    to: '/portfolio',
    icon: '🗂️',
    title: '投資組合分析',
    desc: '多支股票加權組合，計算 EV、VaR 95%/99%、蒙地卡羅 1/3/5 年模擬（P5/P50/P95）。',
    color: 'hover:border-green-300 hover:bg-green-50',
  },
  {
    to: '/hurst',
    icon: '〰️',
    title: 'Hurst 指數（H 值）',
    desc: 'R/S Analysis 分析報酬率序列，判斷市場為趨勢延續、隨機遊走或均值回歸型態。',
    color: 'hover:border-purple-300 hover:bg-purple-50',
  },
  {
    to: '/compare',
    icon: '⚖️',
    title: '個股並排比較',
    desc: '同時輸入兩支股票，並排比較 EV、勝率、賠率、VaR 與 Hurst 指數，綠色高亮優勢方。',
    color: 'hover:border-amber-300 hover:bg-amber-50',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-6">
        <h1 className="text-display font-bold text-main mb-3">📈 財商實戰課</h1>
        <p className="text-body text-dim max-w-xl mx-auto">
          阮慕驊《財商實戰課》配套分析工具
          <br />
          輸入歷史報酬率，即時計算期望值、風險值與市場行為指數
        </p>
      </div>

      {/* 工具卡片 */}
      <div className="grid md:grid-cols-2 gap-4">
        {tools.map(({ to, icon, title, desc, color }) => (
          <Link
            key={to}
            to={to}
            className={`block bg-surface border-2 border-base rounded-2xl p-6
                        transition-all duration-200 ${color} group`}
          >
            <div className="text-4xl mb-3">{icon}</div>
            <h2 className="text-h2 font-bold text-main mb-2 group-hover:text-blue-700">{title}</h2>
            <p className="text-small text-dim leading-relaxed">{desc}</p>
            <div className="mt-4 text-small font-medium text-blue-600">開始使用 →</div>
          </Link>
        ))}
      </div>

      {/* 使用說明 */}
      <div className="bg-surface rounded-2xl border border-base p-6">
        <h2 className="text-h2 font-semibold text-main mb-4">如何使用</h2>
        <ol className="space-y-3 text-small text-dim">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-caption font-bold">1</span>
            <span>選擇上方功能卡片，進入對應的分析工具</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-caption font-bold">2</span>
            <span>將月報酬率資料貼入文字框（每行一筆，或逗號/Tab 分隔；支援小數或百分比格式）</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-caption font-bold">3</span>
            <span>計算結果即時顯示於頁面頂部，包含圖表與解讀說明</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-caption font-bold">4</span>
            <span>使用「複製摘要」或「下載 PNG」按鈕匯出結果</span>
          </li>
        </ol>
      </div>

      {/* 計算說明 */}
      <div className="bg-elevated rounded-2xl border border-base p-6">
        <h2 className="text-h2 font-semibold text-main mb-3">計算邏輯說明</h2>
        <div className="grid md:grid-cols-3 gap-4 text-small text-dim">
          <div>
            <p className="font-semibold text-main mb-1">期望值（EV）</p>
            <p className="font-mono text-caption bg-surface rounded p-2">
              EV = 勝率 × Avg Gain<br />− 敗率 × Avg Loss
            </p>
          </div>
          <div>
            <p className="font-semibold text-main mb-1">VaR 計算</p>
            <p className="font-mono text-caption bg-surface rounded p-2">
              VaR 95% = 第 5 百分位數<br />
              VaR 99% = 第 1 百分位數
            </p>
          </div>
          <div>
            <p className="font-semibold text-main mb-1">Hurst 指數</p>
            <p className="font-mono text-caption bg-surface rounded p-2">
              H = log(R/S) / log(n)<br />
              R = MAX(Xₜ) − MIN(Xₜ)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
