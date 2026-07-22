import { Link } from 'react-router-dom'
import { Icon } from '../components/icons'

const forwardTools = [
  {
    to: '/individual',
    Icon: Icon.BarChart,
    title: '個股分析',
    desc: '選取股票後自動載入月報酬與日報酬，計算多尺度年化 EV、VaR、多尺度 Hurst 與蒙地卡羅模擬，並判斷四象限。',
  },
  {
    to: '/portfolio',
    Icon: Icon.Folder,
    title: '投資組合',
    desc: '多支股票加權組合，計算組合 EV、VaR、Hurst 與蒙地卡羅模擬（P5/P50/P95），找出整體配置的優勢。',
  },
  {
    to: '/compare',
    Icon: Icon.Scale,
    title: '比較分析',
    desc: '同時選取兩支股票，並排比較 EV、勝率、賠率、VaR 與 Hurst 指數，綠色高亮優勢方。',
  },
] as const

interface ToolItem {
  to: string
  Icon: typeof Icon.Home
  title: string
  desc: string
}

function FeatureCard({ to, Icon: SvgIcon, title, desc }: ToolItem) {
  return (
    <Link
      to={to}
      className="group relative block bg-surface border border-base rounded-lg px-5 pt-6 pb-5 overflow-hidden transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(26,17,8,0.13)]"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#9a7a2e] to-[#c9a84c] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
      <SvgIcon className="mb-3.5 text-[#9a7a2e] group-hover:text-[#c9a84c] transition-colors" size={27} />
      <h3 className="font-serif text-[16px] font-bold text-main mb-2 tracking-wide">{title}</h3>
      <p className="text-small text-main2 leading-relaxed">{desc}</p>
      <div className="inline-flex items-center gap-1 mt-4 text-small font-semibold text-[#9a7a2e] group-hover:gap-2 group-hover:text-[#c9a84c] transition-all">
        開始使用 <span>→</span>
      </div>
    </Link>
  )
}

function WideCard({ to, Icon: SvgIcon, title, desc }: ToolItem) {
  return (
    <Link
      to={to}
      className="group relative block bg-surface border border-base rounded-lg px-7 py-6 mb-10 overflow-hidden transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(26,17,8,0.13)]"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#9a7a2e] to-[#c9a84c] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
      <div className="flex items-start gap-[18px]">
        <SvgIcon className="text-[#9a7a2e] group-hover:text-[#c9a84c] transition-colors flex-shrink-0 mt-0.5" size={33} />
        <div className="flex-1">
          <h3 className="font-serif text-[16px] font-bold text-main mb-2 tracking-wide">{title}</h3>
          <p className="text-small text-main2 leading-relaxed">{desc}</p>
          <div className="inline-flex items-center gap-1 mt-4 text-small font-semibold text-[#9a7a2e] group-hover:gap-2 group-hover:text-[#c9a84c] transition-all">
            開始使用 <span>→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

const STEPS = [
  '選擇上方功能卡片，進入對應的分析工具',
  '在選股器輸入股票代號或名稱，系統自動載入報酬數據',
  '查看 EV、VaR、Hurst 等多維度指標，搭配蒙地卡羅模擬判斷進場時機',
  '交易完成後上傳紀錄，透過績效分析持續優化交易系統',
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12 u1">
        <h1 className="font-serif text-[34px] font-black text-main tracking-[5px]">
          獲利加速輔助系統
        </h1>
        <p className="mt-3 text-[13px] text-dim leading-[2.1]">
          進場前用市場資料評估標的；出場後用交易紀錄反思績效
          <br />
          一站式投資分析工具
        </p>
      </div>

      {/* 進場前評估 */}
      <div className="font-serif text-[15px] font-bold text-[#9a7a2e] tracking-[2px] mb-4 u2">
        進場前評估
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 u3">
        {forwardTools.map((item) => (
          <FeatureCard key={item.to} {...item} />
        ))}
      </div>

      {/* 出場後反思 */}
      <div className="font-serif text-[15px] font-bold text-[#9a7a2e] tracking-[2px] mb-4 u4">
        出場後反思
      </div>
      <div className="u5">
        <WideCard
          to="/performance"
          Icon={Icon.ClipboardCheck}
          title="績效分析"
          desc="上傳已完成的交易紀錄（CSV 或手動），計算勝率、賠率、獲利因子；自動診斷打法品質與資金管理問題，可匯出 PDF / Excel 報告。"
        />
      </div>

      {/* 會員專區 */}
      <div className="font-serif text-[15px] font-bold text-[#9a7a2e] tracking-[2px] mb-4 u5">
        會員專區
      </div>
      <div className="mb-10 u5">
        <WideCard
          to="/reports"
          Icon={Icon.FileText}
          title="報告分享"
          desc="市場資訊交流，非投資建議。登入即可檢視，不需另外申請 Google 存取權限。"
        />
      </div>

      {/* 如何使用 */}
      <div className="bg-card2 rounded-lg p-7 border border-base u6">
        <div className="font-serif text-[13px] font-bold text-[#9a7a2e] tracking-[3px] mb-5">
          如何使用
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[11px]">
          {STEPS.map((text, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3.5 py-3 rounded-md bg-[rgba(255,255,255,0.5)] border border-[rgba(154,122,46,0.07)]"
            >
              <div className="w-[23px] h-[23px] bg-[#9a7a2e] text-white rounded-full flex items-center justify-center text-[10.5px] font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="text-[12px] text-main2 leading-[1.8] pt-0.5">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
