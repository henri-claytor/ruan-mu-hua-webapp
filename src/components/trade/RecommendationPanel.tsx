import type { Recommendation } from '../../lib/recommendations'

interface Props {
  recommendations: Recommendation[]
}

export default function RecommendationPanel({ recommendations }: Props) {
  if (recommendations.length === 0) return null

  return (
    <div
      id="performance-recommendations"
      className="bg-surface rounded-2xl border border-base p-6 space-y-4"
    >
      <div>
        <h2 className="text-h2 font-semibold text-main">重點建議</h2>
        <p className="text-caption text-faint mt-0.5">自動產生的具體行動建議</p>
      </div>

      <div className="space-y-3">
        {recommendations.map((r, i) => (
          <div
            key={r.id}
            className="flex gap-3 items-start bg-elevated border border-base rounded-xl p-4"
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-small font-semibold flex items-center justify-center"
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="flex-1 space-y-1">
              <h4 className="text-body font-semibold text-main">{r.title}</h4>
              <p className="text-small text-main leading-relaxed whitespace-pre-line">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
