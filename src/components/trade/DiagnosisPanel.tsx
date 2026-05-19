import type { Diagnosis, DiagnosisLevel } from '../../lib/diagnosis'

interface Props {
  diagnoses: Diagnosis[]
}

interface LevelStyle {
  emoji: string
  bg: string
  border: string
  text: string
  badge: string
}

const STYLES: Record<DiagnosisLevel, LevelStyle> = {
  advantage: {
    emoji: '🟢',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  alert: {
    emoji: '🔴',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    emoji: '🟡',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  note: {
    emoji: '⚪',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  info: {
    emoji: 'ℹ️',
    bg: 'bg-elevated',
    border: 'border-base',
    text: 'text-dim',
    badge: 'bg-base/30 text-dim',
  },
}

const LEVEL_LABEL: Record<DiagnosisLevel, string> = {
  advantage: '優勢',
  alert: '警示',
  warning: '注意',
  note: '提醒',
  info: '資訊',
}

function DiagnosisCard({ d }: { d: Diagnosis }) {
  const style = STYLES[d.level]
  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 space-y-1.5`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-body">{style.emoji}</span>
        <span className={`text-body font-semibold ${style.text}`}>{d.title}</span>
        <span className={`text-caption px-2 py-0.5 rounded-full ${style.badge}`}>
          {LEVEL_LABEL[d.level]}
        </span>
      </div>
      <p className="text-small text-main">{d.message}</p>
      <p className={`text-small ${style.text}`}>→ {d.advice}</p>
    </div>
  )
}

export default function DiagnosisPanel({ diagnoses }: Props) {
  const portfolioDiagnoses = diagnoses.filter((d) => d.scope === 'portfolio')

  const advantages = portfolioDiagnoses.filter((d) => d.level === 'advantage')
  const risks = portfolioDiagnoses.filter((d) => d.level !== 'advantage')

  const counts = {
    advantage: advantages.length,
    alert: risks.filter((d) => d.level === 'alert').length,
    warning: risks.filter((d) => d.level === 'warning').length,
    note: risks.filter((d) => d.level === 'note').length,
    info: risks.filter((d) => d.level === 'info').length,
  }

  // 兩邊都空 → 整個 Panel 不渲染
  if (advantages.length === 0 && risks.length === 0) return null

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">自動診斷與建議</h2>
        <p className="text-caption text-faint mt-0.5">
          找到 {portfolioDiagnoses.length} 條觀察項目
          {counts.advantage > 0 && <span className="text-green-700 ml-1">· {counts.advantage} 優勢</span>}
          {counts.alert > 0 && <span className="text-red-700 ml-1">· {counts.alert} 警示</span>}
          {counts.warning > 0 && <span className="text-amber-700 ml-1">· {counts.warning} 注意</span>}
          {counts.note > 0 && <span className="text-blue-700 ml-1">· {counts.note} 提醒</span>}
          {counts.info > 0 && <span className="text-dim ml-1">· {counts.info} 資訊</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左欄：優勢 */}
        <div className="space-y-3">
          <h3 className="text-body font-semibold text-green-700">
            優勢（{advantages.length} 條）
          </h3>
          {advantages.length > 0 ? (
            advantages.map((d) => <DiagnosisCard key={d.id} d={d} />)
          ) : (
            <div className="bg-elevated border border-base rounded-xl p-4">
              <p className="text-small text-dim">持續累積交易紀錄以建立優勢視角</p>
            </div>
          )}
        </div>

        {/* 右欄：風險與注意事項 */}
        <div className="space-y-3">
          <h3 className="text-body font-semibold text-main">
            風險與注意事項（{risks.length} 條）
          </h3>
          {risks.length > 0 ? (
            risks.map((d) => <DiagnosisCard key={d.id} d={d} />)
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-body font-semibold text-green-700">✓ 暫無需要關注的問題</p>
              <p className="text-small text-green-700 mt-1">
                目前所有組合層級指標都在合理範圍內
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
