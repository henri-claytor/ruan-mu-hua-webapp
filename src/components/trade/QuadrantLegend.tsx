/**
 * 5 象限說明圖例（顯示於矩陣表上方）
 *
 * 用 2×2 grid 顯示 Q1–Q4，下方再加單向紀錄一格。
 * 配色與 QuadrantBadge 一致。
 */

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
    desc: '賠率高 + 獲利因子高，策略與執行雙優',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  {
    title: '打法差・結果好',
    desc: '賠率低 + 獲利因子高，靠資金或勝率撐場',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  {
    title: '打法好・結果差',
    desc: '賠率高 + 獲利因子低，資金管理需改善',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
  {
    title: '打法差・結果差',
    desc: '兩者皆低或全敗，需全面檢討',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
]

const UNIDIRECTIONAL: LegendItem = {
  title: '單向紀錄',
  desc: '全勝或全敗，無法同時計算賠率與獲利因子',
  bg: 'bg-slate-50',
  text: 'text-slate-700',
  border: 'border-slate-300',
}

export default function QuadrantLegend() {
  return (
    <div className="px-6 py-4 border-b border-base bg-elevated/30 space-y-2">
      <p className="text-caption text-dim mb-1">
        分類說明：賠率衡量打法品質（策略邏輯），獲利因子衡量實際結果（含部位大小影響）
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className={`${item.bg} border ${item.border} rounded-lg px-3 py-2`}
          >
            <p className={`text-small font-semibold ${item.text}`}>{item.title}</p>
            <p className={`text-caption ${item.text} opacity-90`}>{item.desc}</p>
          </div>
        ))}
      </div>
      <div
        className={`${UNIDIRECTIONAL.bg} border ${UNIDIRECTIONAL.border} rounded-lg px-3 py-2`}
      >
        <p className={`text-small font-semibold ${UNIDIRECTIONAL.text}`}>
          {UNIDIRECTIONAL.title}
        </p>
        <p className={`text-caption ${UNIDIRECTIONAL.text} opacity-90`}>
          {UNIDIRECTIONAL.desc}
        </p>
      </div>
    </div>
  )
}
