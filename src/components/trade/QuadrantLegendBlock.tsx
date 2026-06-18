interface LegendItem {
  title: string
  desc: string
  bg: string
  text: string
  border: string
}

const ITEMS: LegendItem[] = [
  {
    title: '打法好・結果好',
    desc: '賠率高 且 獲利因子高，策略與執行雙優',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  {
    title: '打法差・結果好',
    desc: '賠率低 但 獲利因子高，靠資金或勝率撐場',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  {
    title: '打法差・結果差',
    desc: '兩者皆低或全敗且虧損，需全面檢討',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  {
    title: '單向紀錄',
    desc: '全勝或全敗，無法同時計算兩項指標',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
]

export default function QuadrantLegendBlock() {
  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">
          二、個股賠率 vs 獲利因子分析
        </h2>
        <p className="text-small text-dim mt-1 leading-relaxed">
          賠率衡量打法品質（策略邏輯），獲利因子衡量實際結果（含部位大小影響）。兩者差距可揭示打法與執行之間的落差。
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className={`${item.bg} border ${item.border} rounded-lg px-4 py-3`}
          >
            <p className={`text-body font-semibold ${item.text}`}>{item.title}</p>
            <p className={`text-small ${item.text} opacity-90 mt-1`}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
