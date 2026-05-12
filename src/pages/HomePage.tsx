import { Link } from 'react-router-dom'
import { Icon } from '../components/icons'

const forwardTools = [
  {
    to: '/individual',
    Icon: Icon.BarChart,
    title: '個股分析',
    desc: '選取股票後自動載入月報酬與日報酬，計算多尺度年化 EV、VaR、多尺度 Hurst 與蒙地卡羅模擬，並判斷四象限。',
    color: 'hover:border-blue-300 hover:bg-blue-50',
  },
  {
    to: '/portfolio',
    Icon: Icon.Folder,
    title: '投資組合',
    desc: '多支股票加權組合，計算組合 EV、VaR、Hurst 與蒙地卡羅模擬（P5/P50/P95），找出整體配置的優劣。',
    color: 'hover:border-green-300 hover:bg-green-50',
  },
  {
    to: '/compare',
    Icon: Icon.Scale,
    title: '比較分析',
    desc: '同時選取兩支股票，並排比較 EV、勝率、賠率、VaR 與 Hurst 指數，綠色高亮優勢方。',
    color: 'hover:border-amber-300 hover:bg-amber-50',
  },
] as const

const backwardTools = [
  {
    to: '/performance',
    Icon: Icon.ClipboardCheck,
    title: '績效分析',
    desc: '上傳已完成的交易紀錄（CSV 或手動），計算勝率、賠率、獲利因子；自動診斷打法品質與資金管理問題，可匯出 PDF / Excel 報告。',
    color: 'hover:border-purple-300 hover:bg-purple-50',
  },
] as const

interface ToolItem {
  to: string
  Icon: typeof Icon.Home
  title: string
  desc: string
  color: string
}

function ToolCard({ to, Icon: SvgIcon, title, desc, color }: ToolItem) {
  return (
    <Link
      to={to}
      className={`block bg-surface border-2 border-base rounded-2xl p-6
                  transition-all duration-200 ${color} group`}
    >
      <SvgIcon className="mb-3 text-main" size={28} />
      <h3 className="text-h2 font-bold text-main mb-2 group-hover:text-blue-700">{title}</h3>
      <p className="text-small text-dim leading-relaxed">{desc}</p>
      <div className="mt-4 text-small font-medium text-blue-600">開始使用 →</div>
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-6">
        <h1 className="text-display font-bold text-main mb-3">財商實戰課</h1>
        <p className="text-body text-dim max-w-xl mx-auto">
          進場前用市場資料評估標的；出場後用交易紀錄反思績效
          <br />
          一站式投資分析工具
        </p>
      </div>

      {/* 進場前評估 */}
      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-main">進場前評估</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {forwardTools.map((item) => (
            <ToolCard key={item.to} {...item} />
          ))}
        </div>
      </section>

      {/* 出場後反思 */}
      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-main">出場後反思</h2>
        <div className="grid md:grid-cols-1 gap-4">
          {backwardTools.map((item) => (
            <ToolCard key={item.to} {...item} />
          ))}
        </div>
      </section>

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
            <span>在選股器輸入股票代號或名稱，系統自動載入月報酬與日報酬數據</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-caption font-bold">3</span>
            <span>計算結果即時顯示於頁面，包含圖表與解讀說明</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-caption font-bold">4</span>
            <span>使用「複製摘要」或「下載 PNG」按鈕匯出結果</span>
          </li>
        </ol>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-base" />
          <span className="text-caption text-faint whitespace-nowrap">—— 或 ——</span>
          <div className="h-px flex-1 bg-base" />
        </div>

        <ol start={5} className="space-y-3 text-small text-dim">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-caption font-bold">5</span>
            <span>
              前往「績效分析」上傳已完成的交易紀錄（CSV 或手動輸入），系統自動產生勝率、賠率、獲利因子分析、4 象限診斷與 PDF / Excel 報告
            </span>
          </li>
        </ol>
      </div>

      {/* 計算說明 */}
      <div className="bg-elevated rounded-2xl border border-base p-6">
        <h2 className="text-h2 font-semibold text-main mb-3">計算邏輯說明</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-small text-dim">
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
          <div>
            <p className="font-semibold text-main mb-1">賠率與獲利因子</p>
            <p className="font-mono text-caption bg-surface rounded p-2">
              賠率 = Avg Gain / Avg Loss<br />
              PF = Σ獲利 / |Σ虧損|
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
