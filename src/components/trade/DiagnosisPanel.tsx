import type { Diagnosis, DiagnosisLevel } from '../../lib/diagnosis'

interface Props {
  diagnoses: Diagnosis[]
}

const LEVEL_LABEL: Record<DiagnosisLevel, string> = {
  advantage: '優勢',
  alert: '風險',
  warning: '風險',
  note: '提醒',
  info: '資訊',
}

const LEVEL_COLOR: Record<DiagnosisLevel, string> = {
  advantage: 'text-green-700',
  alert: 'text-red-700',
  warning: 'text-amber-700',
  note: 'text-blue-700',
  info: 'text-dim',
}

function ParagraphItem({ d }: { d: Diagnosis }) {
  const label = LEVEL_LABEL[d.level]
  const color = LEVEL_COLOR[d.level]
  return (
    <div className="space-y-1">
      <p className={`text-body font-semibold ${color}`}>
        {label}：{d.title}
      </p>
      <p className="text-small text-main leading-relaxed">
        {d.message}
        {d.advice && (
          <>
            <span className="text-dim">　→　</span>
            {d.advice}
          </>
        )}
      </p>
    </div>
  )
}

export default function DiagnosisPanel({ diagnoses }: Props) {
  const portfolioDiagnoses = diagnoses.filter((d) => d.scope === 'portfolio')

  const advantages = portfolioDiagnoses.filter((d) => d.level === 'advantage')
  const risks = portfolioDiagnoses.filter((d) => d.level !== 'advantage')

  if (portfolioDiagnoses.length === 0) return null

  const ordered = [...advantages, ...risks]

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <h3 className="font-serif text-h2 font-bold text-main tracking-wide">
        整體績效評估
      </h3>
      <div className="space-y-4">
        {ordered.map((d) => (
          <ParagraphItem key={d.id} d={d} />
        ))}
      </div>
    </div>
  )
}
