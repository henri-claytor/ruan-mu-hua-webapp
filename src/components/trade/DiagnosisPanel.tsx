import type { Diagnosis, DiagnosisLevel } from '../../lib/diagnosis'
import { WORDING } from '../../lib/wording'

interface Props {
  diagnoses: Diagnosis[]
}

/** level → ui-spec diag-item 三色（ok / warn / bad）+ 圖示 */
const LEVEL_TO_KIND: Record<DiagnosisLevel, 'ok' | 'warn' | 'bad'> = {
  advantage: 'ok',
  alert: 'bad',
  warning: 'warn',
  note: 'warn',
  info: 'warn',
}

const LEVEL_LABEL: Record<DiagnosisLevel, string> = {
  advantage: '優勢',
  alert: '警示',
  warning: '注意',
  note: '提醒',
  info: '資訊',
}

function DiagIcon({ kind }: { kind: 'ok' | 'warn' | 'bad' }) {
  const stroke =
    kind === 'ok' ? 'var(--color-negative)' :
    kind === 'bad' ? 'var(--color-positive)' :
    'var(--color-gold-dark)'
  if (kind === 'ok') {
    return (
      <svg className="diag-icon" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  if (kind === 'bad') {
    return (
      <svg className="diag-icon" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }
  return (
    <svg className="diag-icon" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function DiagnosisCard({ d }: { d: Diagnosis }) {
  const kind = LEVEL_TO_KIND[d.level]
  return (
    <div className={`diag-item ${kind}`}>
      <DiagIcon kind={kind} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`diag-title ${kind}`}>{d.title}</span>
          <span className="text-caption text-dim">{LEVEL_LABEL[d.level]}</span>
        </div>
        <p className="diag-desc mt-1">{d.message}</p>
        <p className="diag-desc mt-0.5">→ {d.advice}</p>
      </div>
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
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">{WORDING.diagnosisTitle}</h2>
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
