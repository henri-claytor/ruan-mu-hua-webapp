import { useState } from 'react'
import type { MultiScaleHurstResult, HurstResult, Divergence } from '../../lib/hurst'
import {
  hurstToFractalDimension,
  classifyFractalDimension,
  fractalRegimeLabel,
  type FractalRegime,
} from '../../lib/fractalDimension'
import { fmtRatio } from '../../utils/format'

interface Props {
  hurst: MultiScaleHurstResult
}

// ── Divergence banner ────────────────────────────────────────────────────────

interface BannerStyle {
  text: string
  bg: string
  border: string
  textColor: string
}

function bannerStyle(d: Divergence): BannerStyle {
  switch (d) {
    case 'stable':
      return {
        text: '三尺度 D 值一致，走勢規律性穩定',
        bg: 'bg-elevated',
        border: 'border-base',
        textColor: 'text-dim',
      }
    case 'short-strengthening':
      // H 短 > 長 → D 短 < 長：近期走勢更規律 / 動能轉強
      return {
        text: '⚠ 短期走勢更規律：近期動能轉強（D 值降低）',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'short-weakening':
      // H 短 < 長 → D 短 > 長：近期走勢更雜亂 / 動能減弱
      return {
        text: '⚠ 短期走勢更雜亂：近期動能減弱（D 值升高）',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-700',
      }
    case 'mixed':
      return {
        text: '三尺度 D 值有差異，狀態觀察中',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        textColor: 'text-blue-700',
      }
  }
}

// ── Single scale card ────────────────────────────────────────────────────────

const CHIP_STYLE: Record<FractalRegime, string> = {
  'strong-trend':        'bg-red-50 text-red-700',
  'mild-trend':          'bg-amber-50 text-amber-700',
  'random':              'bg-elevated text-dim',
  'mild-mean-revert':    'bg-amber-50 text-amber-700',
  'strong-mean-revert':  'bg-green-50 text-green-700',
}

function colorForD(d: number): 'red' | 'green' | 'default' {
  if (d < 1.4) return 'red'     // 強趨勢
  if (d > 1.6) return 'green'   // 強均值回歸
  return 'default'
}

interface ScaleCardProps {
  label: string
  windowDesc: string
  scale: HurstResult
  showSampleWarning?: boolean
}

function ScaleCard({ label, windowDesc, scale, showSampleWarning }: ScaleCardProps) {
  const d = hurstToFractalDimension(scale.h)
  const valid = Number.isFinite(d)
  const numClass =
    colorForD(d) === 'red' ? 'text-red-700' :
    colorForD(d) === 'green' ? 'text-green-700' :
    'text-main'

  return (
    <div className="space-y-2">
      <div className="text-center">
        <p className="text-label text-faint uppercase tracking-wider">{label}</p>
        <p className="text-caption text-faint">{windowDesc}</p>
      </div>
      {valid ? (
        <>
          <div className="bg-card2 border border-base rounded-xl px-4 py-3 text-center">
            <p className="text-[10.5px] text-dim tracking-[1px] mb-1">分形維度 D</p>
            <p className={`font-serif text-display font-bold leading-none num ${numClass}`}>
              {fmtRatio(d)}
            </p>
          </div>
          <div className="text-center">
            <span className={`inline-block text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${
              CHIP_STYLE[classifyFractalDimension(d)]
            }`}>
              {fractalRegimeLabel(classifyFractalDimension(d))}
            </span>
          </div>
        </>
      ) : (
        <div className="bg-elevated rounded-xl p-4 text-center">
          <p className="text-small text-faint">資料不足</p>
        </div>
      )}
      {showSampleWarning && valid && (
        <p className="text-caption text-center text-faint">樣本較小，誤差較大</p>
      )}
    </div>
  )
}

// ── D 值光譜圖（橫向軸 1.0 → 2.0 + 三尺度標記） ─────────────────────────────────

interface SpectrumProps {
  dShort: number
  dMedium: number
  dLong: number
}

function FractalSpectrum({ dShort, dMedium, dLong }: SpectrumProps) {
  // D 範圍 1.0–2.0；視覺上以 0~1 比例放在橫軸
  const toX = (d: number) => Math.max(0, Math.min(1, (d - 1.0) / 1.0)) * 100
  const markers: { d: number; label: string; color: string }[] = [
    { d: dShort,  label: '短期', color: '#c0392b' }, // 紅
    { d: dMedium, label: '中期', color: '#9a7a2e' }, // 金
    { d: dLong,   label: '長期', color: '#2e7d52' }, // 綠
  ].filter((m) => Number.isFinite(m.d))

  return (
    <div className="bg-elevated rounded-xl p-5 space-y-3">
      <p className="text-caption text-dim text-center">
        D 值光譜（1.0 → 2.0）· 越接近 1 走勢越規律、越接近 2 走勢越雜亂
      </p>
      <div className="relative h-16">
        {/* 5 區段背景 */}
        <div className="absolute inset-x-0 top-6 h-3 flex rounded-full overflow-hidden">
          <div className="bg-red-100" style={{ width: '40%' }} title="強趨勢" />
          <div className="bg-amber-100" style={{ width: '8%' }} title="偏趨勢" />
          <div className="bg-base/40" style={{ width: '4%' }} title="接近隨機" />
          <div className="bg-amber-100" style={{ width: '8%' }} title="偏均值回歸" />
          <div className="bg-green-100" style={{ width: '40%' }} title="強均值回歸" />
        </div>
        {/* 中線 1.5 */}
        <div className="absolute top-5 h-5 w-px bg-dim" style={{ left: '50%' }} />
        <p className="absolute top-11 text-caption text-faint" style={{ left: '50%', transform: 'translateX(-50%)' }}>
          1.5
        </p>

        {/* 邊界 1.0 / 2.0 */}
        <p className="absolute top-11 left-0 text-caption text-faint">1.0</p>
        <p className="absolute top-11 right-0 text-caption text-faint">2.0</p>

        {/* 標記 */}
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${toX(m.d)}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-caption font-semibold whitespace-nowrap" style={{ color: m.color }}>
              {m.label} {fmtRatio(m.d)}
            </span>
            <div className="w-px h-7 mt-0.5" style={{ background: m.color }} />
            <div
              className="w-2 h-2 rounded-full border-2 border-white shadow"
              style={{ background: m.color, marginTop: '-4px' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main block ───────────────────────────────────────────────────────────────

export default function FractalDimensionBlock({ hurst }: Props) {
  const [open, setOpen] = useState(true)
  const [stepsOpen, setStepsOpen] = useState(false)
  const banner = bannerStyle(hurst.divergence)

  const dShort = hurstToFractalDimension(hurst.short.h)
  const dMedium = hurstToFractalDimension(hurst.medium.h)
  const dLong = hurstToFractalDimension(hurst.long.h)

  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h2 className="font-serif text-h2 font-bold text-main tracking-wide text-left">
            走勢規律性偵測
          </h2>
          <p className="text-caption text-faint text-left mt-0.5">
            分形維度 D（D = 2 − H）· 60/120/240 日多尺度 · 量化走勢「規律 vs 雜亂」的程度
          </p>
        </div>
        <span className="text-faint text-small">{open ? '▼ 收折' : '▶ 展開'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          {/* 趨勢狀態診斷橫幅 */}
          <div className={`${banner.bg} border ${banner.border} rounded-xl px-4 py-3`}>
            <p className={`text-body font-semibold ${banner.textColor}`}>{banner.text}</p>
          </div>

          {/* 三卡片並列 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScaleCard
              label="短期"
              windowDesc="最近 60 個交易日（約 3 個月）"
              scale={hurst.short}
              showSampleWarning
            />
            <ScaleCard
              label="中期"
              windowDesc="最近 120 個交易日（約 6 個月）"
              scale={hurst.medium}
            />
            <ScaleCard
              label="長期"
              windowDesc="最近 240 個交易日（約 1 年）"
              scale={hurst.long}
            />
          </div>

          {/* 光譜圖 */}
          <div className="border-t border-base pt-4">
            <FractalSpectrum dShort={dShort} dMedium={dMedium} dLong={dLong} />
          </div>

          {/* 計算步驟（可摺疊，預設關閉） */}
          <div className="border-t border-base pt-4">
            <button
              type="button"
              onClick={() => setStepsOpen((v) => !v)}
              className="text-small text-dim hover:text-main transition-colors"
            >
              {stepsOpen ? '▼ 收折計算步驟' : '▶ 展開計算步驟'}
            </button>
            {stepsOpen && (
              <div className="mt-3 bg-elevated rounded-lg p-4 text-small num space-y-1.5 text-main">
                <p className="text-dim">分形維度 D 由 Hurst 指數推算（1D 時間序列）：</p>
                <p className="font-semibold text-main">D = 2 − H</p>
                <table className="w-full text-small mt-2">
                  <thead className="text-dim text-caption">
                    <tr>
                      <th className="text-left py-1">尺度</th>
                      <th className="text-left py-1">窗口</th>
                      <th className="text-left py-1">Hurst H</th>
                      <th className="text-left py-1">推算 D = 2 − H</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-base">
                      <td className="py-1">短期</td>
                      <td className="py-1">60 日</td>
                      <td className="py-1">{Number.isFinite(hurst.short.h) ? hurst.short.h.toFixed(4) : '—'}</td>
                      <td className="py-1 font-semibold text-red-700">
                        {Number.isFinite(dShort) ? dShort.toFixed(4) : '—'}
                      </td>
                    </tr>
                    <tr className="border-t border-base">
                      <td className="py-1">中期</td>
                      <td className="py-1">120 日</td>
                      <td className="py-1">{Number.isFinite(hurst.medium.h) ? hurst.medium.h.toFixed(4) : '—'}</td>
                      <td className="py-1 font-semibold text-red-700">
                        {Number.isFinite(dMedium) ? dMedium.toFixed(4) : '—'}
                      </td>
                    </tr>
                    <tr className="border-t border-base">
                      <td className="py-1">長期</td>
                      <td className="py-1">240 日</td>
                      <td className="py-1">{Number.isFinite(hurst.long.h) ? hurst.long.h.toFixed(4) : '—'}</td>
                      <td className="py-1 font-semibold text-red-700">
                        {Number.isFinite(dLong) ? dLong.toFixed(4) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-dim pt-2 border-t border-base">
                  D 範圍 [1, 2]：D ≈ 1.5 為純隨機；D &lt; 1.5 表示走勢規律（趨勢延續）；D &gt; 1.5 表示走勢雜亂（均值回歸 / 逆勢）。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
